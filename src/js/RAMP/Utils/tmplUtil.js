/* global define, console */

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

define(["ramp/globalStorage"],
    function (GlobalStorage) {
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
                var i, symbolConfig = layerConfig.symbology, img = "";

                switch (symbolConfig.type) {
                    case "simple":
                        return symbolConfig.imageUrl;

                    case "uniqueValue":
                        //make a key value for the graphic in question, using comma-space delimiter if multiple fields
                        var graphicKey = graphic.attributes[symbolConfig.field1];

                        //all key values are stored as strings.  if the attribute is in a numeric column, we must convert it to a string to ensure the === operator still works.
                        if (typeof graphicKey !== "string") {
                            graphicKey = graphicKey.toString();
                        }

                        if (symbolConfig.field2) {
                            graphicKey = graphicKey + ", " + graphic.attributes[symbolConfig.field2];
                            if (symbolConfig.field3) {
                                graphicKey = graphicKey + ", " + graphic.attributes[symbolConfig.field3];
                            }
                        }

                        //search the value maps for a matching entry.  if no match found, use the default image
                        for (i = 0; i < symbolConfig.valueMaps.length; i++) {
                            if (symbolConfig.valueMaps[i].value === graphicKey) {
                                img = symbolConfig.valueMaps[i].imageUrl;
                                break;
                            }
                        }

                        if (img === "") {
                            img = symbolConfig.defaultImageUrl;
                        }

                        return img;

                    case "classBreaks":

                        var gVal, lower, upper;
                        gVal = graphic.attributes[symbolConfig.field];

                        //find where the value exists in the range
                        lower = symbolConfig.minValue;

                        if (gVal < lower) {
                            img = symbolConfig.defaultImageUrl;
                        } else {
                            // a trick to prime the first loop iteration
                            // the first low value is inclusive.  every other low value is exclusive.
                            // if we have entered this else bracket, we know we are not below the first lower limit.
                            // so we reduce lower by 1 to make the first exclusive test inclusive
                            upper = lower - 1;

                            for (i = 0; i < symbolConfig.rangeMaps.length; i++) {
                                lower = upper;
                                upper = symbolConfig.rangeMaps[i].maxValue;
                                if ((gVal > lower) && (gVal <= upper)) {
                                    img = symbolConfig.rangeMaps[i].imageUrl;
                                    break;
                                }
                            }

                            if (img === "") {
                                //no match in defined ranges.
                                img = symbolConfig.defaultImageUrl;
                            }
                        }

                        return img;

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

            /*
            * Helper function, get attribute label by field name.
            * Will return an alias if it exists, else returns the field name
            *
            * @method getAttributeLabel
            * @param {String} fieldName Name of the field to get a label for
            * @param {Object} layerConfig config object for the layer the field belongs to
            */
            getAttributeLabel: function (fieldName, layerConfig) {
                var alias,
                    result = fieldName;
                if (layerConfig.aliasMap) {
                    alias = layerConfig.aliasMap[fieldName];
                    if (alias) {
                        result = alias;
                    }
                }
                return result;
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

            /**
            * Wraps plain text urls and emails with <a> tags.
            *
            * @method autoHyperlink
            * @param {String} content the text you would like to search in.
            */
            autoHyperlink: function (content) {
                //http://stackoverflow.com/questions/11863847/regex-to-match-urls-but-not-urls-in-hyperlinks
                //http://stackoverflow.com/questions/15039993/javascript-function-to-find-email-address-from-a-webpage

                // orig regex's.  did not handle pre-linked content
                // var urlRegex = /((f|ht)tp(s|):\/\/.+?[\w=%\?\&\./-]+)/g;
                // var emailRegex = /([\w-\.]+@([\w-]+\.)+[\w-]{2,4})/g;

                if (content) {
                    content = content.toString();

                    var urlRegex = /(["'>:]?)((ftp|http|https|file):\/\/[\S]+(\b|$))/gi;
                    content = content.replace(urlRegex, function ($0, $1) {
                        return $1 ? $0 : '<a href="' + $0 + '" target="_blank">' + $0 + '</a>';
                    });

                    var emailRegex = /(["'>:]?)([\w.-]+@[\w.-]+\.[\w.-]+)/gi;
                    content = content.replace(emailRegex, function ($0, $1) {
                        return $1 ? $0 : '<a href="mailto:' + $0 + '">' + $0 + '</a>';
                    });
                }
                return content;
            },

            /*
            * generate visibility legend object
            * @param o
            */
            generateBoundingBoxLegend: function (o) {
                // adding flag for the generated o object
                // o.disabled will indicate the bounding checkbox is to be disabled.
                var checkboxDisabled = false,
                    attr = "",
                    boundingLegendLabel;

                // determine if given layer is static or WMS
                checkboxDisabled = Boolean(o.data[o.idx].ramp.type === GlobalStorage.layerType.Static ||
                    o.data[o.idx].ramp.type === GlobalStorage.layerType.wms);

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
                        settings: o.data[o.idx].layerConfig.settings
                    };

                return boundingLegendLabel;
            },

            /**
             * Gets an array of symbology images to display in the layer selector
             * @method getSymbolForLayer
             * @param {Object} layerConfig A layer's config object
             * @returns {icon} The array of icon(s) to use in layer selector
             */
            getSymbolForLayer: function (layerConfig) {
                //will take a symbol list that has 1 or more entries.  will return first 3.  if fewer than 3, will duplicate values
                function pick3(symbolList) {
                    var num = symbolList.length, indexes;

                    if (num > 2) {
                        //pick first 3
                        indexes = [0, 1, 2];
                    } else if (num === 2) {
                        //duplicate the first
                        indexes = [0, 1, 0];
                    } else if (num === 1) {
                        //triple whammy
                        indexes = [0, 0, 0];
                    } else {
                        //something is ruined
                        return ["", "", ""];
                    }

                    //return images in an array
                    return [symbolList[indexes[0]].imageUrl, symbolList[indexes[1]].imageUrl, symbolList[indexes[2]].imageUrl];
                }

                if (layerConfig.symbology) {
                    //feature layer.  make an array for the appropriate renderer

                    var symbNode = layerConfig.symbology;
                    switch (symbNode.type) {
                        case "simple":
                            return [symbNode.imageUrl];
                        case "uniqueValue":
                            return pick3(symbNode.valueMaps);
                        case "classBreaks":
                            return pick3(symbNode.rangeMaps);
                        default:
                            //we have an unknown renderer type.  at this point, something else would have failed most likely.  write out a screech to the console just incase
                            console.log('unknown renderer encountered: ' + symbNode.type);
                            return [""];
                    }
                } else {
                    //no symbology defined, assume a WMS

                    if (layerConfig.imageUrl) {
                        return [layerConfig.imageUrl];
                    } else {
                        //catch-all in the case that things are really messed up
                        console.log('layer with no image info for layer selector');
                        return [""];
                    }
                }
            }
        };
    });