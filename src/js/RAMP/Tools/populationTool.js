/*global define, i18n */

/**
* @module Tools
*/

/**
* PopulationTool.
*
* Computes the total population of a selected area. When the user draws a polygon, the population will
* be displayed in the bottom right corner.
*
* ####Imports RAMP Modules:
* {{#crossLink "Map"}}{{/crossLink}}  
* {{#crossLink "GlobalStorage"}}{{/crossLink}}  
* {{#crossLink "BaseTool"}}{{/crossLink}}
* 
* @class PopulationTool
* @uses dojo/dom
* @uses dojo/string
* @uses dojo/_base/lang
* @uses esri/config
* @uses esri/graphic
* @uses esri/tasks/Geoprocessor
* @uses esri/tasks/FeatureSet
* @uses esri/toolbars/draw
* @uses esri/symbols/SimpleLineSymbol
* @uses esri/symbols/SimpleFillSymbol
* @extends BaseTool
*/

define([
// Dojo
        "dojo/dom", "dojo/string", "dojo/_base/lang",
// Esri
        "esri/config", "esri/graphic", "esri/tasks/Geoprocessor", "esri/tasks/FeatureSet",
        "esri/toolbars/draw", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol",
// Ramp
        "ramp/map", "ramp/globalStorage", "tools/baseTool"
],
    function (
// Dojo
        dom, string, dojoLang,
// Esri
        esriConfig, Graphic, Geoprocessor, FeatureSet, Draw, SimpleLineSymbol, SimpleFillSymbol,
// Ramp
        RampMap, GlobalStorage, BaseTool) {
        "use strict";

        var ui,
            geoprocessor,
            populationApp,

            that;

        /**
        * Compute an estimated amount of people in a specified polygon.
        *
        * @method computeZonalStats
        * @private
        * @param {Object} evtObj an object representing the event.
        *
        */
        function computeZonalStats(evtObj) {
            var geometry = evtObj.geometry,
                graphic,
                features,
                featureSet,
                params;

            that.working(true);

            /*After user draws shape on map using the draw toolbar compute the zonal*/
            populationApp.map.graphics.clear();
            graphic = populationApp.map.graphics.add(new Graphic(geometry, new SimpleFillSymbol()));
            populationApp.map.graphics.add(graphic);

            features = [];
            features.push(graphic);

            featureSet = new FeatureSet();
            featureSet.features = features;

            params = {
                inputPoly: featureSet
            };
            geoprocessor.execute(params);
        }

        /**
        * Display the calculated population on the map.
        *
        * @method outputTotalPopulation
        * @private
        * @param {Object} evtObj an object representing the event.
        *
        */
        function outputTotalPopulation(evtObj) {
            var results = evtObj.results,
                totalPopulation = Math.floor(results[0].value.features[0].attributes.SUM);

            that.working(false);

            totalPopulation = string.substitute("${number:dojo.number.format}", { number: totalPopulation });
            displayOutput(totalPopulation);
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

                //TODO store this URL in config
                geoprocessor = new Geoprocessor("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Population_World/GPServer/PopulationSummary");

                geoprocessor.setOutputSpatialReference(map.spatialReference);
                geoprocessor.on("execute-complete", outputTotalPopulation);

                toolbar.on("draw-end", computeZonalStats);

                populationApp = {
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
            populationApp.toolbar.activate(Draw.FREEHAND_POLYGON);

            displayOutput(i18n.t(that.ns + ":na"));
        }

        /**
        * Deactivates the Tool. This method is passed to the `initToggle` method and is triggered by the BaseTool logic.
        *
        * @method deactivate
        * @private
        */
        function deactivate() {
            populationApp.toolbar.deactivate();
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
            populationApp.map.graphics.clear();

            displayOutput(i18n.t(that.ns + ":na"));
        }

        /**
        * Displays the tool's output by calling BaseTool's `displayOutput` function.
        *
        * @method displayOutput
        * @private
        */
        function displayOutput(value) {
            that.displayTemplateOutput(
                {
                    totalPopulationLabel: i18n.t(that.ns + ":population"),
                    populationOutput: value
                }
            );
        }

        return dojoLang.mixin({}, BaseTool, {
            /**
            * Initialize the population tool
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

            name: "populationTool"
        });
    });