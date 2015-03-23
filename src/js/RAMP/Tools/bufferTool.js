/*global define, i18n, RAMP */

/**
* @module Tools
*/

/**
* BufferTool.
*
* Adds a buffer around the a selected area. The user will be able to specify the distance
* in the bottom right corner, then draw a polygon on the map.
*
* ####Imports RAMP Modules:
* {{#crossLink "Map"}}{{/crossLink}}  
* {{#crossLink "GlobalStorage"}}{{/crossLink}}  
* {{#crossLink "BaseTool"}}{{/crossLink}}
* 
* @class BufferTool
* @constructor
* @uses dojo/_base/array
* @uses dojo/_base/Color
* @uses esri/config
* @uses esri/graphic
* @uses esri/symbols/SimpleLineSymbol
* @uses esri/symbols/SimpleFillSymbol
* @uses esri/tasks/GeometryService
* @uses esri/tasks/BufferParameters
* @uses esri/toolbars/draw
* @extends BaseTool
*/

define([
// Dojo
    "dojo/dom",
    "dojo/_base/array",
    "dojo/_base/Color",
    "dojo/_base/lang",
// Esri
    "esri/config",
    "esri/graphic",
    "esri/tasks/GeometryService",
    "esri/tasks/BufferParameters",
    "esri/toolbars/draw",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
// Ramp
    "ramp/map", "ramp/globalStorage", "tools/baseTool"
],

  function (
// Dojo
      dom, array, Color, dojoLang,
// Esri
      esriConfig, Graphic, GeometryService, BufferParameters, Draw, SimpleLineSymbol, SimpleFillSymbol,
// Ramp
      RampMap, GlobalStorage, BaseTool) {
      "use strict";
      var ui,
          bufferApp,
          that;

      /**
      * Compute the buffer of a specified polygon.
      *
      * @method computeBuffer
      * @private
      * @param {Object} evtObj an object representing the `draw-end` event.
      *
      */
      function computeBuffer(evtObj) {
          var geometry = evtObj.geometry,
              map = bufferApp.map,
              geometryService = new GeometryService(RAMP.config.geometryServiceUrl),

              symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NONE,
                 new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
                 new Color([255, 0, 0, 1]), new Color([0, 255, 0, 0.25]))),

              graphic = new Graphic(geometry, symbol);

          that.working(true);

          map.graphics.add(graphic);

          //setup the buffer parameters
          var params = new BufferParameters(),

              // Get rid of all non-numerical/non-period characters.
              distanceInput = that.outputFloat.find(".distance-input").val().replace(/[^0-9\.]+/g, '');

          if (distanceInput === "") {
              that.working(false);
          } else {
              params.distances = [distanceInput];
              params.bufferSpatialReference = bufferApp.map.spatialReference;
              params.outSpatialReference = bufferApp.map.spatialReference;
              params.unit = 9036; // Kilometers

              // Simplify polygon.  this will make the user drawn polygon topologically correct.
              geometryService.simplify([geometry], function (geometries) {
                  params.geometries = geometries;
                  geometryService.buffer(params, outputBuffer);
              });
          }
      }

      /**
      * Display the buffered polygon on the map.
      *
      * @method outputBuffer
      * @private
      * @param {Object} bufferedGeometries result of the geoprocessor.
      *
      */
      function outputBuffer(bufferedGeometries) {
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
          //TODO if we change to an "always on" we will want to make this a public function like the activate function below

          bufferApp.map.showZoomSlider();

          that.working(false);
      }

      ui = {
          /**
            * Initiates additional UI components of the Tool.
            *
            * @method ui.init
            * @private
            */
          init: function () {
              var map = RampMap.getMap(),
                   toolbar = new Draw(map);

              toolbar.on("draw-end", computeBuffer);

              bufferApp = {
                  map: map,
                  toolbar: toolbar
              };
          }
      };

      /**
       * Activates the Tool. This method is passed to the `initToggle` method and is triggered by the BaseTool logic.
       *
       * @method activate
       * @private
       */
      function activate() {
          bufferApp.toolbar.activate(Draw.FREEHAND_POLYGON);

          displayOutput();
      }

      /**
       * Deactivates the Tool. This method is passed to the `initToggle` method and is triggered by the BaseTool logic.
       *
       * @method deactivate
       * @private
       */
      function deactivate() {
          bufferApp.toolbar.deactivate();
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
          bufferApp.map.graphics.clear();
      }

      /**
       * Displays the tool's output by calling BaseTool's `displayOutput` function.
       *
       * @method displayOutput
       * @private
       */
      function displayOutput() {
          that.displayTemplateOutput(
              {
                  distanceLabel: i18n.t(that.ns + ":distance")
              }
          );
      }

      return dojoLang.mixin({}, BaseTool, {
          /**
          * Initialize the buffer tool
          *
          * @method init
          * @chainable
          * @constructor
          *
          */
          init: function (selector, d) {
              that = this;
              this.initToggle(selector, d,
                  {
                      activate: activate,
                      deactivate: deactivate,
                      defaultAction: clearMap
                  }
              );

              ui.init();

              return this;
          },

          name: "bufferTool"
      });
  });