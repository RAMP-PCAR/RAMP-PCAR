﻿/*global define, esri, dojoConfig, i18n, console, $ */

/**
*
* A RAMP Map module with ESRI and Dojo AMD Modules
* This module provides function to create an ESRI web map control. A global config object is
* required to initialize the map.
*
* @module RAMP
* @submodule Map
* @main Map
*/

/**
* Map class represents the ESRI map object. The map is generated based on the application configuration and templates.
*
* @class Map
* @uses dojo/_base/declare
* @uses dojo/_base/array
* @uses dojo/dom
* @uses dojo/dom-class
* @uses dojo/dom-construct
* @uses dojo/number
* @uses dojo/query
* @uses dojo/_base/lang
* @uses dojo/topic
* @uses dojo/on
* @uses esri/map
* @uses esri/layers/FeatureLayer
* @uses esri/layers/ArcGISTiledMapServiceLayer
* @uses esri/layers/ArcGISDynamicMapServiceLayer
* @uses esri/layers/WMSLayer
* @uses esri/layers/WMSLayerInfo
* @uses esri/tasks/GeometryService
* @uses esri/tasks/ProjectParameters
* @uses esri/geometry/Polygon
* @uses esri/SpatialReference
* @uses esri/dijit/Scalebar
* @uses esri/geometry/Extent
* @uses esri/graphicsUtils
* @uses GlobalStorage
* @uses RAMP
* @uses FeatureClickHandler
* @uses Navigation
* @uses EventManager
* @uses Util
* @uses Array
*/

