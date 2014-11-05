/*global define, tmpl */

//the "use strict" forces the ECMA Script 5 interpretation of the code

/**
*
*
* @module RAMP
* @submodule Map
*/

/**
* GraphicExtension class containing helper functions for graphic objects.
* Note this class requires the config object.
*
* @class GraphicExtension
* @static
* @uses RAMP
* @uses Array
* @uses Dictionary
* @uses Util
* @uses templates/point_details_list_Template.html
* @uses templates/point_details_list_item_Template.html
*/

define([
// RAMP
    "ramp/ramp",

// Utils
    "utils/array", "utils/dictionary", "utils/util", "utils/tmplHelper",

//details template
    "dojo/text!./templates/feature_details_template.json"],

    function (
    // RAMP
    Ramp,

    // Utils
    UtilArray, UtilDict, UtilMisc, TmplHelper,

    //json details template
    feature_details_template) {
        "use strict";

        return {
            /**
            * Given a graphic object, returns the config object associated with the graphic's layer.
            *
            * @method getLayerConfig
            * @param {esri/Graphic} graphic a graphic object or a feature object
            * @return {esri/Graphic}
            */
            getLayerConfig: function (graphic) {
                return Ramp.getLayerConfig(graphic.getLayer().url);
            },

            /**
            * Returns the oid of the given graphic object
            *
            * @param {esri/Graphic} graphic
            * @method getOid
            */
            getOid: function (graphic) {
                var objectIdField = graphic.getLayer().objectIdField;
                return graphic.attributes[objectIdField];
            },

            /**
            * Get popup content for a graphic (i.e. a point)
            * This logic is customized per project
            *
            *
            * @method getTextContent
            * @private
            * @param {Object} graphic
            * @return {Object} found graphic object
            */
            getTextContent: function (graphic) {
                var templateName = Ramp.getLayerConfig(graphic.getLayer().url).templates.detail;

                function fillTemplate(graphic) {
                    tmpl.cache = {};
                    tmpl.templates = JSON.parse(
                        TmplHelper.stringifyTemplate(feature_details_template));

                    var datawrapper = TmplHelper.dataBuilder(graphic, graphic.getLayer().url),
                        result = tmpl(templateName, datawrapper);

                    return result;
                }

                //return generateHtml(graphic.attributes);
                return fillTemplate(graphic);
            },

            /**
            * Returns the content of the name field of the provided graphic object
            *
            * @method getGraphicTitle
            * @param {esri/Graphic} graphic a graphic object or a feature object
            * @return {}
            */
            getGraphicTitle: function (graphic) {
                return graphic.attributes[this.getLayerConfig(graphic).nameField];
            }
        };
    });