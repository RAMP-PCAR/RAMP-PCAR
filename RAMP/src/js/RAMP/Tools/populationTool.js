/*global define, $ */

/**
* PopulationTool submodule.
*
* Computes the total population of a selected area. When the user draws a polygon, the population will
* be displayed in the bottom right corner.
*
* @module RAMP
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
* @uses ramp/map
*/

define([
// Dojo
        "dojo/dom", "dojo/string",
// Esri
        "esri/config", "esri/graphic", "esri/tasks/Geoprocessor", "esri/tasks/FeatureSet",
        "esri/toolbars/draw", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol",
// Ramp
        "ramp/map"
],
    function (
// Dojo
        dom, string,
// Esri
        esriConfig, Graphic, Geoprocessor, FeatureSet, Draw, SimpleLineSymbol, SimpleFillSymbol,
// Ramp
        RampMap) {
        "use strict";

        var ui, map, geoprocessor, toolbar;

        /**
        * Initiliaze the the tool.
        *
        * @method initTools
        * @private
        * @param evtObj {Object} an object representing the event.
        *
        */
        function initTools(evtObj) {
            geoprocessor = new Geoprocessor("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Population_World/GPServer/PopulationSummary");
            geoprocessor.setOutputSpatialReference({
                wkid: 3978
            });
            geoprocessor.on("execute-complete", outputTotalPopulation);

            populationApp.toolbar = toolbar = new Draw(evtObj.map);
            toolbar.on("draw-end", computeZonalStats);
        }

        /**
        * Compute an estimated amount of people in a specified polygon.
        *
        * @method computeZonalStats
        * @private
        * @param evtObj {Object} an object representing the event.
        *
        */
        function computeZonalStats(evtObj) {
            $("#map-load-indicator").removeClass("hidden");

            var geometry = evtObj.geometry;
            /*After user draws shape on map using the draw toolbar compute the zonal*/
            map.graphics.clear();

            var graphic = map.graphics.add(new Graphic(geometry, new SimpleFillSymbol()));

            map.graphics.add(graphic);
            toolbar.deactivate();

            var features = [];
            features.push(graphic);

            var featureSet = new FeatureSet();
            featureSet.features = features;

            var params = {
                "inputPoly": featureSet
            };
            geoprocessor.execute(params);
        }

        /**
        * Display the calculated population on the map.
        *
        * @method outputTotalPopulation
        * @private
        * @param evtObj {Object} an object representing the event.
        *
        */
        function outputTotalPopulation(evtObj) {
            $("#map-load-indicator").addClass("hidden");

            var results = evtObj.results;

            var totalPopulation = Math.floor(results[0].value.features[0].attributes.SUM);

            dom.byId("population-output").innerHTML =
                string.substitute("${number:dojo.number.format}", { number: totalPopulation });

            $('#buffer-info').hide();
            $('#measurement-info').hide();
            $('#population-info').show();
            $('#advanced-info-box').show();
        }

        ui = {
            init: function () {
                populationApp = {
                    "map": map,
                    "toolbar": toolbar
                };

                populationApp.map = map = RampMap.getMap();

                initTools(populationApp);

                //identify proxy page to use if the toJson payload to the geoprocessing service is greater than 2000 characters.
                //If this null or not available the geoprocessor.execute operation will not work.  Otherwise it will do a http post to the proxy.
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