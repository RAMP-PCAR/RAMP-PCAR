﻿/* global define, console, RAMP, $, i18n */

/**
*
*
* @module RAMP
* @submodule Map
*/

/**
* Layer Loader class.
*
* Handles the asynchronous loading of map layers (excluding basemaps)
* This includes dealing with errors, and raising appropriate events when the layer loads
*
* ####Imports RAMP Modules:
* {{#crossLink "AttributeLoader"}}{{/crossLink}}
* {{#crossLink "EventManager"}}{{/crossLink}}
* {{#crossLink "FeatureClickHandler"}}{{/crossLink}}
* {{#crossLink "FilterManager"}}{{/crossLink}}
* {{#crossLink "GlobalStorage"}}{{/crossLink}}
* {{#crossLink "GraphicExtension"}}{{/crossLink}}
* {{#crossLink "LayerItem"}}{{/crossLink}}
* {{#crossLink "Map"}}{{/crossLink}}
* {{#crossLink "MapClickHandler"}}{{/crossLink}}
* {{#crossLink "Util"}}{{/crossLink}}
*
* @class LayerLoader
* @static
* @uses dojo/topic
* @uses esri/geometry/Extent
* @uses esri/layers/GraphicsLayer
* @uses esri/tasks/GeometryService
* @uses esri/tasks/ProjectParameters
*/

