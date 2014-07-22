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
* @uses ramp/map
*/

define([
// Dojo
      "dojo/dom", "dojo/string", "dojo/_base/lang",
// Esri
      "esri/config", "esri/graphic", "esri/tasks/GeometryService",
      "esri/tasks/AreasAndLengthsParameters", "esri/toolbars/draw", "esri/symbols/SimpleFillSymbol",
// Ramp
      "ramp/map"
],
    function (
// Dojo
      dom, string, lang,
// Esri
      esriConfig, Graphic, GeometryService, AreasAndLengthsParameters, Draw, SimpleFillSymbol,
// Ramp
      RampMap) {
        "use strict";

        var ui, map, geometryService, toolbar;

        /**
        * Initiliaze the the tool.
        *
        * @method initTools
        * @private
        * @param evtObj {Object} an object representing the event.
        *
        */
        function initTools(evtObj) {
            measureApp.toolbar = toolbar = new Draw(map);
            toolbar.on("draw-end", lang.hitch(map, computeAreaAndLength));
        }

        /**
        * Compute the area and length of a specified polygon.
        *
        * @method computeAreaAndLength
        * @private
        * @param evtObj {Object} an object representing the event.
        *
        */
        function computeAreaAndLength(evtObj) {
            $("#map-load-indicator").removeClass("hidden");

            geometryService = new GeometryService("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer");
            geometryService.on("areas-and-lengths-complete", outputAreaAndLength);

            var map = this,
                geometry = evtObj.geometry;
            map.graphics.clear();

            map.graphics.add(new Graphic(geometry, new SimpleFillSymbol()));
            toolbar.deactivate();

            //setup the parameters for the areas and lengths operation
            var areasAndLengthParams = new AreasAndLengthsParameters();
            areasAndLengthParams.lengthUnit = GeometryService.UNIT_FOOT;
            areasAndLengthParams.areaUnit = GeometryService.UNIT_ACRES;
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
        * @param evtObj {Object} an object representing the event.
        *
        */
        function outputAreaAndLength(evtObj) {
            $("#map-load-indicator").addClass("hidden");

            var result = evtObj.result;

            // Convert acres to km2.
            var area = (result.areas[0] / 247.11).toFixed(3);
            // Convert feet to km.
            var length = (result.lengths[0] / 3280.8).toFixed(3);

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
                measureApp = {
                    "map": map,
                    "toolbar": toolbar
                };

                measureApp.map = map = RampMap.getMap();

                initTools(measureApp);

                //identify proxy page to use if the toJson payload to the geometry service is greater than 2000 characters.
                //If this null or not available the project and lengths operation will not work.  Otherwise it will do a http post to the proxy.
                esriConfig.defaults.io.proxyUrl = "/proxy";
                esriConfig.defaults.io.alwaysUseProxy = false;
            }
        };

        return {
            init: function () {
                ui.init();
            }
        };
    });