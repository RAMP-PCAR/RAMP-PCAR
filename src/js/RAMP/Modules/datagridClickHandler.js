/*global define */

/**
*
*
* @module RAMP
* @submodule Datagrid
*/

/**
* Datagridclick handler class.
*
* @class DatagridClickHandler
* @static
* @uses RAMP
* @uses GraphicExtension
* @uses EventManager
* @uses GlobalStorage
* @uses dojo/topic
* @uses dojo/dom-construct
* @uses Util
*/

define([
/* RAMP */
    "ramp/graphicExtension", "ramp/eventManager", "ramp/globalStorage",

/* Dojo */
    "dojo/topic", "dojo/dom-construct",

/* Utils */
    "utils/util"],

    function (
    /* RAMP */
    GraphicExtension, EventManager, GlobalStorage,

    /* Dojo */
    topic, domConstruct,

    /* Utils */
    UtilMisc) {
        "use strict";
        var zoomBackExtent;

        /**
        * Publishes new events when zoomCancel event happens.  Following events are published:
        * highlighter/zoomlight-hide
        * datagrid/zoomlightrow-hide
        *
        * @method onZoomCancel
        */
        function onZoomCancel() {
            topic.publish(EventManager.FeatureHighlighter.ZOOMLIGHT_HIDE);

            topic.publish("datagrid/zoomlightrow-hide");
        }

        return {
            /**
            * This function is called whenever the "Details" button is clicked in the datagrid.
            *
            * @method onDetailSelect
            * @param {JObject} buttonNode the "Details" button node
            * @param {Object} selectedGraphic {esri/Graphic} the graphic object associated with the entry in the datagrid
            */
            onDetailSelect: function (buttonNode, selectedGraphic, mode) {
                var guid = buttonNode.data("guid") || buttonNode.data("guid", UtilMisc.guid()).data("guid"),
                    content = GraphicExtension.getTextContent(selectedGraphic),
                    title = GraphicExtension.getGraphicTitle(selectedGraphic),
                    node = buttonNode.parents(".record-row").parent();

                if (mode === "summary") {
                    topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                        panelName: GlobalStorage.config.stringResources.txtGrid_details,
                        title: title,
                        content: content,
                        target: node.find(".record-controls"),
                        origin: "datagrid",
                        consumeOrigin: "rampPopup",
                        guid: guid,
                        doOnOpen: function () {
                            UtilMisc.subscribeOnce(EventManager.Maptips.EXTENT_CHANGE, function (evt) {
                                var scroll = evt.scroll;
                                topic.publish(EventManager.Datagrid.HIGHLIGHTROW_SHOW, {
                                    graphic: selectedGraphic,
                                    scroll: scroll
                                });
                            });

                            topic.publish(EventManager.FeatureHighlighter.HIGHLIGHT_SHOW, {
                                graphic: selectedGraphic
                            });
                        },
                        doOnHide: function () {
                            topic.publish(EventManager.Datagrid.HIGHLIGHTROW_HIDE);
                        },
                        doOnDestroy: function () {
                            selectedGraphic = null;

                            topic.publish(EventManager.FeatureHighlighter.HIGHLIGHT_HIDE);
                        }
                    });
                } else {
                    node = buttonNode;

                    topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                        panelName: GlobalStorage.config.stringResources.txtGrid_details,
                        title: title,
                        content: content,
                        target: node,
                        origin: "ex-datagrid",
                        templateKey: "full_sub_panel_container",
                        guid: guid,
                        //doOnOpen: function () {
                        doAfterUpdate: function () {
                            topic.publish(EventManager.Datagrid.HIGHLIGHTROW_SHOW, {
                                graphic: selectedGraphic,
                                scroll: true
                            });
                        },

                        doOnHide: function () {
                            topic.publish(EventManager.Datagrid.HIGHLIGHTROW_HIDE);
                        },

                        doOnDestroy: function () {
                            selectedGraphic = null;

                            topic.publish(EventManager.FeatureHighlighter.HIGHLIGHT_HIDE);
                        }
                    });
                }
            },

            /**
            * This function is called whenever the "Details" button is deselected (either by the user click on
            * another "Details" button, clicking on another point, or by clicking on an already highlighted
            * "Details" button).
            *
            * @method onDetailDeselect
            */
            onDetailDeselect: function (mode) {
                if (mode === "summary") {
                    topic.publish(EventManager.GUI.SUBPANEL_CLOSE, {
                        origin: "rampPopup,datagrid"
                    });
                } else {
                    topic.publish(EventManager.GUI.SUBPANEL_CLOSE, {
                        origin: "ex-datagrid"
                    });
                }
            },

            /**
            * This function is called whenever the user clicks on the "Zoom To" button.
            *
            * @method onZoomTo
            * @param {esri/geometry/Extent} currentExtent the current extent of the map
            * @param {Object} zoomToGraphic graphic object of the feature to zoom to
            */
            onZoomTo: function (currentExtent, zoomToGraphic) {
                zoomBackExtent = currentExtent;

                function callback() {
                    topic.publish(EventManager.FeatureHighlighter.ZOOMLIGHT_SHOW, {
                        graphic: zoomToGraphic
                    });

                    UtilMisc.subscribeOnceAny(["map/pan-start", "map/zoom-start"], onZoomCancel);
                }

                switch (zoomToGraphic.geometry.type) {
                    case "point":
                        topic.publish(EventManager.Map.CENTER_AND_ZOOM, {
                            graphic: zoomToGraphic,
                            level: 9,
                            callback: callback
                        });
                        break;

                    case "polygon":

                        topic.publish(EventManager.Map.SET_EXTENT, {
                            extent: zoomToGraphic._extent.expand(1.5),
                            callback: callback
                        });
                        break;

                    default:
                        topic.publish(EventManager.Map.SET_EXTENT, {
                            extent: zoomToGraphic._extent.expand(1.5),
                            callback: callback
                        });
                        break;
                }

                topic.publish(EventManager.Datagrid.ZOOMLIGHTROW_SHOW, {
                    graphic: zoomToGraphic
                });
            },

            /**
            * This function is called whenever the user clicks on the "Zoom Back" button.
            *
            * @method onZoomBack
            */
            onZoomBack: function () {
                topic.publish(EventManager.Map.SET_EXTENT, {
                    extent: zoomBackExtent
                });

                topic.publish(EventManager.FeatureHighlighter.ZOOMLIGHT_HIDE);

                topic.publish(EventManager.Datagrid.ZOOMLIGHTROW_HIDE);
            },

            /**
            * This function is called whenever the user deselects the "Zoom To" button (either by the
            * user clicking on another point on the map, or by clicking on another "Zoom To" button)
            *
            * @method onZoomCancel
            */
            onZoomCancel: function () {
                onZoomCancel();
            }
        };
    });