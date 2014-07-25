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
        "ramp/map", "ramp/globalStorage", "tools/baseTool",
// Utils
        "utils/popupManager"
],
    function (
// Dojo
        dom, string, dojoLang,
// Esri
        esriConfig, Graphic, Geoprocessor, FeatureSet, Draw, SimpleLineSymbol, SimpleFillSymbol,
// Ramp
        RampMap, GlobalStorage, BaseTool,
// Utils
        PopupManager) {
        "use strict";

        var ui,
            geoprocessor,
            populationApp,

            that;

        //dojoLang.mixin(this, BaseTool);

        /**
        * Compute an estimated amount of people in a specified polygon.
        *
        * @method computeZonalStats
        * @private
        * @param {Object} evtObj an object representing the event.
        *
        */
        function computeZonalStats(evtObj) {
            $("#map-load-indicator").removeClass("hidden");

            var geometry = evtObj.geometry;
            /*After user draws shape on map using the draw toolbar compute the zonal*/
            populationApp.map.graphics.clear();

            var graphic = populationApp.map.graphics.add(new Graphic(geometry, new SimpleFillSymbol()));

            populationApp.map.graphics.add(graphic);

            //TODO if we change to an "always on" we will want to make this a public function like the activate function below
            //populationApp.toolbar.deactivate();

            var features = [];
            features.push(graphic);

            var featureSet = new FeatureSet();
            featureSet.features = features;

            var params = {
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
            $("#map-load-indicator").addClass("hidden");

            var results = evtObj.results,
                totalPopulation = Math.floor(results[0].value.features[0].attributes.SUM);

            dom.byId("population-output").innerHTML =
                string.substitute("${number:dojo.number.format}", { number: totalPopulation });

            $('#buffer-info').hide();
            $('#measurement-info').hide();
            $('#population-info').show();
            $('#advanced-info-box').show();

            //that.deactivate();
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

        return dojoLang.mixin({}, BaseTool, {
            /**
            * Initialize the population tool
            *
            * @method init
            * @constructor
            *
            */
            init: function () {
                that = this;
                this.initToggle($("#at-population-toggle"));

                ui.init();
            },

            /**
            * Activate the tool
            * @property activate
            * @type {Object}
            *
            */
            activate: function () {
                populationApp.toolbar.activate(Draw.FREEHAND_POLYGON);
                this.active = true;
            },

            deactivate: function () {
                if (this.active) {
                    console.log("deactivate population tool")
                    populationApp.toolbar.deactivate();
                    this.active = false;

                    this.handle.close();
                }
            }
        });
    });