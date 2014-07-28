/* global define */

/**
* Utility module containing useful static classes.
*
* @module Utils
*/

/**
* A set of functions that can be accessed within templates
*
*
* @class TmplUtil
* @static
*/

define([],
    function () {
        "use strict";

        return {
            /**
            * Given a feature object or a graphic object (or any object that has a getLayer method and an
            * attributes field) return the image URL for that feature/graphic object.
            *
            * NOTE: all dependent functions should be written as nested functions inside the caller function, otherwise TmplEx templating library won't identify
            *
            * @method getGraphicIcon
            * @param {Graphic} graphic
            * @param {Object} layerConfig
            * @return {String} imageUrl Url to the features symbology image
            */
            getGraphicIcon: function (graphic, layerConfig) {
                var symbolConfig = layerConfig.symbology;

                //TODO expand logic.  Need to handle up to 3 keys in unique renderer.  Need to handle Ranged renderer
                switch (symbolConfig.renderer.type) {
                    case "unique":
                        var key = graphic.attributes[symbolConfig.renderer.key1];
                        return symbolConfig.icons[key].imageUrl;

                    case "simple":
                        return symbolConfig.icons["default"].imageUrl;
                    default:
                        return symbolConfig.icons["default"].imageUrl;
                }
            },

            /**
            * Given a feature object or a graphic object (or any object that has a getLayer method and an
            * attributes field) return the attribute value for its designed "name" field
            *
            * NOTE: all dependent functions should be written as nested functions inside the caller function, otherwise TmplEx templating library won't identify
            *
            * @method getFeatureName
            * @param {Graphic} graphic
            * @param {Object} layerConfig
            * @return {String} imageUrl Url to the features symbology image
            */
            getFeatureName: function (graphic, layerConfig) {
                return graphic.attributes[layerConfig.nameField];
            },

            /**
            * Given a feature object return the objectid for that item.
            * This will likely fail on a non-feature object (e.g. a plain graphic)
            *
            * NOTE: all dependent functions should be written as nested functions inside the caller function, otherwise TmplEx templating library won't identify
            *
            * @method getObjectId
            * @param {Graphic} graphic
            * @return {Integer} objectId
            */
            getObjectId: function (graphic) {
                return graphic.attributes[graphic.getLayer().objectIdField];
            },
            /*
            * Helper function, get attribute value by field name
            *
            * @method getAttributeValueByName
            * @param {Object} graphic ?
            * @param {String} fieldName ?
            */
            getAttributeValueByName: function (graphic, fieldName) {
                return graphic.attributes[fieldName];
            },

            /* Helper function used by filterManager.*/
            /*
            * generate visibility legend object
            * @param o
            */
            generateVisibilityLegend: function (o) {
                var attr = "",
                    visibilityLegendLabel = {
                        for: "filterGroup_" + o.data[o.idx].id,
                        attr: attr,
                        value: o.data[o.idx].id,
                        checked: "checked",
                        label: o.data[o.idx].layerConfig.displayName,
                        class: "eye checked",
                        layerId: o.data[o.idx].id
                    };
                return visibilityLegendLabel;
            },
            /*
            * generate visibility legend object
            * @param o
            */
            generateBoundingBoxLegend: function (o) {
                // adding flag for the generated o object
                // o.disabled will indicate the bounding checkbox is to be disabled.
                var checkboxDisabled = false;


                // determine if given layer is static
                if (o.data[o.idx].layerConfig.isStatic == true) {
                    checkboxDisabled = true;
                } else {
                    checkboxDisabled = false;
                }

                var attr = "",
                    boundingLegendLabel = {
                        for: "filterGroup_" + o.data[o.idx].id + "1",
                        attr: attr + "1",
                        value: o.data[o.idx].id,
                        checked: "checked",
                        label: o.data[o.idx].layerConfig.displayName,
                        class: "box checked",
                        disabled: checkboxDisabled,
                        layerId: o.data[o.idx].id
                    };

                return boundingLegendLabel;
            },

            /*
            * Generate settings toggle object.
            *
            * @method generateSettingsToggle
            * @param o
            */
            generateSettingsToggle: function (o) {
                var //attr = "",
                    boundingLegendLabel = {
                        str: o.str,
                        layerId: o.data[o.idx].id,
                        opacity: o.data[o.idx].layerConfig.settings.opacity
                    };

                return boundingLegendLabel;
            },

            /*
            * generate DataLayerUUID by removing layer_ from layer id
            * @param layerId
            */
            getDataLayerUUID: function (layerId) {
                return layerId.replace("layer_", "");
            }
        };
    });