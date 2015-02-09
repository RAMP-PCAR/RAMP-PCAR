/* global define, console, RAMP, $ */

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
* @class LayerLoader
* @static
* @uses dojo/topic
* @uses dojo/_base/array
* @uses esri/geometry/Extent
* @uses esri/layers/GraphicsLayer
* @uses esri/tasks/GeometryService
* @uses esri/tasks/ProjectParameters
* @uses EventManager
* @uses FeatureClickHandler
* @uses FilterManager
* @uses GlobalStorage
* @uses LayerItem
* @uses Map
* @uses MapClickHandler
* @uses Ramp
* @uses Util
*/

define([
/* Dojo */
"dojo/topic", "dojo/_base/array",

/* ESRI */
"esri/layers/GraphicsLayer", "esri/tasks/GeometryService", "esri/tasks/ProjectParameters", "esri/geometry/Extent",

/* RAMP */
"ramp/eventManager", "ramp/map", "ramp/globalStorage", "ramp/featureClickHandler", "ramp/mapClickHandler", "ramp/ramp",
"ramp/filterManager", "ramp/layerItem",

/* Util */
"utils/util"],

    function (
    /* Dojo */
    topic, dojoArray,

    /* ESRI */
    GraphicsLayer, GeometryService, ProjectParameters, EsriExtent,

    /* RAMP */
    EventManager, RampMap, GlobalStorage, FeatureClickHandler, MapClickHandler, Ramp,
    FilterManager, LayerItem,

     /* Util */
    UtilMisc) {
        "use strict";

        var idCounter = 0;

        /**
        * Get an auto-generated layer id.  This works because javascript is single threaded: if this gets called
        * from a web-worker at some point it will need to be synchronized.
        *
        * @returns {String} an auto-generated layer id
        */
        function nextId() {
            idCounter += 1;
            return 'rampAutoId_' + idCounter;
        }

        /**
        * Will set a layerId's layer selector state to a new state.
        *
        * @method onLayerError
        * @private
        * @param  {String} layerId config id of the layer
        * @param  {String} newState the state to set the layer to in the layer selector
        * @param  {Boolean} abortIfError if true, don't update state if current state is an error state
        */
        function updateLayerSelectorState(layerId, newState, abortIfError) {
            if (abortIfError) {
                var layerState;
                layerState = FilterManager.getLayerState(layerId);

                //check if this layer is in an error state.  if so, exit the function
                if (layerState === LayerItem.state.ERROR) {
                    return;
                }
            }

            //set layer selector to new state
            FilterManager.setLayerState(layerId, newState);
        }

        /**
        * Will remove a layer from the map, and adjust counts.
        *
        * @method onLayerError
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
                   lsState;

            if (!layer.ramp) {
                console.log('you failed to supply a ramp.type to the layer!');
            }

            //derive section
            switch (layer.ramp.type) {
                case GlobalStorage.layerType.wms:
                    layerSection = GlobalStorage.layerType.wms;
                    if (UtilMisc.isUndefined(reloadIndex)) {
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
                    if (UtilMisc.isUndefined(reloadIndex)) {
                        //NOTE: these static layers behave like features, in that they can be in any position and be re-ordered.
                        insertIdx = RAMP.layerCounts.feature;
                    } else {
                        insertIdx = reloadIndex;
                    }
                    RAMP.layerCounts.feature += 1;
                    layer.ramp.load.inCount = true;

                    break;
            }

            //derive initial state
            switch (layer.ramp.load.state) {
                case "loaded":
                    lsState = LayerItem.state.LOADED;
                    break;
                case "loading":
                    lsState = LayerItem.state.LOADING;
                    break;
                case "error":
                    lsState = LayerItem.state.ERROR;
                    break;
            }

            //add entry to layer selector
            if (UtilMisc.isUndefined(reloadIndex)) {
                FilterManager.addLayer(layerSection, layer.ramp.config, lsState);
            } else {
                updateLayerSelectorState(layerConfig.id, lsState);
            }
            layer.ramp.load.inLS = true;

            //sometimes the ESRI api will kick a layer out of the map if it errors after the add process.
            //store a pointer here so we can find it (and it's information)
            RAMP.layerRegistry[layer.id] = layer;

            //add layer to map, triggering the loading process.  should add at correct position
            map.addLayer(layer, insertIdx);

            //this will force a recreation of the highlighting graphic group.
            //if not done, can cause mouse interactions to get messy if adding more than
            //one layer at one time
            topic.publish(EventManager.Map.REORDER_END);

            //wire up event handlers to the layer
            switch (layer.ramp.type) {
                case GlobalStorage.layerType.wms:

                    // WMS binding for getFeatureInfo calls
                    if (!UtilMisc.isUndefined(layerConfig.featureInfo)) {
                        MapClickHandler.registerWMSClick({ wmsLayer: layer, layerConfig: layerConfig });
                    }

                    break;

                case GlobalStorage.layerType.feature:

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
                    //if a reload, the bounding box still exists from the first load
                    if (UtilMisc.isUndefined(reloadIndex)) {
                        var boundingBoxExtent,
                            boundingBox = new GraphicsLayer({
                                id: String.format("boundingBoxLayer_{0}", layer.id),
                                visible: layerConfig.settings.boundingBoxVisible
                            });

                        boundingBox.ramp = { type: GlobalStorage.layerType.BoundingBox };

                        //TODO test putting this IF before the layer creation, see what breaks.  ideally if there is no box, we should not make a layer
                        if (!UtilMisc.isUndefined(layerConfig.layerExtent)) {
                            boundingBoxExtent = new EsriExtent(layerConfig.layerExtent);

                            if (UtilMisc.isSpatialRefEqual(boundingBoxExtent.spatialReference, map.spatialReference)) {
                                //layer is in same projection as basemap.  can directly use the extent
                                boundingBox.add(UtilMisc.createGraphic(boundingBoxExtent));
                            } else {
                                //layer is in different projection.  reproject to basemap

                                var params = new ProjectParameters(),
                                    gsvc = new GeometryService(RAMP.config.geometryServiceUrl);
                                params.geometries = [boundingBoxExtent];
                                params.outSR = map.spatialReference;

                                gsvc.project(params, function (projectedExtents) {
                                    boundingBox.add(UtilMisc.createGraphic(projectedExtents[0]));
                                });
                            }
                        }

                        //add mapping to bounding box
                        RampMap.getBoundingBoxMapping()[layer.id] = boundingBox;

                        //bounding boxes are on top of feature layers
                        insertIdx = RAMP.layerCounts.feature + RAMP.layerCounts.bb;
                        RAMP.layerCounts.bb += 1;

                        map.addLayer(boundingBox, insertIdx);
                    }
                    break;
            }
        }

        return {
            /**
            * Initializes properties.  Set up event listeners
            *
            * @method init
            */
            init: function () {
                //counters for layers loaded, so we know where to insert things
                //default basemap count to 1, as we always load 1 to begin with

                RAMP.layerCounts = {
                    feature: 0,
                    bb: 0,
                    wms: 0,
                    base: 1
                };

                RAMP.layerRegistry = {};

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
                console.log("failed to load layer " + evt.layer.url);
                console.log(evt.error.message);

                evt.layer.ramp.load.state = "error";

                var layerId = evt.layer.id;

                //get that failed layer outta here
                removeFromMap(layerId);

                //if layer is in layer selector, update the status
                if (evt.layer.ramp.load.inLS) {
                    updateLayerSelectorState(evt.layer.ramp.config.id, LayerItem.state.ERROR, false);
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
            * Reacts to a request for a layer to be removed.  Usually the case when a layer errors and the user clicks remove.
            *
            * @method onLayerRemove
            * @param  {Object} evt
            * @param  {Object} evt.layerId the layer id to be removed
            */
            onLayerRemove: function (evt) {
                var map = RampMap.getMap(),
                    layer,
                    configIdx,
                    layerSection,
                    configCollection;

                layer = map._layers[evt.layerId];  //map.getLayer is not reliable, so we use this

                if (UtilMisc.isUndefined(layer)) {
                    //layer was kicked out of the map.  grab it from the registry
                    layer = RAMP.layerRegistry[evt.layerId];
                }

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

                RAMP.layerRegistry[evt.layerId] = undefined;
            },

            /**
            * Reacts to a request for a layer to be reloaded.  Usually the case when a layer errors and user wants to try again
            *
            * @method onLayerRemove
            * @param  {Object} evt
            * @param  {Object} evt.layerId the layer id to be reloaded
            */
            onLayerReload: function (evt) {
                var map = RampMap.getMap(),
                    layer,
                    layerConfig,
                    user,
                    newLayer,
                    layerIndex,
                    inMap,
                    layerList,
                    idArray,
                    cleanIdArray;

                layer = map._layers[evt.layerId];  //map.getLayer is not reliable, so we use this

                if (layer) {
                    inMap = true;
                } else {
                    //layer was kicked out of the map.  grab it from the registry
                    inMap = false;
                    layer = RAMP.layerRegistry[evt.layerId];
                }

                layerConfig = layer.ramp.config;
                user = layer.ramp.user;

                //figure out index of layer
                //since the layer may not be in the map, we have to use some trickery to derive where it is sitting

                //get our list of layers
                layerList = $("#" + RAMP.config.divNames.filter).find("#layerList").find("> li > ul");

                //make an array of the ids in order of the list on the page
                idArray = layerList
                            .map(function (i, elm) { return $(elm).find("> li").toArray().reverse(); }) // for each layer list, find its items and reverse their order
                            .map(function (i, elm) { return elm.id; });

                cleanIdArray = idArray.filter(function (i, elm) {
                    //check if layer is in error state.  error layers should not be part of the count.  exception being the layer we are reloading
                    return ((FilterManager.getLayerState(elm) !== LayerItem.state.ERROR) || (elm === evt.layerId));
                });

                //find where our index is
                layerIndex = dojoArray.indexOf(cleanIdArray, evt.layerId);

                if (layer.ramp.type === GlobalStorage.layerType.wms) {
                    //adjust for wms, as it's in a different layer list on the map
                    layerIndex = layerIndex + RAMP.layerCounts.base - RAMP.layerCounts.feature;
                }

                //remove layer from map
                if (inMap) {
                    map.removeLayer(layer);
                }

                //generate new layer
                switch (layer.ramp.type) {
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

            nextId: nextId
        };
    });