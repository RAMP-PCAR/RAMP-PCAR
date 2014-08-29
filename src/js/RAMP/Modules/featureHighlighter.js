/*global define, esri, window, Snap */

/**
*
*
* @module RAMP
* @submodule Map
*/

/**
* A class responsible for highlighting points, lines, and shapes on the map upon selection and consequent hover actions.
* The highlighting is achieved by manipulating svg rendering of the map as follows:
*  - all existing feature layers are wrapped into a group object
*  - three more group objects are created:
*      - `highlight group` is positioned after the `graphicGroup`
*      - `zoomlight group` is positioned before the `graphicGroup`
*      - `hoverlight group` is positioned before the `zoomlight group`
*
* and changing the opacity of the `graphicGroup` while adding shapes to one or more of the additional group objects.
*
* @class FeatureHighlighter
* @static
* @uses dojo/_base/declare
* @uses dojo/topic
* @uses GlobalStorage
* @uses Map
* @uses EventManager
* @uses Util
* @uses Dictionary
*/

define([
/* Dojo */
        "dojo/_base/declare", "dojo/topic",

/* Ramp */
        "ramp/globalStorage", "ramp/map", "ramp/eventManager",

/* Util */
        "utils/util", "utils/dictionary"
],

    function (
    /* Dojo */
        declare, topic,

    /* Ramp */
        GlobalStorage, RampMap, EventManager,

    /* Util*/
        UtilMisc, UtilDict) {
        "use strict";

        var map,
            config,

            highlightLayer,
            hoverlightLayer,
            zoomlightLayer,

            graphicGroup,

            highlightedGraphic,

            zoomlightGraphic;

        /**
        * Creates a copy of the given graphic object.
        *
        * @method cloneGraphic
        * @private
        * @param {Object} graphic Graphic object to clone
        * @return clone A cloned Graphic object
        */
        function cloneGraphic(graphic) {
            // Figure out how large the image should be based on the
            // shape or symbol object (which ever one exists)

            var clone = new esri.Graphic({
                geometry: graphic.geometry,
                attributes: {}
            });

            clone.symbol = graphic.getLayer().renderer.getSymbol(graphic);

            // Pass on the attributes of the graphic to the highlight graphic
            // this way the maptip will work
            UtilDict.forEachEntry(graphic.attributes, function (key, value) {
                clone.attributes[key] = value;
            });

            return clone;
        }

        /**
        * Sorts and groups the svg representation of the map layers on the page to make highlighting work.
        * Group all the feature layers and create new groups for highlight, zoomlight, and hoverlight layers.
        *
        * @method sortLayers
        * @private
        */
        function sortLayers() {
            if (!graphicGroup) {
                var svg = Snap.select("svg"),
                    layers = svg.selectAll("svg g"), // > g:not(.highlightLayer)"),
                    hoverl = svg.select(".hoverlightLayer"),
                    zooml = svg.select(".zoomlightLayer"),
                    hightl = svg.select(".highlightLayer");

                graphicGroup = svg.group(layers);

                svg.add(graphicGroup);
                graphicGroup.after(hightl);
                graphicGroup.before(hoverl);
                graphicGroup.before(zooml);
                graphicGroup.attr({
                    class: "graphics"
                });
            }
        }

        /**
        * Clones the Graphic object from the event, adds it to the Highlight layer, and lowers the opacity of other map layers to make the cloned
        * Graphic stand out.
        *
        * @method highlightGraphic
        * @private
        * @param {Object} eventArg ???
        */
        function highlightGraphic(eventArg) {
            var graphic = eventArg.graphic,
                newGraphic = cloneGraphic(graphic);

            sortLayers();

            highlightLayer.clear();

            // Highlights the selected point by adding a graphic object to the highLight layer
            highlightedGraphic = newGraphic;
            // Needed to find the symbol in maptip
            highlightLayer.url = graphic.getLayer().url;
            highlightLayer.objectIdField = graphic.getLayer().objectIdField;

            highlightLayer.add(newGraphic);

            graphicGroup.attr({
                opacity: 0.35
            });
        }

        /**
        * Clears the Highlight layer and restores the opacity of the map layers.
        *
        * @method highlightGraphicHide
        * @private
        */
        function highlightGraphicHide() {
            if (highlightedGraphic) {
                highlightedGraphic = null;

                if (graphicGroup) {
                    graphicGroup.attr({
                        opacity: 1
                    });
                }

                zoomLightHide();
                highlightLayer.clear();
            }
        }

        /**
        * Clones the Graphic object from the event, adds it to the Hoverlight layer.
        *
        * @method hoverLight
        * @private
        * @param {Object} eventArg ???
        */
        function hoverLight(eventArg) {
            var graphic = eventArg.graphic,
                newGraphic = cloneGraphic(graphic);

            sortLayers();

            hoverlightLayer.clear();
            hoverlightLayer.add(newGraphic);
        }

        /**
        * Clears the Hoverlight layer.
        *
        * @method hoverLightHide
        * @private
        */
        function hoverLightHide() {
            hoverlightLayer.clear();
        }

        /**
        * Clones the Graphic object from the event, adds it to the Zoomlight layer, and lowers the opacity of other map layers to make the cloned
        * Graphic stand out.
        *
        * @method zoomLight
        * @private
        * @param {Object} eventArg ???
        */
        function zoomLight(eventArg) {
            var graphic = eventArg.graphic,
                newGraphic = cloneGraphic(graphic);

            sortLayers();

            //TODO: ensure that graphics are different

            zoomlightGraphic = newGraphic;

            zoomlightLayer.clear();
            zoomlightLayer.url = graphic.getLayer().url;
            zoomlightLayer.objectIdField = graphic.getLayer().objectIdField;
            zoomlightLayer.add(newGraphic);

            if (graphicGroup) {
                graphicGroup.attr({ opacity: 0.35 });
            }
        }

        /**
        * Clears the Zoomlight layer and restores the opacity of the map layers if the Highlight layer is empty.
        *
        * @method zoomLightHide
        * @private
        */
        function zoomLightHide() {
            if (zoomlightGraphic) {
                zoomlightGraphic = null;
                zoomlightLayer.clear();

                if (!highlightedGraphic && graphicGroup) {
                    graphicGroup.attr({
                        opacity: 1
                    });
                }
            }
        }

        /**
        * If there a Graphic in the Highlihgh layer, resets it's bounding box and repositions an interactive maptip to match the top center of the
        * boudning box of the highlighted graphic.
        *
        * @method repositionInteractive
        * @private
        */
        function repositionInteractive() {
            if (highlightedGraphic) {
                window.setTimeout(function () {
                    var snapGraphic = Snap.select("svg .highlightLayer > *:first-child"),
                        offset;

                    if (snapGraphic) {
                        snapGraphic._.dirty = true; // dirty hack to a bug: https://github.com/adobe-webplatform/Snap.svg/issues/80
                        offset = snapGraphic.getBBox().width / 2;

                        topic.publish(EventManager.Maptips.REPOSITION_INTERACTIVE, {
                            offset: offset
                        });
                    }
                }, 10);
            }
        }

        /**
        * Initiates various listeners for the class.
        *
        * @method initListeners
        * @private
        */
        function initListeners() {
            // Subscribe to all the events that causes functionality changes
            topic.subscribe(EventManager.FeatureHighlighter.HIGHLIGHT_SHOW, highlightGraphic);

            topic.subscribe(EventManager.FeatureHighlighter.HIGHLIGHT_HIDE, highlightGraphicHide);

            topic.subscribe(EventManager.FeatureHighlighter.HOVERLIGHT_SHOW, hoverLight);

            topic.subscribe(EventManager.FeatureHighlighter.HOVERLIGHT_HIDE, hoverLightHide);

            topic.subscribe(EventManager.FeatureHighlighter.ZOOMLIGHT_SHOW, zoomLight);

            topic.subscribe(EventManager.FeatureHighlighter.ZOOMLIGHT_HIDE, zoomLightHide);

            // Trigger maptips/showInteractive --> display anchoredMapTip
            // detect when a new graphic is added to the highlihgt layer and display in interactive tooltip
            highlightLayer.on("graphic-node-add", function (evt) {
                topic.publish(EventManager.Maptips.SHOW_INTERACTIVE, {
                    target: $(evt.node),
                    graphic: highlightedGraphic
                });
            });

            // detect when a new graphic is added to the zoomlight layer and display a
            // temporary tooltip only if the zoomlighted graphic is not already highlighted
            zoomlightLayer.on("graphic-node-add", function (evt) {
                var zgKey = "0",
                    hgKey = "1",
                    objectIdField,
                    zgLayer,
                    hgLayer;

                if (highlightedGraphic) {
                    zgLayer = zoomlightGraphic.getLayer();
                    hgLayer = highlightedGraphic.getLayer();
                    objectIdField = zgLayer.objectIdField;
                    zgKey = zgLayer.url + zoomlightGraphic.attributes[objectIdField];
                    hgKey = hgLayer.url + highlightedGraphic.attributes[objectIdField];
                }

                if (zgKey !== hgKey) {
                    topic.publish(EventManager.Maptips.SHOW, {
                        target: $(evt.node),
                        graphic: zoomlightGraphic
                    });
                }
            });

            // make sure the interactive tooltip is properly positioned when the user pans and moves the map
            topic.subscribe(EventManager.Map.ZOOM_END, repositionInteractive);
            topic.subscribe(EventManager.Map.PAN_END, repositionInteractive);

            // cancel the graphicGroup after the layer reorder to force recreating of the lighthing layer groups
            topic.subscribe(EventManager.Map.REORDER_END, function () {
                graphicGroup = null;
            });
        }

        return {
            /**
            * Initiates the FeatureHighlighter static class.
            *
            * @method init
            */
            init: function () {
                config = GlobalStorage.config;
                map = RampMap.getMap();

                //
                highlightLayer = new esri.layers.GraphicsLayer({
                    id: "highlightLayer",
                    className: "highlightLayer"
                });
                highlightLayer.ramp = {
                    type: GlobalStorage.layerType.Highlight
                };

                // Layer for showing the graphic that appears when a point
                // has the mouse hovering over it but the point has not been
                // selected
                hoverlightLayer = new esri.layers.GraphicsLayer({
                    id: "hoverlightLayer",
                    className: "hoverlightLayer"
                });
                hoverlightLayer.ramp = {
                    type: GlobalStorage.layerType.Hoverlight
                };

                // Layer for showing the graphic that appears after the user
                // presses zoom to on a point
                zoomlightLayer = new esri.layers.GraphicsLayer({
                    id: "zoomLightLayer",
                    className: "zoomlightLayer"
                });
                zoomlightLayer.ramp = {
                    type: GlobalStorage.layerType.Zoomlight
                };

                map.addLayer(highlightLayer);
                map.addLayer(hoverlightLayer, 0);
                map.addLayer(zoomlightLayer, 0);

                initListeners();
            }
        };
    });