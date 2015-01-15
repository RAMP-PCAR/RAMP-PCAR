/* global define, console, RAMP */

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
"dojo/topic",

/* ESRI */
"esri/layers/GraphicsLayer", "esri/tasks/GeometryService", "esri/tasks/ProjectParameters", "esri/geometry/Extent",

/* RAMP */
"ramp/eventManager", "ramp/map", "ramp/globalStorage", "ramp/featureClickHandler", "ramp/mapClickHandler", "ramp/ramp",
"ramp/filterManager", "ramp/layerItem",

/* Util */
"utils/util"],

    function (
    /* Dojo */
    topic,

    /* ESRI */
    GraphicsLayer, GeometryService, ProjectParameters, EsriExtent,

    /* RAMP */
    EventManager, RampMap, GlobalStorage, FeatureClickHandler, MapClickHandler, Ramp,
    FilterManager, LayerItem,

     /* Util */
    UtilMisc) {
        "use strict";

        /**
        * Will set a layerId's layer selector state to a new state.
        *
        * @method onLayerError
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

                topic.subscribe(EventManager.LayerLoader.LAYER_LOADED, this.onLayerLoaded);
                topic.subscribe(EventManager.LayerLoader.LAYER_UPDATED, this.onLayerUpdateEnd);
                topic.subscribe(EventManager.LayerLoader.LAYER_UPDATING, this.onLayerUpdateStart);
                topic.subscribe(EventManager.LayerLoader.LAYER_ERROR, this.onLayerError);
                topic.subscribe(EventManager.LayerLoader.REMOVE_LAYER, this.onLayerRemove);
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

                //TODO consider if the layer has not been loaded yet
                //TODO consider if the layer does not yet have an entry in the layer selector

                //reduce count
                /*
                switch (evt.layer.ramp.type) {
                    case GlobalStorage.layerType.wms:
                        //RAMP.layerCounts.wms -= 1;
                        break;

                    case GlobalStorage.layerType.feature:
                    case GlobalStorage.layerType.Static:
                        //RAMP.layerCounts.feature -= 1;
                        break;
                }
                */

                evt.layer.ramp.load.state = "error";

                if (evt.layer.ramp.load.inLS) {
                    updateLayerSelectorState(evt.layer.ramp.config.id, LayerItem.state.ERROR, false);
                }

                //since we can re-arrange the draw order of layers (while in an error state), we want to keep the object around to
                //      preserve indexing.  Instead, we likely want to remove the layer at the begging of the "reload" event
                //remove layer object from Map's layer collection
                //RampMap.getMap().removeLayer(evt.target);
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
                    layer = map.getLayer(evt.layerId),
                    bbLayer = map.getBoundingBoxMapping()[evt.layerId],
                    configIdx;

                //remove item from layer selector
                //TODO need a remove funciton in the filter manager
                //FilterManager.X(evt.layerId);

                //remove layer from map
                map.removeLayer(layer);

                //if bounding box, remove it too
                if (bbLayer) {
                    map.removeLayer(bbLayer);
                }

                //remove node from config
                switch (layer.ramp.type) {
                    case GlobalStorage.layerType.wms:
                        configIdx = RAMP.config.layers.wms.indexOf(layer.ramp.config);
                        RAMP.config.layers.wms.splice(configIdx, 1);

                        break;

                    case GlobalStorage.layerType.feature:
                    case GlobalStorage.layerType.Static:
                        configIdx = RAMP.config.layers.feature.indexOf(layer.ramp.config);
                        RAMP.config.layers.feature.splice(configIdx, 1);
                        break;
                }
            },

            /**
            * This function initiates the loading of an ESRI layer object to the map.
            * Will add it to the map in the appropriate spot, wire up event handlers, and generate any bounding box layers
            * Note: a point of confusion.  The layer objects "load" event may have already finished by the time this function is called.
            *       This means the object's constructor has initialized itself with the layers data source.
            * This functions is not event triggered to guarantee the order in which things are added.
            *
            * @method loadLayer
            * @param  {Object} layer an instantiated, unloaded ESRI layer object
            */
            loadLayer: function (layer) {
                var insertIdx,
                    layerSection,
                    map = RampMap.getMap(),
                    layerConfig = layer.ramp.config,
                    lsState;

                if (!layer.ramp) {
                    console.log('you failed to supply a ramp.type to the layer!');
                }

                // possibly have an optional param for position to add
                // position = typeof position !== 'undefined' ? position : 0; //where 0 is "last", may need to modifiy the default value
                // as for now, we will assume we always add to the end of the appropriate zone for the layer.  initial layers get added in proper order.
                // user added layers get added to the top.  afterwards they can be re-arranged via the UI

                //derive section
                switch (layer.ramp.type) {
                    case GlobalStorage.layerType.wms:
                        layerSection = GlobalStorage.layerType.wms;
                        insertIdx = RAMP.layerCounts.base + RAMP.layerCounts.wms;
                        RAMP.layerCounts.wms += 1;
                        break;

                    case GlobalStorage.layerType.feature:
                    case GlobalStorage.layerType.Static:
                        layerSection = GlobalStorage.layerType.feature;
                        //NOTE: these static layers behave like features, in that they can be in any position and be re-ordered.
                        insertIdx = RAMP.layerCounts.feature;
                        RAMP.layerCounts.feature += 1;
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
                FilterManager.addLayer(layerSection, layer.ramp.config, lsState);
                layer.ramp.load.inLS = true;

                //add layer to map, triggering the loading process.  should add at correct position
                map.addLayer(layer, insertIdx);

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

                        //TODO is this required?  visible is being set in the constructor
                        boundingBox.setVisibility(layerConfig.settings.boundingBoxVisible);

                        //bounding boxes are on top of feature layers
                        insertIdx = RAMP.layerCounts.feature + RAMP.layerCounts.bb;
                        RAMP.layerCounts.bb += 1;

                        map.addLayer(boundingBox, insertIdx);

                        break;
                }
            } //end loadLayer
        };
    });