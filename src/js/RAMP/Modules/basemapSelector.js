/*global define, $, esri, tmpl, RAMP, console */
/*jslint white: true */

/**
*
* @module RAMP
*/

/**
* Populates the BasemapGallery widget located in the maps toolbar with items found in the application configuration.
* This module also handles all the event  needed to change the map basemap and update the UI
*
*
* @class BaseMapSelector
* @static
* @uses dojo/_base/array
* @uses dojo/_base/lang
* @uses dojo/dom-attr
* @uses dojo/query
* @uses dojo/topic
* @uses templates/basemap_selector_template.json
* @uses GlobalStorage
* @uses Map
* @uses EventManager
* @uses esri/dijit/BasemapGallery
* @uses utils/popupManager
* @uses utils/thmplHelper
*/

define([
// Dojo
    "dojo/_base/array", "dojo/_base/lang", "dojo/dom-attr", "dojo/query", "dojo/topic",
// Templates
    "dojo/text!./templates/basemap_selector_template.json",
// Ramp
    "ramp/globalStorage", "ramp/map", "ramp/eventManager",
// Esri
    "esri/dijit/BasemapGallery",
// Util
    "utils/popupManager", "utils/tmplHelper"],

function (
        // Dojo
        dojoArray, dojoLang, domAttr, query, topic,
        // Templates
        basemapselectorTemplate,
        // Ramp
        GlobalStorage, RampMap, EventManager,
        // Esri
        BasemapGallery,
        // Util
        PopupManager, TmplHelper) {
    "use strict";

    var basemapGallery,
        basemaps = [],

        placementAnchorId = "basemapGallery",

        baseMapControls,
        baseMapToggle,
        basemapGalleryNode,

        cssButtonPressedClass = "button-pressed",

        ui = {
            /**
            * Initiates additional UI components of the widget, setting listeners and registering the popup functionality
            *
            * @method init
            * @private
            * @return {object} itself
            *
            */
            init: function () {
                var b,
                    //projectionButtons,
                    //basemapButtons,
                    projectionPopup,
                    basemapPopup;

                baseMapControls = $("#basemapControls");
                baseMapToggle = $("#baseMapToggle");
                basemapGalleryNode = $("#basemapGallery").attr("role", "listbox");

                // Set alt text for selector thumbnails
                dojoArray.forEach(RAMP.config.basemaps, function (basemap) {
                    domAttr.set(query(String.format("#galleryNode_{0} img", basemap.id))[0], "alt", basemap.altText);
                });

                // load JSON templates for basemap and skin every node under the basemap selector
                tmpl.templates = JSON.parse(TmplHelper.stringifyTemplate(basemapselectorTemplate));
                dojoArray.forEach($(".esriBasemapGalleryNode"), function (node, i) {
                    $(node).html(tmpl(RAMP.config.templates.basemap, TmplHelper.dataBuilder(RAMP.config.basemaps[i])));
                });

                // turn on the opening and closing of the basemap selector section
                PopupManager.registerPopup(baseMapControls, "_hoverIntent_",
                    function (d) {
                        basemapGalleryNode.slideDown("fast", function () { d.resolve(); });
                    },
                    {
                        activeClass: cssButtonPressedClass,
                        target: basemapGalleryNode,
                        closeHandler: function (d) {
                            basemapGalleryNode.slideUp("fast", function () { d.resolve(); });
                        },
                        timeout: 500
                    }
                );

                topic.publish(EventManager.BasemapSelector.UI_COMPLETE, { title: basemaps[0].title });

                b = [
                        {
                            name: "Lambert",
                            maps: [
                                {
                                    name: "Lambert 1",
                                    id: "l1"
                                },
                                {
                                    name: "Lambert 2",
                                    id: "l2"
                                },
                                {
                                    name: "Lambert 3",
                                    id: "l3"
                                }
                            ]
                        },
                        {
                            name: "Mercator",
                            isActive: true,
                            maps: [
                                {
                                    name: "Mercator 1",
                                    id: "m1"
                                },
                                {
                                    name: "Mercator 2",
                                    id: "m2"
                                },
                                {
                                    name: "Mercator 3",
                                    id: "m3"
                                },
                                {
                                    name: "Mercator 4",
                                    id: "m4"
                                }
                            ]
                        }
                ];

                $("#basemapGallery").after(
                    tmpl("basemapselector", b)

                );

                projectionPopup = PopupManager.registerPopup($("#basemapselector-section-container"), "click",
                    function (d) {
                        console.log(this.target, this.handle);

                        if (!this.isOpen()) {
                            projectionPopup.close();
                            this.target.show();
                        }

                        d.resolve();
                    },
                    {
                        closeHandler: function (d) {
                            this.target.hide();
                            d.resolve();
                        },
                        oneWay: true,
                        activeClass: cssButtonPressedClass,
                        handleSelector: ".projection-button",
                        targetContainerSelector: ".projection-list-item",
                        targetSelector: ".basemap-list-pane"
                    }
                );

                basemapPopup = PopupManager.registerPopup($("#basemapselector-section-container"), "click",
                    function (d) {
                        console.log(this.target, this.handle);

                        if (!this.isOpen()) {
                            basemapPopup.close();                            
                        }

                        d.resolve();
                    },
                    {
                        closeHandler: function (d) {
                            d.resolve();
                        },
                        oneWay: true,
                        handleSelector: ".basemap-button",
                        activeClass: cssButtonPressedClass
                    }
                );

                //console.log("sa", projectionPopup._spawnPopups());
                //projectionPopup.open($(".projection-button:first"));

                basemapPopup.open($("#m2"));
                projectionPopup.open($("#m2").parents(".projection-list-item").find(".projection-button"));

                return this;
            },
            /*
             * Changes the text shown on the toolbar to match the currently selected basemap's title
             * @method updateToggleLabel
             * @private
             *
             */
            updateToggleLabel: function () {
                baseMapToggle.find("span:first").text(basemapGallery.getSelected().title);
            }
        };

    /**
    * Initializes functions that publish events.
    *
    * @method initTopics
    * @private
    */
    function initTopics() {
        /* PUBLISH */
        basemapGallery.on("selection-change", function () {
            var basemap = basemapGallery.getSelected();

            ui.updateToggleLabel();
            topic.publish(EventManager.BasemapSelector.BASEMAP_CHANGED, {
                id: basemap.id,
                title: basemap.title,
                cssStyle: basemap.scaleCssClass
            });
        });
    }

    /**
    * Initializes class listeners.
    *
    * @method initListeners
    * @private
    */
    function initListeners() {
        /* SUBSCRIBE */
        topic.subscribe(EventManager.BasemapSelector.TOGGLE, function (eventArg) {
            basemapGallery.select(eventArg.id);
        });
    }

    return {
        /*
         * Adds all of the basemaps specified in the application configuration to the basemap selector widget and then calls function to initializes event handling
         * @method init
         * @constructor
         *
         */
        init: function () {

            dojoArray.forEach(RAMP.config.basemaps, function (basemap) {
                var basemapDijit,
                    baseampLayers = [];

                // iterate over basemap layers and create layer objects for each;
                // these objects can have any of the properties of the Basemap param constructor object here: https://developers.arcgis.com/javascript/jsapi/basemaplayer-amd.html#basemaplayer1
                basemap.layers.forEach(function (layer) {
                    console.log(layer);
                    baseampLayers.push(
                        new esri.dijit.BasemapLayer(layer)
                    );
                });

                basemapDijit = new esri.dijit.Basemap({
                    id: basemap.id,
                    layers: baseampLayers, // shovel all the layers into the basemap
                    title: String.format("{0} ({1})", basemap.name, basemap.type),
                    thumbnailUrl: basemap.thumbnail
                });
                basemapDijit.scaleCssClass = basemap.scaleCssClass;

                basemaps.push(basemapDijit);
            });

            //Create and start the selector
            basemapGallery = new BasemapGallery({
                showArcGISBasemaps: false,
                basemaps: basemaps,
                map: RampMap.getMap()
            }, placementAnchorId);

            basemapGallery.startup();

            var startId = RAMP.config.basemaps[RAMP.config.initialBasemapIndex].id;

            basemapGallery.select(startId);

            //take over the click
            $(".esriBasemapGalleryNode").on("mousedown keyup", function (evt) {
                if (evt.which === 1 || evt.which === 13 || evt.which === 32) {
                    var curr_id = basemapGallery.getSelected().id,
                        selected_node = evt.currentTarget.id,
                        selected_id = selected_node.slice(selected_node.indexOf("_") + 1);

                    if (curr_id === selected_id) {
                        return false; //prevent the basemap from changing
                    } else { //didn't select the same basemap
                        basemapGallery.select(selected_id);
                    }
                }
            });

            initTopics();
            initListeners();

            ui
                .init()
                .updateToggleLabel();
        }
    };
});