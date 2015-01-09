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
* @uses GlobalStorage
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

/* Util */
"utils/util"],

    function (
    /* Dojo */
    topic,

    /* ESRI */
    GraphicsLayer, GeometryService, ProjectParameters, EsriExtent,

    /* RAMP */
    EventManager, RampMap, GlobalStorage, FeatureClickHandler, MapClickHandler, Ramp,

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
                        RAMP.layerCounts.wms -= 1;
                        break;

                    case GlobalStorage.layerType.feature:
                    case GlobalStorage.layerType.Static:
                        RAMP.layerCounts.feature -= 1;
                        break;
                }

                //TODO
                //figure out which layer selector state object matches this layer object

                //TODO
                //set layer selector state to error

                //remove layer object from Map's layer collection
                RampMap.getMap().removeLayer(evt.target);
            },

            /**
            * Reacts when a layer has loaded successfully.
            *
            * @method onLayerLoaded
            * @param  {Object} evt
            * @param  {Object} evt.target the layer object that loaded
            */
            onLayerLoaded: function (evt) {
                var layer = evt.target,
                    layerConfig = layer.ramp.config,
                    map = RampMap.getMap();

                console.log("layer loaded: " + layer.url);

                //TODO
                //figure out which layer selector state object matches this layer object

                //TODO
                //check if this layer is in an error state.  if so, exit the handler

                //TODO
                //set layer selector state to loaded (and possibly do other alex magic)

                //call map functions to wire up event handlers
                switch (layer.ramp.type) {
                    case GlobalStorage.layerType.wms:

                        // WMS binding for getFeatureInfo calls
                        if (layerConfig.featureInfo !== undefined) {
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
                            }),
                            insertIdx;

                        boundingBox.ramp = { type: GlobalStorage.layerType.BoundingBox };

                        //TODO test putting this IF before the layer creation, see what breaks.  ideally if there is no box, we should not make a layer
                        if (typeof layerConfig.layerExtent !== "undefined") {
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

                        boundingBox.setVisibility(layerConfig.settings.boundingBoxVisible);

                        insertIdx = RAMP.layerCounts.feature + RAMP.layerCounts.bb;
                        RAMP.layerCounts.bb += 1;

                        map.addLayer(boundingBox, insertIdx);

                        break;
                }

                //raise event to indicate the layer is loaded, so that things like datagrid will refresh itself

                topic.publish(EventManager.Map.LAYER_LOADED, { layer: evt.target });
            },

            /**
            * This function initiates the loading process for an ESRI layer object.
            *
            * @method loadLayer
            * @param  {Object} layer an instantiated, unloaded ESRI layer object
            */
            loadLayer: function (layer) {
                var insertIdx;

                if (!layer.ramp) {
                    console.log('you failed to supply a ramp.type to the layer!');
                }

                //TODO possibly have an optional param for position to add
                // position = typeof position !== 'undefined' ? position : 0; //where 0 is "last", may need to modifiy the default value

                //add config node to layer??
                //   might be a good idea.  will ensure layers added by user also have this, and thus the code to do this wont be scattered in 3-4 different spots
                //   dont do it for now.  possible future enhancement

                //add error handler for layer
                layer.on('error', this.onLayerError);

                //add loaded handler for layer
                layer.on('update-end', this.onLayerLoaded);

                //increase count
                switch (layer.ramp.type) {
                    case GlobalStorage.layerType.wms:
                        insertIdx = RAMP.layerCounts.base + RAMP.layerCounts.wms;
                        RAMP.layerCounts.wms += 1;
                        break;

                    case GlobalStorage.layerType.feature:
                    case GlobalStorage.layerType.Static:
                        insertIdx = RAMP.layerCounts.feature;
                        RAMP.layerCounts.feature += 1;
                        break;
                }

                //TODO
                //add entry to alex selector, defaulting to loading state

                //add layer to map, triggering the loading process.  should add at correct position
                RampMap.getMap().addLayer(layer, insertIdx);
            }
        };
    });