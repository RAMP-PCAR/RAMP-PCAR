/*global define, i18n, RAMP */

/**
* @module Tools
*/

/**
* Computes the area and perimeter length of a selected area. When the user draws a polygon, the area
* and length will be displayed in the bottom right corner.
*
* ####Imports RAMP Modules:
* {{#crossLink 'Map'}}{{/crossLink}}
* {{#crossLink 'GlobalStorage'}}{{/crossLink}}
* {{#crossLink 'BaseTool'}}{{/crossLink}}
*
* @extends BaseTool
* @class AreaTool
* @uses dojo/dom
* @uses dojo/_base/lang
* @uses esri/config
* @uses esri/graphic
* @uses esri/tasks/GeometryService
* @uses esri/tasks/AreasAndLengthsParameters
* @uses esri/toolbars/draw
* @uses esri/symbols/SimpleFillSymbol
*/

define([
// Dojo
      'dojo/dom', 'dojo/string', 'dojo/_base/lang',
// Esri
      'esri/config', 'esri/graphic', 'esri/tasks/GeometryService',
      'esri/tasks/AreasAndLengthsParameters', 'esri/toolbars/draw', 'esri/symbols/SimpleFillSymbol',
// Ramp
      'ramp/map', 'ramp/globalStorage', 'tools/baseTool'
],
    function (
// Dojo
      dom, string, dojoLang,
// Esri
      esriConfig, Graphic, GeometryService, AreasAndLengthsParameters, Draw, SimpleFillSymbol,
// Ramp
      RampMap, GlobalStorage, BaseTool) {
        'use strict';

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

            geometryService = new GeometryService(RAMP.config.geometryServiceUrl);
            geometryService.on('areas-and-lengths-complete', outputAreaAndLength);

            var geometry = evtObj.geometry;
            measureApp.map.graphics.clear();

            measureApp.map.graphics.add(new Graphic(geometry, new SimpleFillSymbol()));

            //setup the parameters for the areas and lengths operation
            var areasAndLengthParams = new AreasAndLengthsParameters();
            areasAndLengthParams.lengthUnit = GeometryService.UNIT_KILOMETER;
            areasAndLengthParams.areaUnit = GeometryService.UNIT_SQUARE_KILOMETERS;
            areasAndLengthParams.calculationType = 'geodesic';
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

            length = string.substitute('${number:dojo.number.format}', { number: length });
            area = string.substitute('${number:dojo.number.format}', { number: area });
            displayOutput(length, area, 'km', 'km');
        }

        ui = {
            init: function () {
                var map = RampMap.getMap(),
                    toolbar = new Draw(map);

                toolbar.on('draw-end', computeAreaAndLength);

                measureApp = {
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
            measureApp.toolbar.activate(Draw.FREEHAND_POLYGON);

            displayOutput(i18n.t(that.ns + ':na'), i18n.t(that.ns + ':na'));
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

            displayOutput(i18n.t(that.ns + ':na'), i18n.t(that.ns + ':na'));
        }

        /**
        * Displays the tool's output by calling BaseTool's `displayOutput` function.
        *
        * @method displayOutput
        * @private
        */
        function displayOutput(length, area, lengthUnits, areaUnits) {
            that.displayTemplateOutput(
                {
                    lengthLabel: i18n.t(that.ns + ':length'),
                    areaLabel: i18n.t(that.ns + ':area'),
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

            name: 'areaTool'
        });
    });