define([
/* Dojo */
"dojo/topic",

/* ESRI */
"esri/layers/GraphicsLayer", "esri/tasks/GeometryService", "esri/tasks/ProjectParameters", "esri/geometry/Extent",

/* RAMP */
"ramp/eventManager", "ramp/map", "ramp/globalStorage", "ramp/featureClickHandler", "ramp/mapClickHandler",
"ramp/filterManager", "ramp/layerItem", "ramp/attributeLoader", "ramp/graphicExtension",

/* Util */
"utils/util"],

    function (
    /* Dojo */
    topic,

    /* ESRI */
    GraphicsLayer, GeometryService, ProjectParameters, EsriExtent,

    /* RAMP */
    EventManager, RampMap, GlobalStorage, FeatureClickHandler, MapClickHandler,
    FilterManager, LayerItem, AttributeLoader, GraphicExtension,

     /* Util */
    UtilMisc) {
        "use strict";

        var idCounter = 0;

        /**
        * Get an auto-generated layer id.  This works because javascript is single threaded: if this gets called
        * from a web-worker at some point it will need to be synchronized.
        *
        * @method  nextId
        * @returns {String} an auto-generated layer id
        */
        function nextId() {
            idCounter += 1;
            return 'rampAutoId_' + idCounter;
        }

        /**
        * Get a layer config for a given layer ID.
        *
        * @method  getLayerConfig
        * @param   {String} layerId a RAMP layer ID
        * @returns {Object} a RAMP config object from the layer registry
        */
        function getLayerConfig(layerId) {
            var layer = RAMP.layerRegistry[layerId];
            return layer ? layer.ramp.config : null;
        }

        /**
        * Will set a layerId's layer selector state to a new state.
        *
        * @method updateLayerSelectorState
        * @private
        * @param  {String} layerId config id of the layer
        * @param  {String} newState the state to set the layer to in the layer selector
        * @param  {Boolean} abortIfError if true, don't update state if current state is an error state
        * @param  {Object} [options] additional options for layer item (mostly error messages in this case)
        */
        function updateLayerSelectorState(layerId, newState, abortIfError, options) {
            if (abortIfError) {
                var layerState;
                layerState = FilterManager.getLayerState(layerId);

                //check if this layer is in an error state.  if so, exit the function
                if (layerState === LayerItem.state.ERROR) {
                    return;
                }
            }

            //set layer selector to new state
            FilterManager.setLayerState(layerId, newState, options);
        }

        /**
        * Determines if the layer has an active hilight for the highlight type (defined by the state).
        *
        * @method isValidHilight
        * @private
        * @param  {Object} layer map layer object
        * @param  {Object} state the state of a highlight (defines if active and layer it applies to)
        * @returns {Boolean} if layer has valid highlight
        */
        function isValidHilight(layer, state) {
            var ret = false;
            if (state.objId >= 0) {
                //there is an active highlight
                if (layer.id === state.layerId) {
                    //it belongs to this layer
                    ret = true;
                }
            }
            return ret;
        }

        /**
        * Will remove a layer from the map, along with any related items (bounding box, feature data) and adjust counts.
        *
        * @method removeFromMap
        * @private
        * @param {String} layerId config id of the layer
        */
        function removeFromMap(layerId) {
            var map = RampMap.getMap(),
                bbLayer = RampMap.getBoundingBoxMapping()[layerId],
                layer = map._layers[layerId];

            if (layer) {
                map.removeLayer(layer);
            } else {
                //layer was kicked out of the map.  grab it from the registry
                layer = RAMP.layerRegistry[layerId];
            }

            //if bounding box exists, and is in the map, remove it too
            if (bbLayer) {
                if (map._layers[bbLayer.id]) {
                    map.removeLayer(bbLayer);
                    RAMP.layerCounts.bb -= 1;
                }
                delete RampMap.getBoundingBoxMapping()[layer.id];
            }

            //remove data, if it exists
            if (RAMP.data[layerId]) {
                delete RAMP.data[layerId];
            }

            //just incase its really weird and layer is not in the registry
            if (layer) {
                //adjust layer counts
                switch (layer.ramp.type) {
                    case GlobalStorage.layerType.wms:
                        if (layer.ramp.load.inCount) {
                            RAMP.layerCounts.wms -= 1;
                            layer.ramp.load.inCount = false;
                        }
                        break;

                    case GlobalStorage.layerType.feature:
                    case GlobalStorage.layerType.Static:

                        if (layer.ramp.load.inCount) {
                            RAMP.layerCounts.feature -= 1;
                            layer.ramp.load.inCount = false;
                        }
                        break;
                }
            }
        }

        /**
        * This function initiates the loading of an ESRI layer object to the map.
        * Will add it to the map in the appropriate spot, wire up event handlers, and generate any bounding box layers
        * Note: a point of confusion.  The layer objects "load" event may have already finished by the time this function is called.
        *       This means the object's constructor has initialized itself with the layers data source.
        * This functions is not event triggered to guarantee the order in which things are added.
        *
        * @method _loadLayer
        * @private
        * @param  {Object} layer an instantiated, unloaded ESRI layer object
        * @param  {Integer} reloadIndex Optional.  If reloading a layer, supply the index it should reside at.  Do not set for new layers
        */
        function _loadLayer(layer, reloadIndex) {
            var insertIdx,
                layerSection,
                map = RampMap.getMap(),
                layerConfig = layer.ramp.config,
                lsState,
                options = {},
                isNotReload = typeof reloadIndex === 'undefined';

            if (!layer.ramp) {
                console.log('you failed to supply a ramp.type to the layer!');
            }

            //derive section
            switch (layer.ramp.type) {
                case GlobalStorage.layerType.wms:
                    layerSection = GlobalStorage.layerType.wms;
                    if (isNotReload) {
                        insertIdx = RAMP.layerCounts.base + RAMP.layerCounts.wms;

                        // generate wms legend image url and store in the layer config
                        if (layerConfig.legendMimeType) {
                            layer.ramp.config.legend = {
                                type: "wms",
                                imageUrl: String.format("{0}?SERVICE=WMS&REQUEST=GetLegendGraphic&TRANSPARENT=true&VERSION=1.1.1&FORMAT={2}&LAYER={3}",
                                    layerConfig.url,
                                    layer.version,
                                    layerConfig.legendMimeType,
                                    layerConfig.layerName
                                )
                            };
                        }
                    } else {
                        insertIdx = reloadIndex;
                    }

                    RAMP.layerCounts.wms += 1;
                    layer.ramp.load.inCount = true;

                    break;

                case GlobalStorage.layerType.feature:
                case GlobalStorage.layerType.Static:
                    layerSection = GlobalStorage.layerType.feature;
                    if (isNotReload) {
                        //NOTE: these static layers behave like features, in that they can be in any position and be re-ordered.
                        insertIdx = RAMP.layerCounts.feature;
                    } else {
                        insertIdx = reloadIndex;
                    }
                    RAMP.layerCounts.feature += 1;
                    layer.ramp.load.inCount = true;

                    break;
            }

            //add layer to map, triggering the loading process.  should add at correct position
            //do this before creating layer selector item, as the layer selector inspects the map
            //object to make state decisions
            map.addLayer(layer, insertIdx);

            //sometimes the ESRI api will kick a layer out of the map if it errors after the add process.
            //store a pointer here so we can find it (and it's information)
            // TODO - this write to layer registry should be refactored into a call to state manager
            RAMP.layerRegistry[layer.id] = layer;

            //derive initial state
            switch (layer.ramp.load.state) {
                case "loaded":
                    lsState = LayerItem.state.LOADED;
                    break;
                case "loading":
                    //IE10 hack. since IE10 will not fire the loaded event, check the loaded flag of the layer object
                    if (layer.loaded) {
                        lsState = LayerItem.state.LOADED;
                    } else {
                        lsState = LayerItem.state.LOADING;
                    }
                    break;
                case "error":
                    options.notices = {
                        error: {
                            message: i18n.t("filterManager.notices.error.connect")
                        }
                    };

                    lsState = LayerItem.state.ERROR;
                    break;
            }

            //add entry to layer selector
            if (isNotReload) {
                options.state = lsState; // pass initial state in the options object
                FilterManager.addLayer(layerSection, layer.ramp, options);
            } else {
                updateLayerSelectorState(layerConfig.id, lsState, false, options);
            }
            layer.ramp.load.inLS = true;

            //this will force a recreation of the highlighting graphic group.
            //if not done, can cause mouse interactions to get messy if adding more than
            //one layer at one time
            topic.publish(EventManager.Map.REORDER_END);

            //wire up event handlers to the layer
            switch (layer.ramp.type) {
                case GlobalStorage.layerType.wms:

                    // WMS binding for getFeatureInfo calls
                    if (layerConfig.featureInfo) {
                        MapClickHandler.registerWMSClick(layer);
                    }
                    break;

                case GlobalStorage.layerType.feature:

                    //initiate the feature data download
                    if (layer.url) {
                        //service based. get feature data from the service
                        AttributeLoader.loadAttributeData(layer.id, layer.url, layer.ramp.type);
                    } else {
                        //file based. scrape data from the layer
                        AttributeLoader.extractAttributeData(layer);
                    }

                    //TODO consider the case where a layer was loaded by the user, and we want to disable things like maptips?
                    //wire up click handler
                    layer.on("click", function (evt) {
                        evt.stopImmediatePropagation();
                        FeatureClickHandler.onFeatureSelect(evt);
                    });

                    //wire up mouse over / mouse out handler
                    layer.on("mouse-over", function (evt) {
                        FeatureClickHandler.onFeatureMouseOver(evt);
                    });

                    layer.on("mouse-out", function (evt) {
                        FeatureClickHandler.onFeatureMouseOut(evt);
                    });

                    //generate bounding box                        
                    if (layerConfig.layerExtent) {
                        var boundingBoxExtent,
                            boundingBox = new GraphicsLayer({
                                id: String.format("boundingBoxLayer_{0}", layer.id),
                                visible: layerConfig.settings.boundingBoxVisible
                            });
                   
                        boundingBoxExtent = new EsriExtent(layerConfig.layerExtent);
                        boundingBox.ramp = { type: GlobalStorage.layerType.BoundingBox };

                        //TODO test putting this IF before the layer creation, see what breaks.  ideally if there is no box, we should not make a layer

                            if (UtilMisc.isSpatialRefEqual(boundingBoxExtent.spatialReference, map.spatialReference)) {
                                //layer is in same projection as basemap.  can directly use the extent
                                boundingBox.add(UtilMisc.createGraphic(boundingBoxExtent));
                            } else {
                                //layer is in different projection.  reproject to basemap

                                var box = RampMap.localProjectExtent(boundingBoxExtent, map.spatialReference);
                                boundingBox.add(UtilMisc.createGraphic(box));

                                //Geometry Service Version.  Makes a more accurate bounding box, but requires an arcserver
                                /*
                                var params = new ProjectParameters(),
                                    gsvc = new GeometryService(RAMP.config.geometryServiceUrl);
                                params.geometries = [boundingBoxExtent];
                                params.outSR = map.spatialReference;

                                gsvc.project(params, function (projectedExtents) {
                                    console.log('esri says: ' + JSON.stringify(projectedExtents[0]));
                                    console.log('proj4 says: ' + JSON.stringify(box));
                                });
                                */
                            }

                        //add mapping to bounding box
                        RampMap.getBoundingBoxMapping()[layer.id] = boundingBox;

                        //bounding boxes are on top of feature layers
                        insertIdx = RAMP.layerCounts.feature + RAMP.layerCounts.bb;
                        RAMP.layerCounts.bb += 1;

                        map.addLayer(boundingBox, insertIdx);

                    break;
                    }
            }

            // publish LAYER_ADDED event for every added layer
            topic.publish(EventManager.LayerLoader.LAYER_ADDED, { layer: layer, layerCounts: RAMP.layerCounts });
        }

        return {
            /**
            * Initializes properties.  Set up event listeners
            *
            * @method init
            */
            init: function () {
                topic.subscribe(EventManager.LayerLoader.LAYER_LOADED, this.onLayerLoaded);
                topic.subscribe(EventManager.LayerLoader.LAYER_UPDATED, this.onLayerUpdateEnd);
                topic.subscribe(EventManager.LayerLoader.LAYER_UPDATING, this.onLayerUpdateStart);
                topic.subscribe(EventManager.LayerLoader.LAYER_ERROR, this.onLayerError);
                topic.subscribe(EventManager.LayerLoader.REMOVE_LAYER, this.onLayerRemove);
                topic.subscribe(EventManager.LayerLoader.RELOAD_LAYER, this.onLayerReload);
            },

            /**
            * Deals with a layer that had an error when it tried to load.
            *
            * @method onLayerError
            * @param  {Object} evt
            * @param  {Object} evt.layer the layer object that failed
            * @param  {Object} evt.error the error object
            */
            onLayerError: function (evt) {
                console.error("failed to load layer " + evt.layer.url, evt.error);

                evt.layer.ramp.load.state = "error";

                var layerId = evt.layer.id,
                    // generic error notice
                    errorMessage = i18n.t("filterManager.notices.error.load"),
                    options;

                //get that failed layer outta here
                removeFromMap(layerId);

                // customize error notices based on the error type as much as possible
                if (evt.error.code === 400) {
                    errorMessage = i18n.t("filterManager.notices.error.draw");
                }

                options = {
                    notices: {
                        error: {
                            message: errorMessage
                        }
                    }
                };

                //if layer is in layer selector, update the status
                if (evt.layer.ramp.load.inLS) {
                    updateLayerSelectorState(evt.layer.ramp.config.id, LayerItem.state.ERROR, false, options);
                }
            },

            /**
            * Reacts when a layer begins to update.  This happens when a feature layer starts to download its data.
            * Data download doesn't start until points are made visible.  It also happens when a WMS requests a new picture.
            *
            * @method onLayerUpdateStart
            * @param  {Object} evt
            * @param  {Object} evt.layer the layer object that loaded
            */
            onLayerUpdateStart: function (evt) {
                RampMap.updateDatagridUpdatingState(evt.layer, true);

                //console.log("LAYER UPDATE START: " + evt.layer.url);
                updateLayerSelectorState(evt.layer.ramp.config.id, LayerItem.state.UPDATING, true);
            },

            /**
            * Reacts when a layer has updated successfully.  This means the layer has pulled its data and displayed it.
            *
            * @method onLayerUpdateEnd
            * @param  {Object} evt
            * @param  {Object} evt.layer the layer object that loaded
            */
            onLayerUpdateEnd: function (evt) {
                var g;

                //check if we have any active highlites for this layer
                if (isValidHilight(evt.layer, RAMP.state.hilite.click)) {
                    //re-request the click hilight
                    g = GraphicExtension.findGraphic(RAMP.state.hilite.click.objId, evt.layer.id);
                    if (g) {
                        topic.publish(EventManager.FeatureHighlighter.HIGHLIGHT_SHOW, {
                            graphic: g
                        });
                    } //else graphic is off-view and does not exist in layer. dont' change higlight
                }

                if (isValidHilight(evt.layer, RAMP.state.hilite.zoom)) {
                    //re-request the zoom hilight
                    g = GraphicExtension.findGraphic(RAMP.state.hilite.zoom.objId, evt.layer.id);
                    if (g) {
                        topic.publish(EventManager.FeatureHighlighter.ZOOMLIGHT_SHOW, {
                            graphic: g
                        });
                    } //else graphic is off-view and does not exist in layer. dont' change higlight
                }

                //IE10 hack.  since IE10 doesn't fire a loaded event, we need to also set the loaded flag on layer here.
                //            don't do it if it's in error state.  once an error, always an error
                if (evt.layer.ramp.load.state !== "error") {
                    evt.layer.ramp.load.state = "loaded";
                }

                RampMap.updateDatagridUpdatingState(evt.layer);

                updateLayerSelectorState(evt.layer.ramp.config.id, LayerItem.state.LOADED, true);
            },

            /**
            * Reacts when a layer has loaded successfully.  This means the site has shaken hands with the layer and it seems ok.
            * This does not mean data has been downloaded
            *
            * @method onLayerLoaded
            * @param  {Object} evt
            * @param  {Object} evt.layer the layer object that loaded
            */
            onLayerLoaded: function (evt) {
                //set state to loaded
                //if we have a row in layer selector, update it to loaded (unless already in error)

                //set flags that we have loaded ok
                evt.layer.ramp.load.state = "loaded";

                //if a row already exists in selector, set it to LOADED state. (unless already in error state)
                if (evt.layer.ramp.load.inLS) {
                    updateLayerSelectorState(evt.layer.ramp.config.id, LayerItem.state.LOADED, true);
                }

                console.log("layer loaded: " + evt.layer.url);
            },

            /**
            * Reacts to a request for a layer to be removed.  This removes the layer from the entire app.
            *
            * @method onLayerRemove
            * @param  {Object} evt
            * @param  {Object} evt.layerId the layer id to be removed
            */
            onLayerRemove: function (evt) {
                var layer,
                    configIdx,
                    layerSection,
                    configCollection;

                    layer = RAMP.layerRegistry[evt.layerId];

                //derive section layer is in and the config collection it is in
                switch (layer.ramp.type) {
                    case GlobalStorage.layerType.wms:
                        layerSection = GlobalStorage.layerType.wms;
                        configCollection = RAMP.config.layers.wms;
                        break;

                    case GlobalStorage.layerType.feature:
                    case GlobalStorage.layerType.Static:
                        layerSection = GlobalStorage.layerType.feature;
                        configCollection = RAMP.config.layers.feature;
                        break;
                }

                //remove item from layer selector
                FilterManager.removeLayer(layerSection, evt.layerId);

                removeFromMap(evt.layerId);

                //remove node from config
                configIdx = configCollection.indexOf(layer.ramp.config);
                configCollection.splice(configIdx, 1);

                delete RAMP.layerRegistry[evt.layerId];

                // publish LAYER_REMOVED event for every removed layer
                topic.publish(EventManager.LayerLoader.LAYER_REMOVED, { layer: layer, layerCounts: RAMP.layerCounts });
            },

            /**
            * Reacts to a request for a layer to be reloaded.  Usually the case when a layer errors and user wants to try again
            *
            * @method onLayerReload
            * @param  {Object} evt
            * @param  {Object} evt.layerId the layer id to be reloaded
            */
            onLayerReload: function (evt) {
                var curlayer,
                    layerConfig,
                    user,
                    newLayer,
                    layerIndex,
                    layerList,
                    idArray,
                    cleanIdArray;

                removeFromMap(evt.layerId);

                    curlayer = RAMP.layerRegistry[evt.layerId];

                layerConfig = curlayer.ramp.config;
                user = curlayer.ramp.user;

                //figure out index of layer
                //since the layer may not be in the map, we have to use some trickery to derive where it is sitting

                //get our list of layers
                layerList = $("#" + RAMP.config.divNames.filter).find("#layerList").find("> li > ul");

                //make an array of the ids in order of the list on the page
                idArray = layerList
                            .map(function (i, elm) { return $(elm).find("> li").toArray().reverse(); }) // for each layer list, find its items and reverse their order
                            .map(function (i, elm) { return elm.id; });

                cleanIdArray = idArray.toArray().filter(function (i, elm) {
                    //check if layer is in error state.  error layers should not be part of the count.  exception being the layer we are reloading
                    return ((FilterManager.getLayerState(elm) !== LayerItem.state.ERROR) || (elm === evt.layerId));
                });

                //find where our index is
                layerIndex = cleanIdArray.indexOf(evt.layerId);

                if (curlayer.ramp.type === GlobalStorage.layerType.wms) {
                    //adjust for wms, as it's in a different layer list on the map
                    layerIndex = layerIndex + RAMP.layerCounts.base - RAMP.layerCounts.feature;
                }

                if (evt.mode) {
                    layerConfig.mode = evt.mode;
                }

                //generate new layer
                switch (curlayer.ramp.type) {
                    case GlobalStorage.layerType.wms:
                        newLayer = RampMap.makeWmsLayer(layerConfig, user);
                        break;

                    case GlobalStorage.layerType.feature:
                        newLayer = RampMap.makeFeatureLayer(layerConfig, user);
                        break;

                    case GlobalStorage.layerType.Static:
                        newLayer = RampMap.makeStaticLayer(layerConfig, user);
                        break;
                }

                //load the layer at the previous index
                console.log("Reloading Layer at index " + layerIndex.toString());
                _loadLayer(newLayer, layerIndex);
            },

            /**
            * Public endpoint to initiate the loading of an ESRI layer object to the map.
            *
            * @method loadLayer
            * @param  {Object} layer an instantiated, unloaded ESRI layer object
            * @param  {Integer} reloadIndex Optional.  If reloading a layer, supply the index it should reside at.  Do not set for new layers
            */
            loadLayer: function (layer, reloadIndex) {
                _loadLayer(layer, reloadIndex);
            },

            getLayerConfig: getLayerConfig,

            nextId: nextId
        };
    });