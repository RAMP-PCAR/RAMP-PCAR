/* global define, RAMP */
/* jshint bitwise:false  */

/**
* Utility module containing useful static classes.
*
* @module Utils
* @submodule TmplUtil
*/

/**
* A set of functions used to support and standardize the use of templating.
*
*
* @class TmplHelper
* @static
* @uses dojo/_base/lang
* @uses GlobalStorage
* @uses RAMP
* @uses TmplUtil
*/

define([
        /* Dojo */
        "dojo/_base/lang",

        /* Ramp Modules */
        "ramp/globalStorage",
        "ramp/ramp",
        "utils/tmplUtil"

],
    function (dojoLang, GlobalStorage, Ramp, TmplUtil) {
        "use strict";

        return {
            /*
             * Create a data wrapper with properties: data, config, str, lyr, fn
             * @method dataBuilder
             * @param {Object} data A json object passing over.
             * @param {String} layerConfig config object for specific layer (optional)
             * @returns {Object} Returns a JSON object with following properties
             *      .data = {}
             *      .config = <global config object>
             *      .lyr = <global config object . layers.feature [parameter index] >
             *      .fn = object with helper functions assigned to it.
             *
             */
            dataBuilder: function (data, layerConfig) {
                var dataWrapperPrototype = {
                    data: null,
                    config: null,
                    str: null,
                    lyr: null,
                    fn: null
                },
                    dataWrapper = Object.create(dataWrapperPrototype);

                dataWrapper.data = data;
                dataWrapper.config = RAMP.config;

                if (layerConfig != null) {
                    dataWrapper.lyr = layerConfig;
                }

                dataWrapper.fn = TmplUtil;
                return dataWrapper;
            },

            /*
             * Create a data wrapper with properties: data, config, str, fn
             * @method genericDataBuilder
             * @param {Object} data A json object passing over.
             * @returns {Object} Returns a JSON object with following properties
             *      .data = {}
             *      .config = <global config object>
             *      .lyr = <global config object . featurelayers [parameter index] >
             *      .fn = object with helper functions assigned to it.
             *
             */
            genericDataBuilder: function (data) {
                var dataWrapperPrototype = {
                    data: null,
                    config: null,
                    str: null,
                    fn: null
                },
                    dataWrapper = Object.create(dataWrapperPrototype);

                dataWrapper.data = data;
                dataWrapper.config = RAMP.config;

                dataWrapper.fn = TmplUtil;
                return dataWrapper;
            },

            /*
             *  strips comments from json template
             * @method stringifyTemplate
             * @param {String} template A template in JSON format
             * @returns {String} A JSON template without comments
             *
             */
            stringifyTemplate: function (template) {
                return template
                    // strip comments from the template
                    .replace(/`(?:\\.|[^`])*`|'(?:\\.|[^'])*'|"(?:\\.|[^"])*"|\/\*[^]*?\*\/|\/\/.*\n?/g,
                                         function (s) {
                                             if (s.charAt(0) === '/') {
                                                 return '';
                                             } else {
                                                 return s;
                                             }
                                         })
                    // remove hard breaks and tabs
                    .replace(/[\n\r\t]/g, "")
                    .replace(/>\s*?</g, "><");
            }
        };
    });