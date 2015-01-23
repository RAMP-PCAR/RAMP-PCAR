/* global define, console, Terraformer, shp, csv2geojson */

/**
* A module for loading from web services and local files.  Fetches and prepares data for consumption by the ESRI JS API.
* 
* @module RAMP
* @submodule DataLoader
*/

define([
        "dojo/Deferred", "esri/request", "esri/layers/FeatureLayer",

        "ramp/dataLoaderGui",

        "utils/util"
    ],
    function (
            Deferred, EsriRequest, FeatureLayer,

            DataLoadedGui,

            Util
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
                        csv2geojson.csv2geojson(data, { latfield: 'Lat', lonfield: 'Long', delimiter: ',' }, function (err, data) {
                            if (err) {
                                def.reject(err);
                                console.log("conversion error");
                                console.log(err);
                                return;
                            }
                            console.log('csv parsed');
                            console.log(data);
                            jsonLayer = makeGeoJsonLayer(data);
                            def.resolve(jsonLayer);
                        });
                    } catch (e) {
                        def.reject(e);
                    }
                });

                return def.promise;

            } else if (args.url) {
                (new EsriRequest({ url: args.url, handleAs: "text" })).then(function (result) {
                    var jsonLayer = null;
                    try {
                        console.log('raw csv text');
                        console.log(result);
                        csv2geojson.csv2geojson(result, { latfield: 'Lat', lonfield: 'Long', delimiter: ',' }, function (err, data) {
                            if (err) {
                                def.reject(err);
                                console.log("conversion error");
                                console.log(err);
                                return;
                            }
                            console.log('csv parsed');
                            console.log(data);
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

        function buildShapefile(args) {
            var def = new Deferred();

            if (args.file) {
                if (args.url) {
                    throw new Error("Either url or file must be specified");
                }

                Util.readFileAsArrayBuffer(args.file).then(function (data) {
                    var jsonLayer = null;
                    try {
                        shp(data).then(function (geojson) {
                            try {
                                jsonLayer = makeGeoJsonLayer(geojson);
                                def.resolve(jsonLayer);
                            } catch (e) {
                                def.reject(e);
                            }
                        }, function (failReason) {
                            def.reject(failReason);
                        });
                    } catch (e) {
                        def.reject(e);
                    }
                });

                return def.promise;

            } else if (args.url) {
                shp(args.url).then(function (geojson) {
                    var jsonLayer = null;
                    try {
                        jsonLayer = makeGeoJsonLayer(geojson);
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
            buildCsv: buildCsv,
            buildShapefile: buildShapefile,
            buildGeoJson: buildGeoJson
        };
    });