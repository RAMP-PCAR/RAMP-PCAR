/*global define, tmpl, RAMP */

//the "use strict" forces the ECMA Script 5 interpretation of the code

/**
*
*
* @module RAMP
* @submodule Map
*/

/**
* GraphicExtension class containing helper functions for graphic objects, data attribute objects, and the bridging between the two
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
            * Returns the object id of the given graphic object
            *
            * @param {esri/Graphic} graphic
            * @method getGraphicOid
            * @return {Integer} object id for the graphic
            */
            getGraphicOid: function (graphic) {
                var objectIdField = graphic.getLayer().objectIdField;
                return graphic.attributes[objectIdField];
            },

            /**
            * Returns the object id of the given feature data object
            *
            * @param {Object} fData a feature data object
            * @method getFDataOid
            * @return {Integer} object id for data attribute
            */
            getFDataOid: function (fData) {
                return fData.attributes[fData.parent.idField];
            },

            /**
            * Returns the feature data object of the given graphic object
            *
            * @param {esri/Graphic} graphic
            * @method getFDataForGraphic
            * @return {Object} feature data object of the given graphic object. undefined if feature data object doesn't exist
            */
            getFDataForGraphic: function (graphic) {
                var idx, ret,
                    data = RAMP.data[graphic.getLayer().id];  //the data parent for the layer the graphic belongs to

                if (data) {
                    //use graphic object id as key in index to get position of data object
                    idx = data.index[this.getGraphicOid(graphic).toString()];
                    if (typeof idx !== undefined) {
                        ret = data.features[idx];
                    }
                }
                return ret;
            },

            /**
            * Returns the layer config node for a feature data object
            *
            * @param {Object} fData a feature data object
            * @method getConfigForFData
            * @return {Object} layer config node
            */
            getConfigForFData: function (fData) {
                //DOJO circular reference nonsense not letting us use the Ramp module.  will duplicate the function locally :'(
                //return Ramp.getLayerConfigWithId(fData.parent.layerId);

                return UtilArray.find(RAMP.config.layers.wms.concat(RAMP.config.layers.feature),
                    function (layerConfig) {
                        return layerConfig.id === fData.parent.layerId;
                    });
            },

            /**
            * Get details popup content for a graphic (i.e. a point)
            *
            * @method getGraphicTextContent
            * @private
            * @param {esri/Graphic} graphic
            * @return {Object} popup content for graphic
            */
            getGraphicTextContent: function (graphic) {
                //TODO investigate ways to merge this logic with getFDataTextContent
                var templateName = graphic.getLayer().ramp.config.templates.detail;

                tmpl.cache = {};
                tmpl.templates = JSON.parse(TmplHelper.stringifyTemplate(feature_details_template));

                //grab the attribute data bound to this graphic
                var fData = this.getFDataForGraphic(graphic);
                if (fData) {
                    var datawrapper = TmplHelper.dataBuilder(fData, graphic.getLayer().ramp.config);
                    return tmpl(templateName, datawrapper);
                } else {
                    //rare case where graphic has no current feature data
                    return "";
                }
            },

            /**
            * Get popup content for a feature data object
            *
            * @method getFDataTextContent
            * @private
            * @param {Object} fData a feature data object
            * @return {Object} popup content for feature data object
            */
            getFDataTextContent: function (fData) {
                //TODO investigate ways to merge this logic with getGraphicTextContent
                var lConfig = this.getConfigForFData(fData),
                    templateName = lConfig.templates.detail;

                tmpl.cache = {};
                tmpl.templates = JSON.parse(TmplHelper.stringifyTemplate(feature_details_template));

                //grab the attribute data bound to this graphic
                var datawrapper = TmplHelper.dataBuilder(fData, lConfig);

                return tmpl(templateName, datawrapper);
            },

            /**
            * Returns the content of the name field of the provided graphic object
            *
            * @method getGraphicTitle
            * @param {esri/Graphic} graphic a graphic object or a feature object
            * @return {}
            */
            getGraphicTitle: function (graphic) {
                var fData = this.getFDataForGraphic(graphic);
                if (fData) {
                    return fData.attributes[graphic.getLayer().ramp.config.nameField];
                } else {
                    //rare case where graphic has no current feature data
                    return "";
                }
            },

            /**
            * Returns the content of the name field of the provided feature data object
            *
            * @method getFDataTitle
            * @param {Object} fData a feature data object
            * @return {}
            */
            getFDataTitle: function (fData) {
                return fData.attributes[this.getConfigForFData(fData).nameField];
            },

            /**
            * Will find a graphic in a feature layer
            *
            * @method findGraphic
            * @param {Integer} objectId an object id to find
            * @param {String} layerId a feature layer id containing the graphic
            * @return {esri/Graphic} graphic in the layer with the object id
            */
            findGraphic: function (objectId, layerId) {
                var layer = RAMP.layerRegistry[layerId];

                //with ondemand layers, graphics arrays are no longer guaranteed to be sorted by objectid.  we can no longer use binaryFind.
                //we only use this to find graphics when clicking the details / zoom button, so speed loss isn't felt often
                return UtilArray.find(layer.graphics, function (a_graphic) {
                    return this.getGraphicOid(a_graphic) === objectId;
                }, this);
            }
        };
    });