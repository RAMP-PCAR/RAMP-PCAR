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

        /*
        var iFeatureCount,  //includes static layers
            iBoundingCount,
            iWmsCount,
            iBaseCount;
            */

        return {
            /**
            * Initializes properties.
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
            },

            /**
            * Deals with a layer that had an error when it tried to load.
            *
            * @method onLayerError
            * @param  {Object} evt
            * @param  {Object} evt.target the layer object that failed
            * @param  {Object} evt.error the error object
            */
            onLayerError: function (evt) {
                console.log("failed to load layer " + evt.target.url);
                console.log(evt.error.message);

                //reduce count
                switch (evt.target.ramp.type) {
                    case GlobalStorage.layerType.wms:
                        //RAMP.layerCounts.wms -= 1;
                        break;

                    case GlobalStorage.layerType.feature:
                    case GlobalStorage.layerType.Static:
                        //RAMP.layerCounts.feature -= 1;
                        break;
                }

                //TODO
                //figure out which layer selector state object matches this layer object

                //TODO
                //set layer selector state to error

                //TODO  figure this out.  since we can re-arrange the draw order of layers (while in an error state), we want to keep the object around to
                //      preserve indexing.  Instead, we likely want to remove the layer at the begging of the "reload" event
                //remove layer object from Map's layer collection
                //RampMap.getMap().removeLayer(evt.target);
            },
           
            /**
            * Reacts when a layer has updated successfully.  This means the layer has pulled its data and displayed it.
            *
            * @method onLayerUpdateEnd
            * @param  {Object} evt
            * @param  {Object} evt.target the layer object that loaded
            */
            onLayerUpdateEnd: function (evt) {
                var layer = evt.target,
                    layerState;

                //figure out which layer selector state object matches this layer object
                layerState = FilterManager.getLayerState(layer.ramp.config.id);

                //check if this layer is in an error state.  if so, exit the handler
                if (layerState === LayerItem.state.ERROR) {
                    return;
                }

                //set layer selector state to loaded
                FilterManager.setLayerState(layer.ramp.config.id, LayerItem.state.LOADED);

                //raise event to indicate the layer is loaded, so that things like datagrid will refresh itself
                topic.publish(EventManager.Map.LAYER_LOADED, { layer: layer });
            },

            /**
            * This function initiates the loading process for an ESRI layer object.
            * Will add it to the map in the appropriate spot, wire up event handlers, and generate any bounding box layers
            *
            * @method loadLayer
            * @param  {Object} layer an instantiated, unloaded ESRI layer object
            */
            loadLayer: function (layer) {
                var insertIdx,
                    layerSection,
                    map = RampMap.getMap(),
                    layerConfig = layer.ramp.config;

                if (!layer.ramp) {
                    console.log('you failed to supply a ramp.type to the layer!');
                }

                // possibly have an optional param for position to add
                // position = typeof position !== 'undefined' ? position : 0; //where 0 is "last", may need to modifiy the default value
                // as for now, we will assume we always add to the end of the appropriate zone for the layer.  initial layers get added in proper order.
                // user added layers get added to the top.  afterwards they can be re-arranged via the UI

                //add error handler for layer
                layer.on('error', this.onLayerError);

                //derive section
                switch (layer.ramp.type) {
                    case GlobalStorage.layerType.wms:
                        layerSection = GlobalStorage.layerType.wms;
                        break;

                    case GlobalStorage.layerType.feature:
                    case GlobalStorage.layerType.Static:
                        layerSection = GlobalStorage.layerType.feature;
                        break;
                }

                if (layer.ramp.loadOk) {
                    //add update start handler for layer

                    //since the update-start event is terrible and doesn't let you know who threw it, we need to tack the handler
                    //function onto the actual layer object so we can use the "this" keyword to grab the sending layer
                    
                    //Reacts when a layer begins to update.  This happens when a feature layer starts to download its data.
                    //Data download doesn't start until points are made visible.  It also happens when a WMS requests a new picture.                                        
                    layer.ramp.onUpdateStart = function () {
                        var layerState;

                        console.log("LAYER START HANDLER " + this.url);

                        layerState = FilterManager.getLayerState(this.ramp.config.id);

                        //check if this layer is in an error state.  if so, exit the handler
                        if (layerState === LayerItem.state.ERROR) {
                            return;
                        }

                        //set layer selector state to loading
                        FilterManager.setLayerState(this.ramp.config.id, LayerItem.state.UPDATING);
                    };

                    layer.on('update-start', layer.ramp.onUpdateStart);

                    //add update end handler for layer
                    layer.on('update-end', this.onLayerUpdateEnd);

                    //increase count
                    switch (layer.ramp.type) {
                        case GlobalStorage.layerType.wms:
                            insertIdx = RAMP.layerCounts.base + RAMP.layerCounts.wms;
                            RAMP.layerCounts.wms += 1;
                            break;

                        case GlobalStorage.layerType.feature:
                        case GlobalStorage.layerType.Static:
                            //NOTE: these static layers behave like features, in that they can be in any position and be re-ordered.
                            insertIdx = RAMP.layerCounts.feature;
                            RAMP.layerCounts.feature += 1;
                            break;
                    }

                    //add entry to alex selector, defaulting to loading state
                    FilterManager.addLayer(layerSection, layer.ramp.config, LayerItem.state.DEFAULT);

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
                            //NOTE UtilMisc.isUnDefined fails epically when testing this value
                            if (layerConfig.layerExtent !== undefined) {
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
                } else {
                    //the layer failed it's server handshake.
                    //caused by something like a bad URL or a crashed server.

                    //just add an error item to the layer selector
                    //TODO ensure the layer selector item can find itself when there is no actual layer object in the map stack.

                    //TODO make a way to add a layer that starts in error state
                    FilterManager.addLayer(layerSection, layer.ramp.config, LayerItem.state.ERROR);
                }
            }
        };
    });