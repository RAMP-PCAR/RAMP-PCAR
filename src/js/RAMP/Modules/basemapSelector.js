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
    "utils/dictionary", "utils/popupManager", "utils/tmplHelper"],

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
        Dictionary, PopupManager, TmplHelper) {
    "use strict";

    var basemapGallery,

        currentBasemapId,
        basemaps,

        placementAnchorId = "basemapGallery",

        ui = (function () {
            var baseMapControls,
                baseMapToggle,

                selectorContainer,

                selectorPopup,
                projectionPopup,
                basemapPopup,

                //basemaps,

                cssButtonPressedClass = "button-pressed";

            return {
                /**
                * Initiates additional UI components of the widget, setting listeners and registering the popup functionality
                *
                * @method init
                * @private
                * @return {object} itself
                *
                */
                init: function (basemapId, tileSchema) {
                    var data = [],
                        pj = {},
                        basemapControl,
                        projectionControl;

                    baseMapControls = $("#basemapControls");
                    baseMapToggle = $("#baseMapToggle");

                    basemaps.forEach(function (m) {
                        if (!pj[m.tileSchema]) {
                            pj[m.tileSchema] = [];
                        }
                        pj[m.tileSchema].push(m);
                    });
                    Dictionary.forEachEntry(pj, function (k, p) {
                        data.push(
                            {
                                isActive: k === tileSchema,
                                id: k,
                                name: k,
                                maps: p
                            }
                        );
                    });

                    // load JSON templates for basemap and skin every node under the basemap selector
                    tmpl.templates = JSON.parse(TmplHelper.stringifyTemplate(basemapselectorTemplate));

                    baseMapControls.append(tmpl("basemapselector", data));
                    selectorContainer = baseMapControls.find("#basemapselector-section-container");

                    // turn on the opening and closing of the basemap selector section
                    selectorPopup = PopupManager.registerPopup(baseMapControls, "hoverIntent",
                        function (d) {
                            baseMapToggle.addClass("button-pressed");
                            this.target.slideDown("fast", function () { d.resolve(); });
                        },
                        {
                            activeClass: cssButtonPressedClass,
                            target: selectorContainer,
                            closeHandler: function (d) {
                                baseMapToggle.removeClass("button-pressed");
                                this.target.slideUp("fast", function () { d.resolve(); });
                            },
                            timeout: 500
                        }
                    );

                    projectionPopup = PopupManager.registerPopup(selectorContainer, "click",
                        function (d) {
                            if (!this.isOpen()) {
                                projectionPopup.close();
                                this.target.show();

                                $(".basemapselector-section").height(this.target.height());
                            }

                            d.resolve();
                        },
                        {
                            closeHandler: function (d) {
                                this.target.hide();
                                d.resolve();
                            },
                            openOnly: true,
                            activeClass: cssButtonPressedClass,
                            handleSelector: ".projection-button",
                            containerSelector: ".projection-list-item",
                            targetSelector: ".basemap-list-pane"
                        }
                    );

                    basemapPopup = PopupManager.registerPopup(selectorContainer, "click",
                        function (d) {
                            if (!this.isOpen()) {
                                basemapPopup.close();
                                selectBasemap(this.target.data("basemap-id"));
                            }

                            d.resolve();
                        },
                        {
                            closeHandler: function (d) {
                                d.resolve();
                            },
                            openOnly: true,
                            handleSelector: ".basemap-button",
                            activeClass: cssButtonPressedClass
                        }
                    );

                    basemapControl = selectorContainer.find("button[data-basemap-id='" + basemapId + "']");
                    projectionControl = selectorContainer.find("button[data-projection-id='" + tileSchema + "']");

                    basemapPopup.open(basemapControl);
                    projectionPopup.open(projectionControl);

                    selectorContainer
                        .find(".basemap-info span, .projection-name")
                        .each(function () {
                            var node = $(this);
                            if (node.attr("title")) {
                                if (node.isOverflowed()) {
                                    node.tooltipster({ theme: '.tooltipster-shadow' });
                                } else {
                                    node.removeAttr("title");
                                }
                            }
                        });

                    // TODO: update
                    //topic.publish(EventManager.BasemapSelector.UI_COMPLETE, { title: basemaps[0].title });

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
        }());

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

    function selectBasemap(basemapId) {
        if (currentBasemapId !== basemapId) {
            currentBasemapId = basemapId;
            basemapGallery.select(currentBasemapId);
        }
    }

    return {
        /*
         * Adds all of the basemaps specified in the application configuration to the basemap selector widget and then calls function to initializes event handling
         * @method init
         * @constructor
         *
         */
        init: function () {
            var //startId,
                esriBasemaps = [],
                basemapId, tileSchema;

            basemaps = RAMP.config.basemaps;

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

                esriBasemaps.push(basemapDijit);
            });

            //Create and start the selector
            basemapGallery = new BasemapGallery({
                showArcGISBasemaps: false,
                basemaps: esriBasemaps,
                map: RampMap.getMap()
            }, placementAnchorId);

            basemapGallery.startup();

            //startId = RAMP.config.basemaps[RAMP.config.initialBasemapIndex].id;

            //currentBasemapId = RAMP.config.basemaps[RAMP.config.initialBasemapIndex].id;
            //currentTileSchema = RAMP.config.basemaps[RAMP.config.initialBasemapIndex].tileSchema;

            basemapId = "baseSimple";
            tileSchema = "NRCAN_Lambert_3978";
            
            //basemapGallery.select(startId);

            //take over the click
            /*$(".esriBasemapGalleryNode").on("mousedown keyup", function (evt) {
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
            });*/

            initTopics();
            initListeners();

            ui
                .init(basemapId, tileSchema)
                .updateToggleLabel();
        }
    };
});