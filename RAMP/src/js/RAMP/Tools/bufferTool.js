/*global define, $, document */

/**
* BufferTool submodule.
*
* Adds a buffer around the a selected area. The user will be able to specify the distance
* in the bottom right corner, then draw a polygon on the map.
*
* @module RAMP
* @submodule BufferTool
* @main BufferTool
*/

/**
* BufferTool class.
*
* @class BufferTool
* @static
* @uses dojo/dom
* @uses dojo/_base/array
* @uses dojo/_base/Color
* @uses dojo/parser
* @uses esri/config
* @uses esri/graphic
* @uses esri/SpatialReference
* @uses esri/symbols/SimpleLineSymbol
* @uses esri/symbols/SimpleFillSymbol
* @uses esri/tasks/GeometryService
* @uses esri/tasks/BufferParameters
* @uses esri/toolbars/draw
* @uses ramp/map
*/

define([
// Dojo
    "dojo/dom",
    "dojo/_base/array",
    "dojo/_base/Color",
    "dojo/parser",
// Esri
    "esri/config",
    "esri/graphic",
    "esri/tasks/GeometryService",
    "esri/tasks/BufferParameters",
    "esri/toolbars/draw",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/SpatialReference",
// Ramp
    "ramp/map"
],

  function (
// Dojo
      dom, array, Color, parser,
// Esri
      esriConfig, Graphic, GeometryService, BufferParameters, Draw, SimpleLineSymbol, SimpleFillSymbol, SpatialReference,
// Ramp
      RampMap) {
      "use strict";
      var ui, map, geometryService, toolbar;

      parser.parse();

      /**
      * Initiliaze the the tool.
      *
      * @method initTools
      * @private
      * @param evtObj {Object} an object representing the event.
      *
      */
      function initTools(evtObj) {
          bufferApp.toolbar = toolbar = new Draw(evtObj.map);
          bufferApp.toolbar.on("draw-end", computeBuffer);
      }

      /**
      * Compute the buffer of a specified polygon.
      *
      * @method computeBuffer
      * @private
      * @param evtObj {Object} an object representing the event.
      *
      */
      function computeBuffer(evtObj) {
          $("#map-load-indicator").removeClass("hidden");

          var geometry = evtObj.geometry,
          map = bufferApp.map,
          geometryService = bufferApp.geometryService;

          var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NONE,
              new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
              new Color([255, 0, 0, 1]), new Color([0, 255, 0, 0.25])));

          var graphic = new Graphic(geometry, symbol);
          map.graphics.add(graphic);

          //setup the buffer parameters
          var params = new BufferParameters();

          // Get rid of all non-numerical/non-period characters.
          var distanceInput =
              dom.byId("distance-input").value =
              dom.byId("distance-input").value.replace(/[^0-9\.]+/g, '');

          params.distances = [distanceInput];
          params.bufferSpatialReference = new esri.SpatialReference({ wkid: "3978" });
          params.outSpatialReference = map.spatialReference;
          params.unit = 9036; // Kilometers

          // Simplify polygon.  this will make the user drawn polygon topologically correct.
          geometryService.simplify([geometry], function (geometries) {
              params.geometries = geometries;
              geometryService.buffer(params, outputBuffer);
          });
      }

      /**
      * Display the buffered polygon on the map.
      *
      * @method outputBuffer
      * @private
      * @param evtObj {Object} an object representing the event.
      *
      */
      function outputBuffer(bufferedGeometries) {
          $("#map-load-indicator").addClass("hidden");

          var symbol = new SimpleFillSymbol(
          SimpleFillSymbol.STYLE_SOLID,
          new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID,
              new Color([255, 0, 0, 0.65]), 2
          ),
          new Color([255, 0, 0, 0.35])
          );

          array.forEach(bufferedGeometries, function (geometry) {
              var graphic = new Graphic(geometry, symbol);
              bufferApp.map.graphics.add(graphic);
          });
          bufferApp.toolbar.deactivate();
          bufferApp.map.showZoomSlider();
      }

      ui = {
          init: function () {
              geometryService = new GeometryService
                  ("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

              bufferApp = {
                  map: map,
                  toolbar: toolbar,
                  geometryService: geometryService
              };

              bufferApp.map = map = RampMap.getMap();

              initTools(bufferApp);

              // identify proxy page to use if the toJson payload to the geometry service is greater than
              // 2000 characters. If this null or not available the project and lengths operation will not
              // work.  Otherwise it will do a http post to the proxy.
              esriConfig.defaults.io.proxyurl = "/proxy";
              esriConfig.defaults.io.alwaysuseproxy = false;
          }
      };

      return {
          init: function () {
              ui.init();
          }
      };
  });