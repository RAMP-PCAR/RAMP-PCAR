/* global define, RAMP, tmpl */
/* jshint bitwise:false  */

/**
* Utility module containing useful static classes.
*
* @module Utils
*/

/**
* A set of functions used to support and standardize the use of templating.
*
* ####Imports RAMP Modules:
* {{#crossLink 'RAMP'}}{{/crossLink}}
* {{#crossLink 'TmplUtil'}}{{/crossLink}}
*
* @class TmplHelper
* @static
* @uses dojo/_base/lang
*/

define(['dojo/_base/lang', 'utils/tmplUtil'],
    function (lang, TmplUtil) {
        'use strict';

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
                        fn: null,
                    };
                var dataWrapper = Object.create(dataWrapperPrototype);

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
                        fn: null,
                    };
                var dataWrapper = Object.create(dataWrapperPrototype);

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
                    .replace(/`(?:\\.|[^`])*`|'(?:\\.|[^'])*'|'(?:\\.|[^'])*'|\/\*[^]*?\*\/|\/\/.*\n?/g,
                                         function (s) {
                                             if (s.charAt(0) === '/') {
                                                 return '';
                                             } else {
                                                 return s;
                                             }
                                         })

                    // remove hard breaks and tabs
                    .replace(/[\n\r\t]/g, '')
                    .replace(/>\s*?</g, '><')

                    // strip spaces between html and other tags
                    .replace(/%}\s*?</g, '%}<')
                    .replace(/>\s*?{%/g, '>{%')

                    .replace(/'\s*?</g, '"<')
                    .replace(/>\s*?'/g, '>"');
            },

            /**
            * Populates a template specified by the key with the supplied data.
            *
            * @param {String} key template name
            * @param {Object} data data to be inserted into the template
            * @param {Object} templates a set of templates to run the engine against
            * @method template
            * @private
            * @return {String} a string template filled with supplied data
            */
            template: function (key, data, templates) {
                var d = lang.clone(data) || {};
                tmpl.cache = {};
                tmpl.templates = templates;

                d.fn = TmplUtil;

                return tmpl(key, d);
            },
        };
    });
