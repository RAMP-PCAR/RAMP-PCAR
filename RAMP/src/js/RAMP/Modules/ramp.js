/*global define */

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
* @class RAMP
* @uses dojo/_base/declare
* @uses dojo/query
* @uses dojo/_base/array
* @uses dojo/dom
* @uses dojo/dom-class
* @uses dojo/dom-style
* @uses dojo/dom-construct
* @uses dojo/request/script
* @uses GlobalStorage
* @uses Array
* @uses Dictionary
* @uses Util
* @uses TmplUtil
*/

define([
// Dojo
    "dojo/_base/declare", "dojo/query", "dojo/_base/array", "dojo/dom", "dojo/dom-class", "dojo/dom-style",
    "dojo/dom-construct", "dojo/request/script",

// RAMP
    "ramp/globalStorage", "ramp/map",

// Utils
    "utils/array", "utils/dictionary", "utils/util", "utils/tmplUtil"],

    function (
    // Dojo
    declare, dojoQuery, dojoArray, dom, domClass, domStyle, domConstruct, requestScript,

    // RAMP
    GlobalStorage, RampMap,

    // Utils,
    UtilArray, UtilDict, UtilMisc, UtilTmpl) {
        "use strict";
        return {
            /**
            * Updates some of the Strings on the HTML page using the config string resources
            *
            * @method loadStrings
            */
            loadStrings: function () {
                var stringResources = GlobalStorage.config.stringResources;
                //<Title>
                //dojoQuery("title")[0].text(stringResources.txtPageTitle + " " + stringResources.txtPageSubTitle);

                //H1
                //$("#H1")[0].text(stringResources.txtMapTitle);

                //pageTitle
                //$("#pageTitle")[0].text(stringResources.txtPageTitle);

                //envm
                $("#envm")[0].text(stringResources.txtPageSubTitle);
            },

            /**
            * Returns the feature layer config for the given url
            *
            * @param url {String}
            * @method getLayerConfig
            */
            getLayerConfig: function (url) {
                if (!GlobalStorage.urlCfg) {
                    GlobalStorage.urlCfg = {};
                }

                if (GlobalStorage.urlCfg[url] === undefined) {
                    var res = UtilArray.find(GlobalStorage.config.featureLayers, function (layerConfig) {
                        return layerConfig.url === url;
                    });

                    GlobalStorage.urlCfg[url] = res;
                }

                return GlobalStorage.urlCfg[url];
            },
            /**
             * Gets the defined symbology from a layer's web service
             * @method _getSymbolConfig
             * @param {String} layerUrl A URL to the feature layer service
             * @returns {esri/layer/symbology} The defined symbology from the layer definition
             */
            _getSymbolConfig: function (layerUrl) {
                return this.getLayerConfig(layerUrl).symbology;
            },
            /**
             * Gets the default symbology icon from a layer's web service
             * @method _getSymbolConfig
             * @param {Object} layer A feature layer
             * @returns {icon} The default icon from the layer's symbology
             */
            getSymbolForLayer: function (layer) {
                var symbolConfig = this._getSymbolConfig(layer.url);
                return symbolConfig.icons["default"];
            },

            /**
            * Given a feature object or a graphic object (or any object that has a getLayer method and an
            * attributes field) return the object containing the image URL and legend text for that
            * feature/graphic object.
            *
            * @param feature {}
            * @return {icon} The default icon used to represent the feature layer
            * @method getSymbolForFeature
            */
            getSymbolForFeature: function (feature) {
                var layerConfig = this.getLayerConfig(feature.getLayer().url);

                //as this function is used by templating, we piggyback the logic here
                return UtilTmpl.getGraphicIcon(feature, layerConfig);
            },
            /*
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