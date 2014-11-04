/*global define, $, window, Modernizr, tmpl */
/*jslint white: true */

/**
*
*
* @module Map
* @submodule Maptips
*/

/**
* Maptips class.
*
* The map tip module provides functions to create a small popup window as the mouse hovers over a feature on the map (point, polygon, line, etc.).
* NOTE: This module uses global config object. featureLayers->mapTipSettings
*
* @class Maptips
* @static
* @uses dojo/topic
* @uses RAMP
* @uses EventManager
* @uses TmplHelper
* @uses templates/feature_hovertip_template.json
* @uses templates/feature_anchortip_template.json
*/

define([
/* Dojo */
        "dojo/topic",

/* Ramp */
        "ramp/ramp", "ramp/eventManager",

/*tmplHelper */
        "utils/tmplHelper",

/* json hover template file */
        "dojo/text!./templates/feature_hovertip_template.json",
/* json archor template file*/
        "dojo/text!./templates/feature_anchortip_template.json"
],

    function (
    /* Dojo */
        topic,
    /* Ramp */
        Ramp, EventManager,

    /*tmplHelper */
        TmplHelper, hovertips_template, anchortips_template
    ) {
        "use strict";

        var hovertips_template_json = JSON.parse(TmplHelper.stringifyTemplate(hovertips_template)),
            anchortips_template_json = JSON.parse(TmplHelper.stringifyTemplate(anchortips_template)),
            maptipPrototype = {
                node: null,
                handle: null,
                graphic: null
            },

            speed = 150,
            tolerance = 0,

            highTooltip = Object.create(maptipPrototype),

            subPanelOffset;

        /**
        * Returns the position of the sub-panel relative to the leftmost edge of the screen.
        *
        * @method getSubPanelLeftOffset
        * @private
        * @return {Number} position of hte sub-panel relative to the leftmost edge of the screen
        */
        function getSubPanelLeftOffset() {
            return $(window).width() - subPanelOffset;
        }

        /**
        * Returns the position of the maptip relative to the leftmost edge of the screen.
        *
        * @method getToolTipOffset
        * @private
        * @return {Number} the position of the maptip relative to the leftmost edge of the screen
        */
        function getToolTipOffset() {
            var offset = 0;

            if (highTooltip.handle !== null && highTooltip.node !== null) {
                offset = parseInt(highTooltip.node.css("left"), 10) + highTooltip.node.width() / 2 - 20;
            }

            return offset;
        }

        /**
        * Checks if the maptip is hidden by the sub-panel and publishes a center-at event to pan the map, moving maptip into view.
        *
        * @method checkMaptipPosition
        * @private
        * @param  {jObject} target a node to which the tooltip will be attached
        * @param  {Object} graphic [description]
        */
        function checkMaptipPosition(target, graphic) {
            graphic = graphic || highTooltip.graphic || null;
            target = target || highTooltip.handle || null;

            if (target && graphic &&
                target.offset().left > getSubPanelLeftOffset()) {
                //console.log("offsets", target.offset().left, getSubPanelLeftOffset());
                topic.publish(EventManager.Map.CENTER_AT, {
                    point: graphic._extent.getCenter()
                });

                topic.publish(EventManager.Maptips.EXTENT_CHANGE, {
                    scroll: false
                });
            } else {
                topic.publish(EventManager.Maptips.EXTENT_CHANGE, {
                    scroll: true
                });
            }
        }

        /**
        * Generates content for a maptip.
        *
        * @method getMaptipContent
        * @private
        * @param  {Object} graphic map graphic the tip is describing
        * @param  {String} interactive indicates whether the maptip should have a close button
        */
        function getMaptipContent(graphic, interactive) {
            var layerUrl = graphic.getLayer().url,
                templateKey = "",
                datawrapper,
                maptipContent;

            tmpl.cache = {};

            if (interactive === true) {
                templateKey = Ramp.getLayerConfig(layerUrl).templates.anchor;
                tmpl.templates = anchortips_template_json;
            } else {
                templateKey = Ramp.getLayerConfig(layerUrl).templates.hover;
                tmpl.templates = hovertips_template_json;
            }

            datawrapper = TmplHelper.dataBuilder(graphic, layerUrl);
            maptipContent = tmpl(templateKey, datawrapper);

            return maptipContent;
        }

        /**
        * Creates a maptip on the map.
        *
        * @method showMapTip
        * @private
        * @param  {jObject} target      a node the user hovered over
        * @param  {Object} graphic     the graphic belonging to the target
        * @param  {Boolean} interactive indicates whether the maptip should have a close button
        */
        function showMapTip(target, graphic, interactive) {
            var maptipContent = getMaptipContent(graphic, interactive);

            if (maptipContent == null) {
                return;
            }
            target.tooltipster({
                offsetX: $(target)[0].getBBox().width / 2,
                content: $(maptipContent),
                interactive: true,
                arrow: true,
                updateAnimation: Modernizr.csstransitions, // known bug in tooltipster when browsers not supporting CSS animation don't display tooltips at all
                autoClose: interactive !== true,
                onlyOne: true,
                interactiveTolerance: tolerance,
                speed: speed,
                theme: (interactive === true) ? '.tooltipster-noir' : '.tooltipster-shadow'
            });

            if (!interactive) {
                target
                    .tooltipster("offsetX", $(target)[0].getBBox().width / 2) // ?
                    .mouseover();
            } else {
                // add a close button
                target
                        .tooltipster("show")
                        .tooltipster("content", $(maptipContent).append('<button class="button-none button-close"><span class="wb-invisible">Close</span></button>'));

                // set a listener to that close button
                $(target.tooltipster("elementTooltip"))
                        .find(".button-close")
                        .on("click", function () {
                            topic.publish(EventManager.GUI.SUBPANEL_CLOSE, { origin: "all" });
                        });

                // keep pointers to the tooltip parts
                highTooltip.node = $(target.tooltipster("elementTooltip"));
                highTooltip.handle = target.tooltipster();
                highTooltip.graphic = graphic;
            }
        }

        /**
        * Initialize event listeners for the maptip events
        *
        * @method initListeners
        * @private
        *
        */
        function initListeners() {
            topic.subscribe(EventManager.Maptips.SHOW, function (event) {
                //console.log(EventManager.Maptips.SHOW);
                showMapTip($(event.target), event.graphic);
            });

            topic.subscribe(EventManager.Maptips.SHOW_INTERACTIVE, function (obj) {
                //console.log(EventManager.Maptips.SHOW_INTERACTIVE);
                checkMaptipPosition(obj.target, obj.graphic);
                showMapTip(obj.target, obj.graphic, true);
            });

            topic.subscribe(EventManager.Maptips.REPOSITION_INTERACTIVE, function (obj) {
                //console.log(EventManager.Maptips.REPOSITION_INTERACTIVE);

                if (highTooltip.handle !== null && highTooltip.node !== null) {
                    var localOffset = obj.offset || 0;

                    highTooltip.handle
                            .tooltipster("offsetX", localOffset)
                            .tooltipster("reposition");

                    // check if the tooltip is "hidden" under the sub-panel; if so, hide it for real;
                    window.setTimeout(function () {
                        if (getToolTipOffset() > getSubPanelLeftOffset()) {
                            highTooltip.node.hide();
                        } else {
                            highTooltip.node.show();
                        }
                    }, speed + 10);
                }
            });

            topic.subscribe(EventManager.GUI.SUBPANEL_CHANGE, function (obj) {
                //console.log("subPanelChange", obj);
                if (obj.isComplete) {
                    if (obj.visible) {
                        subPanelOffset = obj.offsetLeft;
                        checkMaptipPosition();
                    } else {
                        subPanelOffset = 0;
                    }
                }
            });
        }

        return {
            /**
            * Calls the event handling initialization function
            * @method init
            * @constructor
            *
            */
            init: function () {
                initListeners();
            }
        };
    });