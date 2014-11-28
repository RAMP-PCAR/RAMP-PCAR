/* global define, $, RAMP */

/**
* Navigation submodule
*
* @module RAMP
* @submodule Navigation
* @main Navigation
*/

/**
* Navigation class.
*
* This module provide function to initialize navigation widget using settings stored in
* global configuration object.
*
* NOTE: jquery.ui.navigation.js is required to create the object
*
* @class Navigation
* @static
* @uses dojo/_base/declare
* @uses dojo/topic
* @uses GlobalStorage
* @uses EventManager
*/

define([
//Dojo
    "dojo/_base/declare", "dojo/topic", "dojo/_base/lang",

//RAMP
    "ramp/globalStorage", "ramp/eventManager"
],

function (
// Dojo
    declare, topic, lang,
// RAMP
    GlobalStorage, EventManager) {
    "use strict";
    var nav;

    /**
    * Listen to internal events and republish for other modules' benefit
    *
    * @method initTopics
    * @private
    */
    function initTopics() {
        nav
            .on("navigation:panClick", function (e, direction) {
                topic.publish(EventManager.Navigation.PAN, {
                    direction: direction
                });
            })
            .on("navigation:zoomClick", function (e, in_out) {
                var newLvl = (in_out === "zoomIn") ? 1 : -1;
                topic.publish(EventManager.Navigation.ZOOM_STEP, {
                    level: newLvl
                });
            })
            .on("navigation:zoomSliderChange", function (e, newVal) {
                topic.publish(EventManager.Navigation.ZOOM, {
                    level: newVal
                });
            })
            .on("navigation:fullExtentClick", function () {
                topic.publish(EventManager.Navigation.FULL_EXTENT);
            });
    }

    /**
    * Listen to map evens and adjust the navigation widget accordingly
    *
    * @method  initListeners
    * @private
    */
    function initListeners() {
        function toggleTransition(inTransition) {
            nav.navigation("toggleTransition", inTransition);
        }

        topic.subscribe(EventManager.Map.EXTENT_CHANGE, function (event) {
            nav.navigation("setSliderVal", event.lod.level);
        });

        /* Keep track of when the map is in transition, the slider will throw
        errors if the value is changed during a map transition. */
        // explicitly set inTransition true on zoom and pan start
        topic.subscribe(EventManager.Map.ZOOM_START, function () { toggleTransition(true); });
        topic.subscribe(EventManager.Map.PAN_START, function () { toggleTransition(true); });

        //topic.subscribe(EventManager.Map.PAN_END, toggleTransition);
        //topic.subscribe(EventManager.Map.ZOOM_END, toggleTransition);

        // only set inTransition false on extent change
        topic.subscribe(EventManager.Map.EXTENT_CHANGE, function () { toggleTransition(false); });
    }

    return {
        /**
        * Initialize navigation widget for pan and zooming using global configuration object
        *
        * @method init
        * @param {Number} currentLevel
        */
        init: function (currentLevel) {

            // NOTE: JKW Document the change. Refactor,
            nav.navigation("setSliderVal", currentLevel);
            initTopics();
            initListeners();
        },

        construct: function () {
            // Note: JKW added currentlevel
            //RAMP.config.navWidget.sliderVal = currentLevel; // reference to line 134 of jquery.ui.navigations.js

            var options = lang.mixin({}, 
                RAMP.config.navWidget,
                {locale: RAMP.locale}
            );

            nav = $("#" + RAMP.config.divNames.navigation).navigation(options);
        }
    };
});