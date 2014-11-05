/*global define, $, console, RAMP */

//the "use strict" forces the ECMA Script 5 interpretation of the code

/**
*
*
* @module RAMP
* @submodule GlobalStorage
*
*/

/**
* GlobalStorage class is used to store variables and exchange them between different modules. Each module has the ability to add variables to the global storage and retrieve them as needed.
*
* @class GlobalStorage
*/

define(["dojo/_base/array","utils/util"],
    function (dojoArray, util) {
        "use strict";

        var featureLayerDefaults = {
                layerAttributes: '*',
                settings: { panelEnabled: true, opacity: { enabled: true, default: 1 }, visible: true, boundingBoxVisible: false },
                datagrid: { rowsPerPage: 50 },
                templates: { detail: 'default_feature_details', hover: 'feature_hover_maptip_template', anchor: 'anchored_map_tip', summary: 'default_grid_summary_row' }
            },
            wmsLayerDefaults = {
                settings: { panelEnabled: true, opacity: { enabled: true, default: 1 }, visible: true, boundingBoxVisible: true }
            },
            configDefaults = {
                layers: { feature: [], wms: [] }
            };

        function applyDefaults(defaults, srcObj) {
            var defaultClone = $.extend(true, {}, defaults);
            return util.mergeRecursive(defaultClone, srcObj);
        }

        function applyConfigDefaults(configObj) {
            var result;
            console.log(configObj);
            result = applyDefaults(configDefaults, configObj);
            result.layers.wms = dojoArray.map(result.layers.wms, function (wms) {
                return applyDefaults(wmsLayerDefaults,wms);
            });
            result.layers.feature = dojoArray.map(result.layers.feature, function (fl) {
                return applyDefaults(featureLayerDefaults,fl);
            });
            console.log(result);
            return result;

        }

        return {
            init: function (configObj) {
                var config = applyConfigDefaults(configObj);
                RAMP.config = config;
            },
            layerType: {
                Basemap: "Basemap",
                WMS: "WMS",
                BoundingBox: "Bounding Box",
                Feature: "Feature Layer",
                Static: "Static",
                Highlight: "Highlight",
                Hoverlight: "Hoverlight",
                Zoomlight: "Zoomlight"
            }
        };
    });