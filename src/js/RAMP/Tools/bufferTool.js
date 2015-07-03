/*global define, i18n, RAMP, $*/

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
* {{#crossLink 'Map'}}{{/crossLink}}
* {{#crossLink 'GlobalStorage'}}{{/crossLink}}
* {{#crossLink 'BaseTool'}}{{/crossLink}}
* {{#crossLink 'Util'}}{{/crossLink}}
*
* @class BufferTool
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
    'dojo/dom',
    'dojo/_base/array',
    'dojo/_base/Color',
    'dojo/_base/lang',

// Esri
    'esri/config',
    'esri/graphic',
    'esri/tasks/GeometryService',
    'esri/tasks/BufferParameters',
    'esri/toolbars/draw',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleFillSymbol',

// Ramp
    'ramp/map', 'ramp/globalStorage', 'tools/baseTool',
],

  function (

// Dojo
      dom, array, Color, dojoLang,

// Esri
      esriConfig, Graphic, GeometryService, BufferParameters, Draw, SimpleLineSymbol, SimpleFillSymbol,

// Ramp
      RampMap, GlobalStorage, BaseTool) {
      'use strict';
      var ui;
      var bufferApp;
      var _this;

      /**
      * Compute the buffer of a specified polygon.
      *
      * @method computeBuffer
      * @private
      * @param {Object} evtObj an object representing the `draw-end` event.
      *
      */
      function computeBuffer(evtObj) {
          var geometry = evtObj.geometry;
          var map = bufferApp.map;
          var geometryService = new GeometryService(RAMP.config.geometryServiceUrl);

          var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NONE,
                 new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
                 new Color([255, 0, 0, 1]), new Color([0, 255, 0, 0.25])));

          var graphic = new Graphic(geometry, symbol);

          _this.working(true);

          map.graphics.add(graphic);

          //setup the buffer parameters

          var params = new BufferParameters();

          // Get rid of all non-numerical/non-period characters.
          var  distanceInput = _this.outputFloat.find('.distance-input').val().replace(/[^0-9\.]+/g, '');
          var  firstIndex = distanceInput.indexOf('.');

          // Get rid of all extra decimal points
          distanceInput = distanceInput.substring(0, firstIndex + 1)
                            .concat(distanceInput.substring(firstIndex + 1)
                            .replace(/[.]+/g, ''));

          // Show what value is actually being used
          $('#buffer-input').val(distanceInput);

          if (distanceInput === '') {
              _this.working(false);
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

          //TODO if we change to an 'always on' we will want to make this a public function like the activate
          //function below

          bufferApp.map.showZoomSlider();

          _this.working(false);
      }

      ui = {
          /**
            * Initiates additional UI components of the Tool.
            *
            * @method ui.init
            * @private
            */
          init: function () {
              var map = RampMap.getMap();
              var toolbar = new Draw(map);

              toolbar.on('draw-end', computeBuffer);

              bufferApp = {
                  map: map,
                  toolbar: toolbar,
              };
          },
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
          _this.displayTemplateOutput(
              {
                  distanceLabel: i18n.t(_this.ns + ':distance'),
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
              _this = this;
              this.initToggle(selector, d,
                  {
                      activate: activate,
                      deactivate: deactivate,
                      defaultAction: clearMap,
                  }
              );
              ui.init();

              d.then(function () {
                  _this.outputFloat.on('keydown', '#buffer-input', function (event) {
                      return (event.keyCode === 17 || event.keyCode === 18 ||
                        (event.keyCode > 47 && event.keyCode < 58 && event.shiftKey === false) ||
                        (event.keyCode === 110) || (event.keyCode > 95 && event.keyCode < 106) ||
                        (event.keyCode === 8) || (event.keyCode === 9) ||
                        (event.keyCode === 190 && event.shiftKey === false) ||
                        (event.keyCode > 34 && event.keyCode < 40) || (event.keyCode === 46));
                  });
              });

              return this;
          },

          name: 'bufferTool',
      });
  });
