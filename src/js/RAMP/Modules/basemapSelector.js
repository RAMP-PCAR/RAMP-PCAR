/*global define, $, esri, tmpl, RAMP, i18n, TimelineLite */
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
    "utils/dictionary", "utils/popupManager", "utils/util", "utils/tmplHelper"],

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
        Dictionary, PopupManager, UtilMisc, TmplHelper) {
    "use strict";

    var basemapGallery,

        currentBasemapId,
        currentTileSchema,
        basemaps,

        placementAnchorId = "basemapGallery",

        ui = (function () {
            var baseMapControls,
                baseMapToggle,

                selectorSectionContainer,
                selectorSection,

                selectorPopup,
                projectionPopup,
                basemapPopup,

                selectorOpenTimeline = new TimelineLite({ paused: true }),

                transitionDuration = 0.4,

                cssButtonPressedClass = "button-pressed";

            function createSelectorOpenTL() {
                var time = selectorOpenTimeline.time();

                selectorOpenTimeline
                    .clear()
                    //.set(selectorSectionContainer, { display: "block" }, 0)
                    .fromTo(selectorSection, transitionDuration,
                        { top: -selectorSectionContainer.find(".basemapselector-section").outerHeight() - 20 },
                        { top: 0, ease: "easeOutCirc" }, 0)
                    .seek(time);
            }

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

                    // group basemaps by projection
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
                                tileShema: tileSchema,
                                name: k,
                                maps: p
                            }
                        );
                    });

                    // load JSON templates for basemap and skin every node under the basemap selector
                    tmpl.templates = JSON.parse(TmplHelper.stringifyTemplate(basemapselectorTemplate));

                    baseMapControls.append(tmpl("basemapselector", data));
                    selectorSectionContainer = baseMapControls.find("#basemapselector-section-container");
                    selectorSection = selectorSectionContainer.find(".basemapselector-section");

                    // turn on the opening and closing of the basemap selector section
                    selectorPopup = PopupManager.registerPopup(baseMapControls, "hoverIntent",
                        function (d) {
                            baseMapToggle.addClass("button-pressed");
                            createSelectorOpenTL();

                            selectorOpenTimeline.eventCallback("onComplete", function () {
                                d.resolve();
                            });

                            selectorSectionContainer.show();
                            selectorOpenTimeline.play();
                        },
                        {
                            activeClass: cssButtonPressedClass,
                            target: selectorSectionContainer,
                            closeHandler: function (d) {
                                createSelectorOpenTL();

                                selectorOpenTimeline.eventCallback("onReverseComplete", function () {
                                    baseMapToggle.removeClass("button-pressed");
                                    selectorSectionContainer.hide();
                                    d.resolve();
                                });

                                selectorOpenTimeline.reverse();
                            },
                            timeout: 500
                        }
                    );

                    // show/hide basemap lists based on what projection group is active
                    projectionPopup = PopupManager.registerPopup(selectorSectionContainer, "click",
                        function (d) {
                            if (!this.isOpen()) {
                                var fromHeight = selectorSection.height(),
                                    toHeight = this.target.height(),
                                    heightTimeline = new TimelineLite();

                                projectionPopup.close();

                                // animate resizing of the selector when switching between projection groups
                                heightTimeline
                                    .set(this.target, { display: "block" }, 0)
                                    .fromTo(this.target, transitionDuration, { height: fromHeight }, { height: toHeight }, 0)
                                    .to(selectorSection, transitionDuration, { height: toHeight, ease: "easeOutCirc" }, 0);
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

                    // listen to clicks on basemap list and switch basemap accordingly
                    basemapPopup = PopupManager.registerPopup(selectorSectionContainer, "click",
                        function (d) {
                            if (!this.isOpen()) {
                                basemapPopup.close();
                                selectBasemap(this.target.data("basemap-id"), this.target.data("tileshema"));
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

                    basemapControl = selectorSectionContainer.find("button[data-basemap-id='" + basemapId + "']");
                    projectionControl = selectorSectionContainer.find("button[data-projection-id='" + tileSchema + "']");

                    basemapPopup.open(basemapControl);
                    projectionPopup.open(projectionControl);

                    // set tooltips on the overflowing spans with basemap/projection names
                    selectorSectionContainer
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
                        })
                        .end().hide(); // hide baseselector after it's initiated

                    topic.publish(EventManager.BasemapSelector.UI_COMPLETE);

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
            selectBasemap(eventArg.id);
        });
    }

    /**
    * Selects a basemap in the basemapgallery based on the supplied basemap id. If the tileShema is different from the current one, reload the page.
    *
    * @method selectBasemap
    * @param {String} basemapId a basemap id used to select a basemap in the basemapgallery
    * @param {String} tileSchema a tileShema of the selected basemap
    * @private
    */
    function selectBasemap(basemapId, tileShema) {
        if (currentBasemapId !== basemapId) {
            if (currentTileSchema === tileShema) {
                currentBasemapId = basemapId;
                basemapGallery.select(currentBasemapId);
            }
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
            var initialBasemap,
                esriBasemaps = [],
                basemapId;

            basemaps = RAMP.config.basemaps;

            dojoArray.forEach(basemaps, function (basemap) {
                var basemapDijit,
                    baseampLayers = [];

                // iterate over basemap layers and create layer objects for each;
                // these objects can have any of the properties of the Basemap param constructor object here: https://developers.arcgis.com/javascript/jsapi/basemaplayer-amd.html#basemaplayer1
                basemap.layers.forEach(function (layer) {
                    //console.log(layer);
                    baseampLayers.push(
                        new esri.dijit.BasemapLayer(layer)
                    );
                });

                basemapDijit = new esri.dijit.Basemap({
                    id: basemap.id,
                    layers: baseampLayers, // shovel all the layers into the basemap
                    title: String.format("{0}, {1}", basemap.name, i18n.t('config.tileSchema.' + basemap.tileSchema)),
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

            initialBasemap = basemaps[RAMP.config.initialBasemapIndex];
            // currentBasemapId is not specified from the start because the basemap hasn't been selected yet through the basemapgallery
            basemapId = initialBasemap.id;
            currentTileSchema = initialBasemap.tileSchema;

            initTopics();
            initListeners();

            ui
                .init(basemapId, currentTileSchema)
                .updateToggleLabel();
        }
    };
});