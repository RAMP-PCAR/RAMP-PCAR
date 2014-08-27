/*global define, $, i18n */

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
* @uses esri/tasks/LengthsParameters
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
      "esri/tasks/LengthsParameters", "esri/toolbars/draw", "esri/symbols/SimpleFillSymbol",
// Ramp
      "ramp/map", "ramp/globalStorage", "tools/baseTool"
],
    function (
// Dojo
      dom, string, dojoLang,
// Esri
      esriConfig, Graphic, GeometryService, LengthsParameters, Draw, SimpleFillSymbol,
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
            geometryService.on("lengths-complete", outputAreaAndLength);

            var geometry = evtObj.geometry;
            measureApp.map.graphics.clear();

            measureApp.map.graphics.add(new Graphic(geometry, new SimpleFillSymbol()));

            //setup the parameters for the areas and lengths operation
            var lengthsParams = new LengthsParameters();
            lengthsParams.lengthUnit = GeometryService.UNIT_KILOMETER;
            lengthsParams.calculationType = "geodesic";

            geometryService.simplify([geometry], function (simplifiedGeometries) {
                lengthsParams.polylines = simplifiedGeometries;
                geometryService.lengths(lengthsParams);
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
                // Convert feet to km.
                length = result.lengths[0].toFixed(3);// (result.lengths[0] / 3280.8).toFixed(3);

            that.working(false);

            length = string.substitute("${number:dojo.number.format}", { number: length });
            displayOutput(length, "km");
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
                esriConfig.defaults.io.proxyUrl = GlobalStorage.config.proxyUrl;
                esriConfig.defaults.io.alwaysUseProxy = false;
            }
        };

        /**
        * Activates the Tool. This method is passed to the `initToggle` method and is triggered by the BaseTool logic.
        *
        * @method activate
        * @private
        */
        function activate() {
            measureApp.toolbar.activate(Draw.LINE);

            displayOutput(i18n.t(that.ns + ":na")); // that.stringResources.txtDistanceToolNA);
        }

        /**
        * Deactivates the Tool. This method is passed to the `initToggle` method and is triggered by the BaseTool logic.
        *
        * @method deactivate
        * @private
        */
        function deactivate() {
            measureApp.toolbar.deactivate();
            clearMap();
        }

        /**
        * Clears the map. This method is passed to the `initToggle` method as the `defaultAction`
        * to be triggered by the BaseTool logic when the `float-default-button` is clicked.
        *
        * @method clearMap
        * @private
        */
        function clearMap() {
            measureApp.map.graphics.clear();

            displayOutput(i18n.t(that.ns + ":na")); // that.stringResources.txtDistanceToolNA);
        }

        /**
        * Displays the tool's output by calling BaseTool's `displayOutput` function.
        *
        * @method displayOutput
        * @private
        */
        function displayOutput(length, lengthUnits) {
            that.displayTemplateOutput("distance_output",
                {
                    lengthLabel: i18n.t(that.ns + ":length"), //that.stringResources.txtDistanceToolLength,
                    lengthOutput: length,
                    lengthUnits: lengthUnits                    
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
            init: function (selector, name) {
                that = this;
                this.name = name;

                this.initToggle($(selector), activate, deactivate,
                    {
                        defaultAction: clearMap
                    }
                );

                ui.init();

                return this;
            }
        });
    });