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

        var defaultRenderers = {
            circlePoint: {
                geometryType: "esriGeometryPoint",
                renderer: {
                    type: "simple",
                    symbol: {
                        type: "esriSMS",
                        style: "esriSMSCircle",
                        color: [67, 100, 255, 200],
                        size: 7
                    }
                }
            },
            solidLine: {
                geometryType: "esriGeometryPolyline",
                renderer: {
                    type: "simple",
                    symbol: {
                        type: "esriSLS",
                        style: "esriSLSSolid",
                        color: [90, 90, 90, 200],
                        width: 2
                    }
                }
            },
            outlinedPoly: {
                geometryType: "esriGeometryPolygon",
                renderer: {
                    type: "simple",
                    symbol: {
                        type: "esriSFS",
                        style: "esriSFSSolid",
                        color: [76,76,125,200],
                        outline: {
                            type: "esriSLS",
                            style: "esriSLSSolid",
                            color: [110,110,110,255],
                            width: 1
                        }
                    }
                }
            }
        },
        featureTypeToRenderer = {
            Point: "circlePoint", MultiPoint: "circlePoint",
            LineString: "solidLine", MultiLineString: "solidLine",
            Polygon: "outlinedPoly", MultiPolygon: "outlinedPoly"
        };

        function makeGeoJsonLayer(geoJson, opts) {
            var esriJson, layerDefinition, layer, fs;
            layerDefinition = {
                fields: []
            };

            esriJson = Terraformer.ArcGIS.convert(geoJson);
            console.log('geojson -> esrijson converted');
            console.log(esriJson);
            console.log(geoJson);
            layerDefinition.drawingInfo = defaultRenderers[featureTypeToRenderer[geoJson.features[0].geometry.type]];
            fs = { features: esriJson, geometryType: layerDefinition.drawingInfo.geometryType };
            console.log(layerDefinition);

            if (opts) {
                if (opts.idField) {
                    layerDefinition.objectIdField = opts.idField;
                }
                if (opts.renderer && defaultRenderers.hasOwnProperty(opts.renderer)) {
                    layerDefinition.drawingInfo = { renderer: defaultRenderers[opts.renderer].renderer };
                    fs.geometryType = defaultRenderers[opts.renderer].geometryType;
                }
            }

            layer = new FeatureLayer({ layerDefinition: layerDefinition, featureSet: fs }, { mode: FeatureLayer.MODE_SNAPSHOT });
            layer.ramp = { type: "newtype?" };
            return layer;
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
            makeGeoJsonLayer: makeGeoJsonLayer,
            buildGeoJson: buildGeoJson
        };
    });