define([
/* Dojo */
"dojo/_base/declare", "dojo/_base/array", "dojo/dom", "dojo/dom-class",
        "dojo/dom-construct", "dojo/number", "dojo/query", "dojo/_base/lang", "dojo/topic", "dojo/on",

/* Esri */
"esri/map", "esri/layers/FeatureLayer", "esri/layers/GraphicsLayer", "esri/layers/ArcGISTiledMapServiceLayer", "esri/layers/ArcGISDynamicMapServiceLayer",
"esri/tasks/GeometryService", "esri/tasks/ProjectParameters", "esri/geometry/Polygon", "esri/SpatialReference", "esri/config",
"esri/dijit/Scalebar", "esri/geometry/Extent", "esri/graphicsUtils", "esri/layers/WMSLayer", "esri/layers/WMSLayerInfo", "esri/request",

/* Ramp */
"ramp/globalStorage", "ramp/ramp", "ramp/featureClickHandler", "ramp/mapClickHandler", "ramp/navigation", "ramp/eventManager",

/* Util */
"utils/util", "utils/array", "utils/dictionary"],

    function (
    /* Dojo */
    declare, dojoArray, dom, domClass, domConstruct, number, query, dojoLang, topic, dojoOn,

    /* Esri */
    EsriMap, FeatureLayer, GraphicsLayer, ArcGISTiledMapServiceLayer, ArcGISDynamicMapServiceLayer,
    GeometryService, ProjectParameters, Polygon, SpatialReference, esriConfig,
    EsriScalebar, EsriExtent, esriGraphicUtils, WMSLayer, WMSLayerInfo, EsriRequest,

    /* Ramp */
    GlobalStorage, Ramp, FeatureClickHandler, MapClickHandler, Navigation, EventManager,

    /* Util */
    UtilMisc, UtilArray, UtilDict) {
        "use strict";

        /**
        * An Array of {{#crossLink "Esri/layer/FeatureLayer"}}{{/crossLink}} objects.
        *
        * @private
        * @property featureLayers {Array}
        */
        var featureLayers,

        /**
        * An Array of {{#crossLink "Esri/layer/WMSLayer"}}{{/crossLink}} objects.
        *
        * @private
        * @property wmsLayers {Array}
        */
            wmsLayers = [],

        /**
        * Maps the id of a graphic layer to the GraphicsLayer Object that represents its extent bounding box.
        * A dictionary of String, {{#crossLink "Esri/layer/GraphicsLayer"}}{{/crossLink}} pairs.
        *
        * @private
        * @property boundingBoxMapping {Object}
        */
            boundingBoxMapping,

        /**
        * The map not only contains feature layers, but also other layers such as the
        * basemap layer, highlight layer, bounding box layer, etc. This variable is
        * used to store the starting index of the feature layers in the map.
        *
        * @private
        * @property featureLayerStartIndex {Integer}
        */
            featureLayerStartIndex,

            map,

            fullExtent,
            maxExtent,
            initExtent;

        /**
        * Shows the loading image.
        *
        * @private
        * @method _showLoadingImg
        */
        function _showLoadingImg() {
            $("#map-load-indicator").removeClass("hidden");
        }

        /**
        * Hides the loading image.
        *
        * @private
        * @method _hideLoadingImg
        */
        function _hideLoadingImg() {
            $("#map-load-indicator").addClass("hidden");
        }

        /**
        * Update Map Scale when zoom level changes
        *
        * @private
        * @method _updateScale
        * @param {Object} event
        */
        function _updateScale(event) {
            if (event.levelChange) {
                var currentScale = number.format(event.lod.scale),
                    scaleLabelText = "1 : " + currentScale;

                domConstruct.empty('scaleLabel');
                $("#scaleLabel").text(scaleLabelText);
            }
        }

        /**
        * Initialize Map Scale
        *
        * @private
        * @method _initScale
        * @param {Object} event
        */
        function _initScale(event) {
            var map = event.map,
                scaleDiv = domConstruct.create("div", {
                    id: "scaleDiv",
                    class: "esriScalebarLabel"
                }),
                currentScale,
                scaleLabelText;
            $(scaleDiv).html("<span>" + i18n.t('map.scale') + "</span><br><span id='scaleLabel'><span/>");
            currentScale = number.format(map.getScale());
            scaleLabelText = "1 : " + currentScale;

            domConstruct.place(scaleDiv, query(".esriScalebarRuler")[0], "before");
            domConstruct.empty('scaleLabel');
            $("#scaleLabel").text(scaleLabelText);

            // Change the css class of the scale bar so it shows up against
            // the map
            topic.subscribe(EventManager.BasemapSelector.BASEMAP_CHANGED, function (attr) {
                $(".esriScalebar > div").removeClass().addClass(attr.cssStyle);
            });
        }

        /**
        * Republishes map events to the outside using topic.publish
        *
        * @method _initRepublishers
        * @param {Object} map object
        * @private
        */
        function _initRepublishers(map) {
            var prefix = "map";

            /**
            * Republish map events using topic.publish
            *
            * @method republish
            * @param {String} name
            * @private
            */
            function republish(name) {
                map.on(name, function (event) {
                    topic.publish(prefix + "/" + name, event);
                });
            }

            republish("update-end");
            republish("extent-change");
            republish("zoom-start");
            republish("zoom-end");
            republish("pan-start");
            republish("pan-end");
        }

        /**
        * Subscribe to external events (published using topic.publish)
        * and react accordingly
        *
        * @method _initListeners
        * @param {Object} map map object
        * @private
        */
        function _initListeners(map) {
            /* SUBSCRIBED EVENTS */
            topic.subscribe(EventManager.Map.CENTER_AT, function (event) {
                map.centerAt(event.point);
            });

            topic.subscribe(EventManager.Map.CENTER_AND_ZOOM, function (event) {
                var point = new esri.geometry.Point(event.graphic.geometry.x, event.graphic.geometry.y, map.spatialReference),
                    d = map.centerAndZoom(point, event.level); // Last parameter is the level

                if (event.callback) {
                    d.then(event.callback);
                }
            });

            topic.subscribe(EventManager.Map.SET_EXTENT, function (event) {
                event.extent.spatialReference = map.spatialReference;
                var d = map.setExtent(event.extent);

                if (event.callback) {
                    d.then(event.callback);
                }
            });

            /* NAVIGATION EVENTS */
            topic.subscribe(EventManager.Navigation.PAN, function (event) {
                // event.direction panUp, panDown, panLeft, panRight
                // this same as calling map.panUp(), map.panDown(), map.panLeft(), map.panRight()
                map[event.direction]();
            });

            topic.subscribe(EventManager.Navigation.ZOOM_STEP, function (event) {
                map.setLevel(map.getLevel() + event.level);
            });

            topic.subscribe(EventManager.Navigation.ZOOM, function (event) {
                map.setLevel(event.level);
            });

            topic.subscribe(EventManager.Navigation.FULL_EXTENT, function () {
                map.setExtent(fullExtent);
            });

            /* GUI EVENTS */
            topic.subscribe(EventManager.GUI.LAYOUT_CHANGE, function () {
                map.resize(true);
            });

            // Unhighlight the point when the subpanel is collapsed
            topic.subscribe(EventManager.GUI.SUBPANEL_CHANGE, function (eventArg) {
                // unhighlight only if the panel closing is the details panel
                if (!eventArg.visible &&
                    eventArg.isComplete &&
                    (eventArg.origin === ("rampPopup" || "datagrid"))) {
                    topic.publish(EventManager.FeatureHighlighter.HIGHLIGHT_HIDE, {});
                }
            });

            /* START BOUNDING BOX TOGGLE */

            topic.subscribe(EventManager.FilterManager.LAYER_VISIBILITY_TOGGLED, function (evt) {
                var setTo = evt.state,
                    layerId = evt.id,
                    // either take url (would need mapping to layer on map),
                    // map id in config, graphic layer id
                    layer = map.getLayer(layerId);

                layer.setVisibility(setTo);
                //loops through any static layers that are mapped to the feature layer being toggled
                try {
                    dojoArray.forEach(GlobalStorage.LayerMap[layerId], function (staticLayer) {
                        var layer = map.getLayer(staticLayer);
                        layer.setVisibility(setTo);
                    });
                }
                catch (err) {
                }
            });

            topic.subscribe(EventManager.FilterManager.LAYER_TRANSPARENCY_CHANGED, function (evt) {
                var layer = map.getLayer(evt.layerId);

                layer.setOpacity(evt.value);
                //loops through any static layers that are mapped to the feature layer being toggled
                try {
                    dojoArray.forEach(GlobalStorage.LayerMap[evt.layerId], function (staticLayer) {
                        var layer = map.getLayer(staticLayer);
                        layer.setOpacity(evt.value);
                    });
                }
                catch (err) {
                }
            });

            topic.subscribe(EventManager.FilterManager.BOX_VISIBILITY_TOGGLED, function (evt) {
                setBoundingBoxVisibility(evt.id, evt.state);
            });
            /* END BOUNDING BOX TOGGLE */

            topic.subscribe(EventManager.FilterManager.SELECTION_CHANGED, function (evt) {
                // this is handling the user trying to re-order the layers
                // graphical and feature layers must be handled separately from
                // all other layers as ESRI separates the two internally

                var newIndex = evt.index,
                    featureLayers;

                if (map.layerIds.contains(evt.id)) {
                    featureLayers = dojoArray.map(map.graphicsLayerIds, function (x) {
                        return map.getLayer(x).type === 'Feature Layer' ? 1 : 0;
                    }).sum();
                    newIndex += 1 - featureLayers; // offset by 1 basemap not accounted for
                    console.log('newIndex ' + newIndex);
                    console.log(map.layerIds);
                } else {
                    if (!featureLayerStartIndex) {
                        // Find the index of the first feature layer
                        featureLayerStartIndex = UtilArray.indexOf(map.graphicsLayerIds, function (layerId) {
                            var layer = map.getLayer(layerId);
                            return layer.type && layer.type === "Feature Layer";
                        });
                    }
                    newIndex += featureLayerStartIndex;
                }
                map.reorderLayer(map.getLayer(evt.id), newIndex);
                topic.publish(EventManager.Map.REORDER_END);
            });

            /* Add Layer subscription*/
            topic.subscribe(EventManager.Map.ADD_LAYER, function () {
                var type = dom.byId("addLayer-select-type").value,
                    URL = dom.byId("addLayer-URL-input").value,
                    opacity = dom.byId("addLayer-Opacity").value;

                console.log(type + " | " + URL + " | " + opacity);
                addStaticLayer(type, URL, opacity);
            });

            topic.subscribe(EventManager.Map.ADD_LAYER_READY, function (temp_layer) {
                map.addLayer(temp_layer);
            });
        }
        /**
        * Creates event handlers for the map control: click, mouse-over, load, extent change, and update events.
        *
        * @private
        * @method _initEventHandlers
        * @param {Object} map A ESRI map object
        */
        function _initEventHandlers(map) {
            var handle,
                // filter out non static layers for any feature interaction: maptip
                nonStaticLayers = dojoArray.filter(featureLayers, function (layer) {
                    return layer.ramp.type !== GlobalStorage.layerType.Static;
                }
            );

            // original value : featureLayers
            // updated with nonStaticLayer
            dojoArray.forEach(nonStaticLayers, function (fl) {
                //TODO: set timer for maptips onMouseOver event

                fl.on("click", function (evt) {
                    evt.stopImmediatePropagation();
                    FeatureClickHandler.onFeatureSelect(evt);
                });

                fl.on("mouse-over", function (evt) {
                    FeatureClickHandler.onFeatureMouseOver(evt);

                    //console.log("hover on point", evt);
                });

                fl.on("mouse-out", function (evt) {
                    FeatureClickHandler.onFeatureMouseOut(evt);
                });
            });

            map.on("load", _initScale);
            map.on("extent-change", function (event) {
                _updateScale(event);

                console.log("map - >> extent-change", event);
                dojoOn.once(map, "update-end", function () {
                    console.log("map - >> update-end - >> Apply extent Filter");
                    topic.publish(EventManager.Datagrid.APPLY_EXTENT_FILTER);
                });
            });

            // Deselect all highlighted points if the map is clicked
            map.on("click", function (evt) {
                FeatureClickHandler.onFeatureDeselect(evt);
                topic.publish(EventManager.Map.CLICK, evt);
            });

            // Hide all the maptips if the map finishes updating
            map.on("update-end", function () {
                //topic.publish(EventManager.Maptips.HIDE, {});
            });

            // Show/Hide spinner for map loading
            map.on("update-start", _showLoadingImg);
            map.on("update-end", _hideLoadingImg);

            handle = map.on("update-end", function () {
                var isAllLoaded = dojoArray.every(
                        map.graphicsLayerIds.concat(map.layerIds),
                        function (layerId) {
                            var layer = map.getLayer(layerId);
                            //console.log(layer.loaded, layerId, layer);
                            return layer.loaded;
                        }
                    );

                console.log("map -> is all layers loaded: ", isAllLoaded);

                if (isAllLoaded) {
                    handle.remove();
                    console.log("map ->", EventManager.Map.ALL_LAYERS_LOADED);
                    topic.publish(EventManager.Map.ALL_LAYERS_LOADED);
                }
            });
        }

        /**
        * Instantiates an extent from a JSON config object and spatial reference
        *
        * @private
        * @method createExtent
        * @param {Object} extentConfig the JSON config object
        * @param {Esri/SpatialReference} sr the {{#crossLink "Esri/SpatialReference"}}{{/crossLink}}
        * @return {esri/geometry/Extent} An ESRI extent object based on the config data
        */
        function createExtent(extentConfig, sr) {
            return new EsriExtent(
                extentConfig.xmin, extentConfig.ymin, extentConfig.xmax, extentConfig.ymax, sr);
        }

        /**
        * Add a static, non-interactive Layer to the map
        *
        * @private
        * @method AddStaticLayer
        * @param {String} layer_type A value which controls how the layer is going to be added to the map
        * @param {String} layer_url A URL pointing to a valid map service endpoint
        * @param {Number} layer_op A value between 0.0 and 1.0 which determines the transparency of the layer
        */
        function addStaticLayer(layer_type, layer_url, layer_op) {
            layer_op = layer_op / 100; // change percentage to decimal
            var tempLayer;
            switch (layer_type) {
                case "feature":
                    tempLayer = new FeatureLayer(layer_url, {
                        opacity: layer_op,
                        mode: FeatureLayer.MODE_SNAPSHOT
                    });
                    break;

                case "tile":
                    tempLayer = new ArcGISTiledMapServiceLayer(layer_url, {
                        opacity: layer_op
                    });
                    break;

                case "dynamic":
                    tempLayer = new ArcGISDynamicMapServiceLayer(layer_url, {
                        opacity: layer_op
                    });
                    break;

                default:

                    break;
            }

            topic.publish(EventManager.Map.ADD_LAYER_READY, tempLayer);
            topic.publish(EventManager.GUI.ADD_LAYER_PANEL_CHANGE, {
                visible: false
            });
        }

        /**
        * Sets the visibility of the bounding box that belongs to the layer with the given layerId.
        * Note: the layerId needs to be the ID of the featurelayer, not the ID of the actual bounding
        * box layer.
        *
        * @private
        * @method setBoundingBoxVisibility
        * @param {String} layerId the id of the layer whose bounding box visibility should be set
        */
        function setBoundingBoxVisibility(layerId, visibility) {
            var boxLayer = boundingBoxMapping[layerId];

            //if (boxLayer.graphics.isEmpty() && visibility) {
                
            //    // get bounding box info from config object
            //    var boundingBoxExtent;
            //    var layerConfig = dojoArray.find(config.featureLayers, function (layerConfig) {
            //        return layerConfig.id === layerId;
            //    });

            //    boundingBoxExtent.xmin = layerConfig.boundingBox.extent.xmin;
            //    boundingBoxExtent.ymin = layerConfig.boundingBox.extent.ymin;
            //    boundingBoxExtent.xmax = layerConfig.boundingBox.extent.xmax;
            //    boundingBoxExtent.ymax = layerConfig.boundingBox.extent.ymax;

            //    var extentGraphic = new esri.Graphic({
            //        geometry: boundingBoxExtent,
            //        symbol: {
            //            color: [255, 0, 0, 64],
            //            outline: {
            //                color: [240, 128, 128, 255],
            //                width: 1,
            //                type: "esriSLS",
            //                style: "esriSLSSolid"
            //            },
            //            type: "esriSFS",
            //            style: "esriSFSSolid"
            //        }
            //    });
            //    boxLayer.add(extentGraphic);
            //}

            boxLayer.setVisibility(visibility);
        }

        function resolveLayerOpacity(layerOpacity) {
            return layerOpacity.default || 1;
        }

        function generateStaticLayer(staticLayer) {
            var tempLayer;
            //determine layer type and process
            switch (staticLayer.layerType) {
                case "feature":
                    tempLayer = new FeatureLayer(staticLayer.url, {
                        opacity: resolveLayerOpacity(staticLayer.settings.opacity),
                        mode: FeatureLayer.MODE_SNAPSHOT,
                        id: staticLayer.id
                    });
                    tempLayer.ramp = {
                        type: GlobalStorage.layerType.Static
                    };
                    break;

                case "tile":
                    tempLayer = new ArcGISTiledMapServiceLayer(staticLayer.url, {
                        opacity: resolveLayerOpacity(staticLayer.settings.opacity),
                        id: staticLayer.id
                    });
                    console.log("tile layer added. " + staticLayer.id);
                    break;

                case "dynamic":
                    tempLayer = new ArcGISDynamicMapServiceLayer(staticLayer.url, {
                        opacity: resolveLayerOpacity(staticLayer.settings.opacity),
                        id: staticLayer.id
                    });
                    console.log("dynamic layer added. " + staticLayer.id);
                    break;

                default:
                    //TODO add in other types of maps... wms?  non-esri tile?
                    break;
            }
            return tempLayer;
        }

        return {
            /**
            * The maximum extent of the map control is allowed to go to
            * @property getMaxExtent
            * @type {Object}
            *
            */
            getMaxExtent: function () {
                return maxExtent;
            },
            /**
            * Return the map control object
            * @property getMap
            * @type {Object}
            *
            */
            getMap: function () {
                if (UtilMisc.isUndefined(map)) {
                    console.log("trying to get map before it is available!");
                }
                return map;
            },

            /**
            * Returns a list of feature layers that are currently visible on the map.
            * @method getVisibleFeatureLayers
            * @return {Array} an array of {{#crossLink "Esri/layer/FeatureLayer"}}{{/crossLink}} objects
            *
            */
            getVisibleFeatureLayers: function () {
                // Return only the feature layers
                //TODO do we need to consider static layers here?
                return dojoArray.filter(map.getLayersVisibleAtScale(), function (layer) {
                    return layer.type && (layer.type === "Feature Layer") && layer.visible;
                });
            },

            /**
            * Return the feature layer corresponding to the given url.
            *
            * @method getFeatureLayer
            * @private
            * @param {String} featureUrl the url of the feature layer
            * @return {Esri/layer/FeatureLayer} feature layer
            */
            getFeatureLayer: function (featureUrl) {
                return UtilArray.find(featureLayers,
                    function (featureLayer) {
                        return featureLayer.url === featureUrl;
                    });
            },

            /**
            * Given an ESRI Extent Object, returns a new ESRI Extent Object that
            * contains the extent adjusted according to this map's maximum extent
            *
            * NOTE: this method is currently unused!
            *
            * @param {esri/geometry/Extent} e the extent Object
            * @param {esri/geometry/Extent} maxExtent the maximum extent
            * @return {esri/geometry/Extent} An adjusted extent, if the target extent is outside the boundary
            * @method checkBoundary
            */
            checkBoundary: function (e, maxExtent) {
                var extent = e,
                width = extent.width(),
                height = extent.height(),
                centerX = extent.centerX(),
                centerY = extent.centerY(),
                flag, adjustedEx;

                adjustedEx = extent.clone();

                var maxHeight = maxExtent.height();
                if (height > maxHeight) {
                    height = maxHeight;
                }

                if (centerY > maxExtent.ymax) {
                    adjustedEx.ymax = maxExtent.ymax;
                    adjustedEx.ymin = maxExtent.ymax - height;
                    flag = true;
                    //} else if (extent.ymin < maxExtent.ymin) {
                } else if (centerY < maxExtent.ymin) {
                    adjustedEx.ymin = maxExtent.ymin;
                    adjustedEx.ymax = maxExtent.ymin + height;
                    flag = true;
                }

                var maxWidth = maxExtent.width();
                if (width > maxWidth) {
                    width = maxWidth;
                }

                if (centerX > maxExtent.xmax) {
                    adjustedEx.xmax = maxExtent.xmax;
                    adjustedEx.xmin = maxExtent.xmax - width;
                    flag = true;
                } else if (centerX < maxExtent.xmin) {
                    adjustedEx.xmin = maxExtent.xmin;
                    adjustedEx.xmax = maxExtent.xmin + width;
                    flag = true;
                }

                if (flag) {
                    return adjustedEx;
                }
            },
            /*
            * Initialize map control with configuration objects provided in the bootstrapper.js file.
            *
            * Initialize extent
            * Add base map from the config.basemaps array that has the showOnInit()
            * Add Static layer from config.featureLayers.staticLayers
            * Add feature layers from config.featureLayers
            * Create bounding layers and add to map control
            * Add map tip events to each feature layer (click/hover/out)
            * Show scalebar
            * Publish events to outside for other modules to use
            * Subscribe events to update map control
            *
            * Note: Not sure if we want to include all the config requirements here.
            * Map control is initialized with div id provided. The following config file entries are used:
            * config.spatialReference
            * config.extents.defaultExtent xmin, ymin, xmax, ymax
            * config.levelOfDetails.minLevel
            * config.levelOfDetails.maxLevel
            * config.extents.maximumExtent
            * config.extents.fullExtent
            * config.basemaps  arrays of basemap, only one or first one with showOnInit set to true
            * config.featureLayers
            *
            * @method init
            * @param {Object} mapDiv the HTML div that will store the map control
            * @constructor
            *
            */
            init: function () {
                //config object is loaded in bootstrapper.js
                var config = GlobalStorage.config,

                /**
                * The spatial reference of the map
                *
                * @property spatialReference
                * @private
                * @type {esri/SpatialReference}
                */
                    spatialReference = new esri.SpatialReference(config.spatialReference),

                /**
                * The URL of the basemap that is on by default
                *
                * @property url
                * @private
                * @type {String}
                */
                    url = UtilArray.find(config.basemaps, function (basemap) {
                        return basemap.showOnInit;
                    }).url,

                /**
                * The basemap layer
                *
                * @property baseLayer
                * @private
                * @type {Esri/layers/ArcGISTiledMapServiceLayer}
                */
                    baseLayer = new ArcGISTiledMapServiceLayer(url, {
                        id: "basemapLayer"
                    });

                /**
                * The maximum extent of the map
                *
                * @property maxExtent
                * @private
                * @type {esri/geometry/Extent}
                */
                maxExtent = createExtent(config.extents.maximumExtent, spatialReference);

                /**
                * The initial extent of the map
                *
                * @property InitExtent
                * @private
                * @type {esri/geometry/Extent}
                */
                initExtent = createExtent(config.extents.defaultExtent, spatialReference);

                /**
                * Used for full extent in nav widget
                *
                * @property fullExtent
                * @private
                * @type {esri/geometry/Extent}
                */
                fullExtent = createExtent(config.extents.fullExtent, spatialReference);

                esriConfig.defaults.io.proxyUrl = GlobalStorage.config.proxyUrl;// "/proxy/proxy.ashx";
                dojoConfig.ecfg = esriConfig;
                //generate WMS layers array
                wmsLayers = dojoArray.map(config.wmsLayers, function (layer) {
                    var wmsl = new WMSLayer(layer.url, {
                        id: layer.id,
                        format: layer.format,
                        opacity: resolveLayerOpacity(layer.settings.opacity),
                        resourceInfo: {
                            extent: new EsriExtent(layer.extent),
                            layerInfos: [new WMSLayerInfo(layer.layerInfo)]
                        }
                    });
                    wmsl.ramp = {
                        type: GlobalStorage.layerType.WMS
                    };

                    // WMS binding for getFeatureInfo calls

                    if (layer.featureInfo !== undefined) {
                        console.log('registering ' + layer.displayName + ' for WMS getFeatureInfo');
                        MapClickHandler.registerWMSClick({wmsLayer: wmsl, layerConfig: layer});
                    }

                    wmsl.setVisibleLayers(layer.layerInfo.name);
                    wmsl.setVisibility(layer.layerVisible);

                    return wmsl;
                });

                //generate feature layers array
                featureLayers = dojoArray.map(config.featureLayers, function (layerConfig) {
                    var fl;

                    if (layerConfig.isStatic) {
                        fl = generateStaticLayer(layerConfig);
                    } else {
                        fl = new FeatureLayer(layerConfig.url, {
                            id: layerConfig.id,
                            mode: FeatureLayer.MODE_SNAPSHOT,
                            outFields: [layerConfig.layerAttributes],
                            visible: layerConfig.layerVisible,
                            opacity: resolveLayerOpacity(layerConfig.settings.opacity)
                        });
                        fl.ramp = {
                            type: GlobalStorage.layerType.Feature
                        };
                        if (layerConfig.boundingBoxVisible === true) {
                            dojoOn.once(fl, "update-end", function () {
                                setBoundingBoxVisibility(layerConfig.id, true);
                            });
                        }
                    }
                    if (layerConfig.layerVisible === false) {
                        dojoOn.once(fl, "update-end", function () {
                            fl.setVisibility(false);
                        });
                    }
                    return fl;
                });

                /**
                * A list GraphicsLayer that represent the extent bounding box of the feature layers.
                * {[esr/layer/featurelayers]} featureLayers A list of feature layers found in the application config
                * {[esri/layer/graphiclayer]}  An array of graphic layers to add to the map
                *
                * @property boundingBoxLayers
                * @type {array of esri/layer/GraphicsLayer}
                */

                var boundingBoxLayers = dojoArray.map(config.featureLayers, function (layer) {
                    // Map a list of featurelayers into a list of GraphicsLayer representing
                    // the extent bounding box of the feature layer. Note each bounding box layer
                    // at this point are empty, the actual graphic that represent the bounding box
                    // will be generated the first time the user toggles it on.
                    var boundingBox = new GraphicsLayer({
                        id: String.format("boundingBoxLayer_{0}", layer.id),
                        visible: layer.boundingBoxVisible
                    });
                    boundingBox.ramp = {
                        type: GlobalStorage.layerType.BoundingBox
                    };

                    var boundingBoxExtent;
                    if (typeof layer.boundingBox !== "undefined") {

                        boundingBoxExtent = createExtent(layer.boundingBox.extent, spatialReference);

                        var extentGraphic = new esri.Graphic({
                            geometry: boundingBoxExtent,
                            symbol: {
                                color: [255, 0, 0, 64],
                                outline: {
                                    color: [240, 128, 128, 255],
                                    width: 1,
                                    type: "esriSLS",
                                    style: "esriSLSSolid"
                                },
                                type: "esriSFS",
                                style: "esriSFSSolid"
                            }
                        });

                        boundingBox.add(extentGraphic);
                    }
                    
                    return boundingBox;
                });

                // Maps layerId to a GraphicsLayer Object that represents the extent bounding box
                // for that layer
                boundingBoxMapping = UtilDict.zip(dojoArray.map(config.featureLayers, function (layer) {
                    return layer.id;
                }), boundingBoxLayers);

                //the map!
                map = new EsriMap(config.divNames.map, {
                    extent: initExtent,
                    logo: false,
                    minZoom: config.levelOfDetails.minLevel,
                    maxZoom: config.levelOfDetails.maxLevel,
                    slider: false
                });

                GlobalStorage.map = map;
                MapClickHandler.init(map);

                /*  START - Add static layers   */

                var staticLayers = [],
                    perLayerStaticMaps = [],
                    staticLayerMap = [];

                dojoArray.forEach(config.featureLayers, function (layer) {
                    perLayerStaticMaps = [];
                    dojoArray.forEach(layer.staticLayers, function (staticLayer, i) {
                        var tempLayer = map.generateStaticLayer(staticLayer);

                        staticLayers.push(tempLayer);
                        //creates an array of all static layers defined for the current, single feature layer
                        perLayerStaticMaps[i] = staticLayer.id;
                    });
                    //adds the static layer id array as a value to an array indexed by feature layer id
                    staticLayerMap[layer.id] = perLayerStaticMaps;
                });

                GlobalStorage.LayerMap = staticLayerMap;
                /*  End - Add static layers   */

                baseLayer.ramp = {
                    type: GlobalStorage.layerType.Basemap
                };
                // Combine all layer arrays then add them all at once (for efficiency)
                map.addLayers([baseLayer].concat(wmsLayers, staticLayers, boundingBoxLayers, featureLayers));

                /* Start - Show scalebar */
                var scalebar = new EsriScalebar({
                    map: map,
                    attachTo: "bottom-left",
                    scalebarUnit: "metric"
                });

                scalebar.show();

                /* End - Show scalebar */

                _initRepublishers(map);
                _initListeners(map);
                _initEventHandlers(map, featureLayers);
            }
        };
    });