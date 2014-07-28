/*global define, $, esri, tmpl */
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
    "utils/popupManager", "utils/tmplHelper", "utils/array"],

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
        PopupManager, TmplHelper, UtilArray) {
    "use strict";

    var basemapGallery,
        basemaps = [],
        config,

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
                baseMapControls = $("#basemapControls");
                baseMapToggle = $("#baseMapToggle");
                basemapGalleryNode = $("#basemapGallery");

                // Set alt text for selector thumbnails
                dojoArray.forEach(config.basemaps, function (basemap) {
                    domAttr.set(query(String.format("#galleryNode_{0} img", basemap.id))[0], "alt", basemap.altText);
                });

                // load JSON templates for basemap and skin every node under the basemap selector
                tmpl.templates = JSON.parse(TmplHelper.stringifyTemplate(basemapselectorTemplate));
                dojoArray.forEach($(".esriBasemapGalleryNode"), function (node, i) {
                    $(node).html(tmpl(config.siteTemplate.basemapTemplate, TmplHelper.dataBuilder(config.basemaps[i])));
                });

                // turn on the opening and closing of the basemape selector section
                PopupManager.registerPopup(baseMapControls, "hoverIntent",
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
            config = GlobalStorage.config;

            dojoArray.forEach(config.basemaps, function (basemap) {
                var layerDijit, basemapDijit;

                layerDijit = new esri.dijit.BasemapLayer({ url: basemap.url });
                basemapDijit = new esri.dijit.Basemap({
                    id: basemap.id,
                    layers: [layerDijit],
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

            var startId = UtilArray.find(GlobalStorage.config.basemaps, function (basemap) {
                return basemap.showOnInit;
            }).id;

            basemapGallery.select(startId);

            //take over the click
            $(".esriBasemapGalleryNode").on("mousedown keyup", function (evt) {
                if (evt.which === 1 || evt.which === 13 || evt.which === 32) {
                    var curr_id = basemapGallery.getSelected().id,
                        selected_node = evt.currentTarget.id,
                        selected_id = selected_node.slice(selected_node.indexOf("_") + 1);

                    if (curr_id === selected_id) {
                        return false; //prevent the basemap from changing
                    } else { //didnt select the same basemap
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