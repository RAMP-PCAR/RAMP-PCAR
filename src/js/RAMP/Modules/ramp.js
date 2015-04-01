/*global define, RAMP */

/**
*
*
* @module RAMP
*/

/**
* RAMP class.
*
* Module for shared code that need the global configuration object.
* For code that can be of use to any javascript program and do not
* require the global configuration object, place the code in
* util.js
*
* ####Imports RAMP Modules:
* {{#crossLink "GlobalStorage"}}{{/crossLink}}  
* {{#crossLink "Array"}}{{/crossLink}}  
* {{#crossLink "Dictionary"}}{{/crossLink}}  
* {{#crossLink "Util"}}{{/crossLink}}  
* {{#crossLink "TmplUtil"}}{{/crossLink}}  
* 
* @class RAMP
* @uses dojo/_base/declare
* @uses dojo/query
* @uses dojo/_base/array
* @uses dojo/dom
* @uses dojo/dom-class
* @uses dojo/dom-style
* @uses dojo/dom-construct
* @uses dojo/request/script
*/

define([
    // Dojo
    "dojo/_base/declare", "dojo/query", "dojo/_base/array", "dojo/dom", "dojo/dom-class", "dojo/dom-style",
    "dojo/dom-construct", "dojo/request/script",

    // RAMP
    "ramp/globalStorage", "ramp/map",

    // Utils
    "utils/array", "utils/dictionary", "utils/util", "utils/tmplUtil"
],

    function (
        // Dojo
        declare, dojoQuery, dojoArray, dom, domClass, domStyle, domConstruct, requestScript,

        // RAMP
        GlobalStorage, RampMap,

        // Utils,
        UtilArray, UtilDict, UtilMisc, UtilTmpl
    ) {
        "use strict";
        return {
            /**
            * Updates some of the Strings on the HTML page using the config string resources
            *
            * @method loadStrings
            */
            loadStrings: function () {
                // doesn't seem to be doing a lot, this function
            },
          
            /**
            * Returns the feature layer config for the given id
            *
            * @param {String} id layer id string
            * @method getLayerConfigWithId
            */
            getLayerConfigWithId: function (id) {
                return UtilArray.find(RAMP.config.layers.wms.concat(RAMP.config.layers.feature),
                    function (layerConfig) {
                        return layerConfig.id === id;
                    });
            },

            /**
            * Given a feature object or a graphic object (or any object that has a getLayer method and an
            * attributes field) return the object containing the image URL and legend text for that
            * feature/graphic object.
            *
            * @param {Object} feature
            * @return {icon} The default icon used to represent the feature layer
            * @method getSymbolForFeature
            */
            getSymbolForFeature: function (feature) {
                var layerConfig = feature.getLayer().ramp.config;

                //as this function is used by templating, we piggyback the logic here
                return UtilTmpl.getGraphicIcon(feature, layerConfig);
            },

            /**
             * This method builds a complete service URL callout for a map configuration. The URL is built using a base URL and map ID, and a language culture code.
             * @method getServiceURL
             * @param {String} rampService The base URL for a web service that provide's valid map JSON configuration data
             * @param {Number} mapID a unique identifier for a group of map configuration
             * @param {String} language culture code either 'en' or 'fr'
             *
             */
            getServiceURL: function (rampService, mapID, language) {
                var serviceURL = rampService + "configservice/map?mapid=" + mapID + "&lang=" + language;
                return serviceURL;
            }
        };
    });