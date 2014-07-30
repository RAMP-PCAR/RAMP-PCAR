/*global define, $ */

/**
* PopulationTool submodule.
*
* Computes the total population of a selected area. When the user draws a polygon, the population will
* be displayed in the bottom right corner.
*
* @module Tools
* @submodule PopulationTool
* @main PopulationTool
*/

/**
* PopulationTool class.
*
* @class PopulationTool
* @static
* @uses dojo/dom
* @uses dojo/string
* @uses esri/config
* @uses esri/graphic
* @uses esri/tasks/Geoprocessor
* @uses esri/tasks/FeatureSet
* @uses esri/toolbars/draw
* @uses esri/symbols/SimpleLineSymbol
* @uses esri/symbols/SimpleFillSymbol
* @uses Map
* @uses GlobalStorage
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
            init: function () {
                var map = RampMap.getMap(),
                    toolbar = new Draw(map);

                //TODO store this URL in config
                geoprocessor = new Geoprocessor("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Population_World/GPServer/PopulationSummary");

                geoprocessor.setOutputSpatialReference({
                    wkid: GlobalStorage.config.spatialReference
                });
                geoprocessor.on("execute-complete", outputTotalPopulation);

                toolbar.on("draw-end", computeZonalStats);

                populationApp = {
                    map: map,
                    toolbar: toolbar
                };

                //identify proxy page to use if the toJson payload to the geoprocessing service is greater than 2000 characters.
                //If this null or not available the geoprocessor.execute operation will not work.  Otherwise it will do a http post to the proxy.
                esriConfig.defaults.io.proxyUrl = "/proxy";
                esriConfig.defaults.io.alwaysUseProxy = false;
            }
        };

        function activate() {
            populationApp.toolbar.activate(Draw.FREEHAND_POLYGON);

            displayOutput("n/a");
        }

        function deactivate() {
            populationApp.toolbar.deactivate();
            clearMap();
        }

        function clearMap() {
            populationApp.map.graphics.clear();

            displayOutput("n/a");
        }

        function displayOutput(value) {
            that.displayTemplateOutput("population_output",
                {
                    totalPopulationLabel: "Population",
                    populationOutput: value
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

            name: "populationTool"
        });
    });