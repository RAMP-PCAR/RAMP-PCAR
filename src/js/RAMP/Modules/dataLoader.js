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

        function buildCsv(args) {
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
                        csv2geojson.csv2geojson(result, { latfield: 'Lat', lonfield: 'Log', delimiter: ',' }, function(err, data) {
                            if (err) {
                                def.reject(err);
                            }
                            jsonLayer = makeGeoJsonLayer(data);
                            def.resolve(jsonLayer);
                        });
                    } catch (e) {
                        def.reject(e);
                    }
                }, function (error) {
                    def.reject(error);
                });

                return def.promise;
            }

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
            makeGeoJsonLayer: makeGeoJsonLayer,
            buildCsv: buildCsv,
            buildGeoJson: buildGeoJson
        };
    });