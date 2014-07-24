/*global define, $ */

/**
* MeasureTool submodule.
*
* Computes the area and perimeter length of a selected area. When the user draws a polygon, the area
* and length will be displayed in the bottom right corner.
*
* @module RAMP
* @submodule MeasureTool
* @main MeasureTool
*/

/**
* MeasureTool class.
*
* @class MeasureTool
* @static
* @uses dojo/dom
* @uses dojo/_base/lang
* @uses esri/config
* @uses esri/graphic
* @uses esri/tasks/GeometryService
* @uses esri/tasks/AreasAndLengthsParameters
* @uses esri/toolbars/draw
* @uses esri/symbols/SimpleFillSymbol
* @uses Map
* @uses GlobalStorage
*/

define([
// Dojo
      "dojo/dom", "dojo/string", "dojo/_base/lang",
// Esri
      "esri/config", "esri/graphic", "esri/tasks/GeometryService",
      "esri/tasks/AreasAndLengthsParameters", "esri/toolbars/draw", "esri/symbols/SimpleFillSymbol",
// Ramp
      "ramp/map", "ramp/globalStorage"
],
    function (
// Dojo
      dom, string, lang,
// Esri
      esriConfig, Graphic, GeometryService, AreasAndLengthsParameters, Draw, SimpleFillSymbol,
// Ramp
      RampMap, GlobalStorage) {
        "use strict";

        var ui, geometryService, measureApp;

        /**
        * Compute the area and length of a specified polygon.
        *
        * @method computeAreaAndLength
        * @private
        * @param {Object} evtObj an object representing the event.
        *
        */
        function computeAreaAndLength(evtObj) {
            $("#map-load-indicator").removeClass("hidden");

            geometryService = new GeometryService(GlobalStorage.config.geometryService);
            geometryService.on("areas-and-lengths-complete", outputAreaAndLength);

            var geometry = evtObj.geometry;
            measureApp.map.graphics.clear();

            measureApp.map.graphics.add(new Graphic(geometry, new SimpleFillSymbol()));

            //TODO if we change to an "always on" we will want to make this a public function like the activate function below
            measureApp.toolbar.deactivate();

            //setup the parameters for the areas and lengths operation
            var areasAndLengthParams = new AreasAndLengthsParameters();
            areasAndLengthParams.lengthUnit = GeometryService.UNIT_KILOMETER;
            areasAndLengthParams.areaUnit = GeometryService.UNIT_SQUARE_KILOMETERS;
            areasAndLengthParams.calculationType = "geodesic";
            geometryService.simplify([geometry], function (simplifiedGeometries) {
                areasAndLengthParams.polygons = simplifiedGeometries;
                geometryService.areasAndLengths(areasAndLengthParams);
            });
        }

        /**
        * Display the calculated area and length on the map.
        *
        * @method outputAreaAndLength
        * @private
        * @param {Object} evtObj an object representing the event.
        *
        */
        function outputAreaAndLength(evtObj) {
            $("#map-load-indicator").addClass("hidden");

            var result = evtObj.result,

                // Convert acres to km2.
                area = (result.areas[0] / 247.11).toFixed(3),
                // Convert feet to km.
                length = (result.lengths[0] / 3280.8).toFixed(3);

            dom.byId("area-output").innerHTML =
                string.substitute("${number:dojo.number.format} km<sup>2</sup>", { number: area });
            dom.byId("length-output").innerHTML =
                string.substitute("${number:dojo.number.format} km", { number: length });

            $('#buffer-info').hide();
            $('#population-info').hide();
            $('#measurement-info').show();
            $('#advanced-info-box').show();
        }

        ui = {
            init: function () {
                var map = RampMap.getMap(),
                    toolbar = new Draw(map);

                toolbar.on("draw-end", computeAreaAndLength);

                measureApp = {
                    map: map,
                    toolbar: toolbar
                };

                //identify proxy page to use if the toJson payload to the geometry service is greater than 2000 characters.
                //If this null or not available the project and lengths operation will not work.  Otherwise it will do a http post to the proxy.
                esriConfig.defaults.io.proxyUrl = "proxy";
                esriConfig.defaults.io.alwaysUseProxy = false;
            }
        };

        return {
            /**
            * Initialize the measure tool
            *
            * @method init
            * @constructor
            *
            */
            init: function () {
                ui.init();
            },

            /**
            * Activate the tool
            * @property activate
            * @type {Object}
            *
            */
            activate: function () {
                measureApp.toolbar.activate(Draw.FREEHAND_POLYGON);
            }
        };
    });