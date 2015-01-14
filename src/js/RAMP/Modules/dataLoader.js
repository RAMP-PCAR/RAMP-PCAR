/* global define, console, Terraformer */

/**
* A module for loading from web services and local files.  Fetches and prepares data for consumption by the ESRI JS API.
* 
* @module RAMP
* @submodule DataLoader
*/

define([
        "dojo/Deferred", "esri/request", "esri/layers/FeatureLayer", "utils/util"
    ],
    function (
            Deferred, EsriRequest, FeatureLayer, Util
        ) {
        "use strict";

        function makeGeoJsonLayer(geoJson) {
            var esriJson, layerDefinition, layer;
            layerDefinition = {
                fields: []
            };
            esriJson = Terraformer.ArcGIS.convert(geoJson);
            console.log(esriJson);
            layer = new FeatureLayer({ layerDefinition: layerDefinition, featureSet: { features: esriJson, geometryType: "esriGeometryPolygon" } }, { mode: FeatureLayer.MODE_SNAPSHOT });
            layer.ramp = { type: "newtype?" };
            return layer;
        }

        function buildGeoJson(args) {
            var def = new Deferred();

            if (args.file) {
                if (args.url) {
                    throw new Error("Either url or file should be specified, not both");
                }

                Util.readFileAsText(args.file).then(function (data) {
                    var jsonLayer = null;
                    try {
                        jsonLayer = makeGeoJsonLayer(JSON.parse(data));
                        def.resolve(jsonLayer);
                    } catch (e) {
                        def.reject(e);
                    }
                });

                return def.promise;

            } else if (args.url) {
                (new EsriRequest({ url: args.url })).then(function (result) {
                    var jsonLayer = null;
                    try {
                        jsonLayer = makeGeoJsonLayer(result);
                        def.resolve(jsonLayer);
                    } catch (e) {
                        def.reject(e);
                    }
                }, function (error) {
                    def.reject(error);
                });

                return def.promise;
            }
        }

        return {
            buildGeoJson: buildGeoJson
        };
    });