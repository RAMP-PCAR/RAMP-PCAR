/* global define, navigator, $, RAMP, i18n */

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
* ####Imports RAMP Modules:
<<<<<<< HEAD
* {{#crossLink 'GlobalStorage'}}{{/crossLink}}
* {{#crossLink 'EventManager'}}{{/crossLink}}
=======
* {{#crossLink "GlobalStorage"}}{{/crossLink}}
* {{#crossLink "EventManager"}}{{/crossLink}}
>>>>>>> develop
*
* @class Navigation
* @static
* @uses dojo/_base/declare
* @uses dojo/topic
*/

define([

//Dojo
    'dojo/_base/declare', 'dojo/topic', 'dojo/_base/lang',

//RAMP
    'ramp/globalStorage', 'ramp/eventManager',
    'esri/geometry/Point',

/* Util */
    'utils/util',
],

function (

// Dojo
    declare, topic, lang,

// RAMP
    GlobalStorage, EventManager, Point,

// Util
    UtilMisc) {
    'use strict';
    var nav;
    var geolocate;
    var map;

    /**
    * Listen to internal events and republish for other modules' benefit
    *
    * @method initTopics
    * @private
    */
    function initTopics() {
        // Convert point into current projection
        function _convertPoint(x) {
            var esriPoint = UtilMisc.latLongToMapPoint(x.coords.latitude, x.coords.longitude,
                map.extent.spatialReference);
            var scaleLimit = RAMP.map._layers.layer0.maxScale;
            var lod = UtilMisc.getZoomInLimit(scaleLimit);

            if (lod > 12) { lod = 12; }

            map.centerAndZoom(esriPoint, lod);
        }

        // Pan and zoom to a given point
        function _goToPoint() {
            if (geolocate) {
                geolocate.getCurrentPosition(
                    _convertPoint,

                    // If the call returns with an error
                    function () {
                        // Remake tooltip
                        UtilMisc.tooltipster($('.jq-navigation-geoButton'), null, 'destroy');
                        $('.jq-navigation-geoLocate').attr('title',
                            i18n.t('geolocate.noSupport'));
                        UtilMisc.tooltipster($('.jq-navigation-geoButton'), null, null, 'tooltipster-error-above');

                        // Disable button
                        $('.jq-navigation-geoLocate').attr('class', 'jq-navigation-geoLocate-disabled');

                        // Once the button is disabled don't bother checking again
                        geolocate = null;
                    }

                );
            }
        }

        nav
            .on('navigation:panClick', function (e, direction) {
                topic.publish(EventManager.Navigation.PAN, {
                    direction: direction,
                });
            })
            .on('navigation:zoomClick', function (e, inOut) {
                var newLvl = (inOut === 'zoomIn') ? 1 : -1;
                topic.publish(EventManager.Navigation.ZOOM_STEP, {
                    level: newLvl,
                });
            })
            .on('navigation:zoomSliderChange', function (e, newVal) {
                topic.publish(EventManager.Navigation.ZOOM, {
                    level: newVal,
                });
            })
            .on('navigation:fullExtentClick', function () {
                topic.publish(EventManager.Navigation.FULL_EXTENT);
            })
            .on('navigation:geoLocateClick', function () {
                _goToPoint();
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
            nav.navigation('toggleTransition', inTransition);
        }

        topic.subscribe(EventManager.Map.EXTENT_CHANGE, function (event) {
            nav.navigation('setSliderVal', event.lod.level);
        });

        // Keep track of when the map is in transition, the slider will throw
        // errors if the value is changed during a map transition.
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
            // TODO: Setting disabled to the zoomout button on init, will reset its CSS class the next slidervalue
            // is set. This is a quirk of implementation. With css classes reset before tooltipster is run, there is
            // no hook to attach a tooltip to.
            // Ideally, need to refactor nav widget to not reset all css classes on button, but only toggle the
            // disabled state.
            map = RAMP.map;
            geolocate = navigator.geolocation;

            nav.navigation('setSliderVal', currentLevel);
            initTopics();
            initListeners();
        },

        construct: function () {
            // Note: JKW added currentlevel
            //RAMP.config.navWidget.sliderVal = currentLevel; // reference to line 134 of jquery.ui.navigations.js

            var options = lang.mixin({},
                RAMP.config.navWidget,
                { locale: RAMP.locale }
            );

            nav = $('#' + RAMP.config.divNames.navigation).navigation(options);
        },
    };
});
