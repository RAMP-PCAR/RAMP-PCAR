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
* ####Imports RAMP Modules:
* {{#crossLink "Dictionary"}}{{/crossLink}}  
* {{#crossLink "TmplHelper"}}{{/crossLink}}  
* {{#crossLink "Util"}}{{/crossLink}}  
* {{#crossLink "Array"}}{{/crossLink}}  
* 
* ####Uses RAMP Templates:
* {{#crossLink "templates/point_details_list_Template.json"}}{{/crossLink}}
* {{#crossLink "templates/point_details_list_item_Template.json"}}{{/crossLink}}

* @class GraphicExtension
* @static
*/

define([
// Utils
    "utils/array", "utils/dictionary", "utils/util", "utils/tmplHelper",

//details template
    "dojo/text!./templates/feature_details_template.json"],

    function (
    // Utils
    UtilArray, UtilDict, UtilMisc, TmplHelper,

    //json details template
    feature_details_template) {
        "use strict";

        return {
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
                var templateName = graphic.getLayer().ramp.config.templates.detail;

                function fillTemplate(graphic) {
                    tmpl.cache = {};
                    tmpl.templates = JSON.parse(
                        TmplHelper.stringifyTemplate(feature_details_template));

                    var datawrapper = TmplHelper.dataBuilder(graphic, graphic.getLayer().ramp.config),
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
                return graphic.attributes[graphic.getLayer().ramp.config.nameField];
            }
        };
    });