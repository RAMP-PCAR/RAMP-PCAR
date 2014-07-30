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
      "ramp/map", "ramp/globalStorage", "tools/baseTool"
],
    function (
// Dojo
      dom, string, dojoLang,
// Esri
      esriConfig, Graphic, GeometryService, AreasAndLengthsParameters, Draw, SimpleFillSymbol,
// Ramp
      RampMap, GlobalStorage, BaseTool) {
        "use strict";

        var ui,
            geometryService,
            measureApp,
            that;

        /**
        * Compute the area and length of a specified polygon.
        *
        * @method computeAreaAndLength
        * @private
        * @param {Object} evtObj an object representing the event.
        *
        */
        function computeAreaAndLength(evtObj) {
            that.working(true);

            geometryService = new GeometryService(GlobalStorage.config.geometryService);
            geometryService.on("areas-and-lengths-complete", outputAreaAndLength);

            var geometry = evtObj.geometry;
            measureApp.map.graphics.clear();

            measureApp.map.graphics.add(new Graphic(geometry, new SimpleFillSymbol()));

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
            var result = evtObj.result,
                // Convert acres to km2.
                area = result.areas[0].toFixed(3),// (result.areas[0] / 247.11).toFixed(3),
                // Convert feet to km.
                length = result.lengths[0].toFixed(3);// (result.lengths[0] / 3280.8).toFixed(3);

            that.working(false);

            length = string.substitute("${number:dojo.number.format}", { number: length });
            area = string.substitute("${number:dojo.number.format}", { number: area });
            displayOutput(length, area, "km", "km");
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

        function activate() {
            measureApp.toolbar.activate(Draw.FREEHAND_POLYGON);

            displayOutput("n/a", "n/a");
        }

        function deactivate() {
            measureApp.toolbar.deactivate();
            clearMap();
        }

        function clearMap() {
            measureApp.map.graphics.clear();

            displayOutput("n/a", "n/a");
        }

        function displayOutput(length, area, lengthUnits, areaUnits) {
            that.displayTemplateOutput("measure_output",
                {
                    lengthLabel: "Length",
                    areaLabel: "Area",
                    lengthOutput: length,
                    areaOutput: area,
                    lengthUnits: lengthUnits,
                    areaUnits: areaUnits
                }
            );
        }

        return dojoLang.mixin({}, BaseTool, {
            /**
            * Initialize the population tool
            *
            * @method init
            * @constructor
            *
            */
            init: function (selector) {
                that = this;
                this.initToggle($(selector), activate, deactivate,
                    {
                        defaultAction: clearMap
                    }
                );

                ui.init();

                return this;
            },

            name: "measureTool"
        });
    });