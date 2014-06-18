/*global define, dojoConfig */

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
    "dojo/_base/declare", "dojo/topic",

//RAMP
    "ramp/globalStorage", "ramp/eventManager",
],

function (
// Dojo
    declare, topic,
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
        function toggleTransition() {
            nav.navigation("toggleTransition");
        }

        topic.subscribe(EventManager.Map.EXTENT_CHANGE, function (event) {
            nav.navigation("setSliderVal", event.lod.level);
        });

        /* Keep track of when the map is in transition, the slider will throw
        errors if the value is changed during a map transition. */
        topic.subscribe(EventManager.Map.ZOOM_START, toggleTransition);
        topic.subscribe(EventManager.Map.ZOOM_END, toggleTransition);
        topic.subscribe(EventManager.Map.PAN_START, toggleTransition);
        topic.subscribe(EventManager.Map.PAN_END, toggleTransition);
    }

    return {
        /**
        * Initialize navigaion widget for pan and zooming using global configuration object
        *
        * @method init
        * @param currentLevel
        */
        init: function (currentLevel) {
            // Note: JKW added currentlevel
            GlobalStorage.config.navWidget.sliderVal = currentLevel; // reference to line 134 of jquery.ui.navigations.js

            var cssPath = GlobalStorage.config.navWidget.cssPath;
            // update cssPath of the widget so it points to the proper folder: build or src
            GlobalStorage.config.navWidget.cssPath = dojoConfig.cssFolderPath + dojoConfig.buildState + cssPath;
            GlobalStorage.config.navWidget.skin += dojoConfig.extensionPrefix;

            nav = $("#" + GlobalStorage.config.divNames.navigation).navigation(GlobalStorage.config.navWidget);
            // NOTE: JKW Document the change. Refactor,
            nav.navigation("setSliderVal", currentLevel);

            initTopics();
            initListeners();
        }
    };
});