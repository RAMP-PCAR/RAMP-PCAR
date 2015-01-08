/* global define, Terraformer, Shapefile */

/**
* A module for loading from web services and local files.  Fetches and prepares data for consumption by the ESRI JS API.
* 
* @module RAMP
* @submodule DataLoader
*/

define([
        "dojo/Deferred", "ersi/request", "esri/layers/FeatureLayer", "util/util"
    ],
    function (
            Deferred, EsriRequest, FeatureLayer, Util
        ) {
        "use strict";

        function makeGeoJsonLayer(geoJson) {
            var esriJson;
            esriJson = Terraformer.arcgis.convert(geoJson);
            return new FeatureLayer(esriJson, { mode: FeatureLayer.MODE_SNAPSHOT });

        }

        function buildShapefile(args) {
            var def = new Deferred(), shpArgs, shape;

            if (args.shpFile) {
                if (args.shpUrl) {
                    throw new Error("Either shpFile or shpUrl must be specified");
                }
                shpArgs = {shp:args.shpFile};
                if (args.dbfFile) {
                    shpArgs.dbf = args.dbfFile;
                }
            } else if (args.shpUrl) {
                shpArgs = {shp:args.shpUrl};
                if (args.dbfUrl) {
                    shpArgs.dbf = args.dbfUrl;
                }
            }
            if (!shpArgs) {
                throw new Error("Either shpFile or shpUrl must be specified");
            }
            shape = new Shapefile(shpArgs, function (data) {
                try {
                    def.resolve(makeGeoJsonLayer(data.geojson));
                } catch (e) {
                    def.reject(e);
                }
            });
            return def.promise;
        }

        function buildGeoJson(args) {
            var def = new Deferred();

            if (args.file) {
                if (args.url) {
                    throw new Error("Either url or file must be specified");
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

            throw new Error("Either url or file must be specified");
        }

        return {
            buildGeoJson: buildGeoJson,
            buildShapefile: buildShapefile
        };
    });