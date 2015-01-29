/* global define, console, Terraformer, shp, csv2geojson, RAMP */

/**
* A module for loading from web services and local files.  Fetches and prepares data for consumption by the ESRI JS API.
* 
* @module RAMP
* @submodule DataLoader
*/

define([
        "dojo/Deferred", "esri/request", "esri/SpatialReference", "esri/layers/FeatureLayer", "utils/util"
    ],
    function (
            Deferred, EsriRequest, SpatialReference, FeatureLayer, Util
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

        /**
        * Loads a dataset using async calls, returns a promise which resolves with the dataset requested.
        * Datasets may be loaded from URLs or via the File API and depending on the options will be loaded
        * into a string or an ArrayBuffer.
        * 
        * @param {Object} args Arguments object, should contain either {string} url or {File} file and optionally
        *                      {string} type as "text" or "binary" (text by default)
        * @returns {Promise} a Promise object resolving with either a {string} or {ArrayBuffer}
        */
        function loadDataSet(args) {
            var def = new Deferred(), promise;

            if (args.file) {
                if (args.url) {
                    throw new Error("Either url or file should be specified, not both");
                }

                if (args.type === "binary") {
                    promise = Util.readFileAsArrayBuffer(args.file);
                } else {
                    promise = Util.readFileAsText(args.file);
                }

            } else if (args.url) {
                try {
                    promise = (new EsriRequest({ url: args.url, handleAs: "text" })).promise;
                } catch (e) {
                    def.reject(e);
                }

            } else {
                throw new Error("One of url or file should be specified");
            }

            promise.then(function (data) { def.resolve(data); }, function (error) { def.reject(error); });
            return def.promise;
        }

        function makeGeoJsonLayer(geoJson, opts) {
            var esriJson, layerDefinition, layer, fs, mapWkid, srcProj;
            layerDefinition = {
                fields: []
            };

            mapWkid = RAMP.map.spatialReference.wkid;
            layerDefinition.drawingInfo = defaultRenderers[featureTypeToRenderer[geoJson.features[0].geometry.type]];

            if (opts) {
                if (opts.idField) {
                    layerDefinition.objectIdField = opts.idField;
                }
                if (opts.renderer && defaultRenderers.hasOwnProperty(opts.renderer)) {
                    layerDefinition.drawingInfo = { renderer: defaultRenderers[opts.renderer].renderer };
                    fs.geometryType = defaultRenderers[opts.renderer].geometryType;
                }
                if (opts.sourceProjection) {
                    srcProj = opts.sourceProjection;
                }
                if (opts.targetWkid) {
                    mapWkid = opts.targetWkid;
                }
            }

            console.log('reprojecting ' + srcProj + ' -> EPSG:' + mapWkid);
            console.log(geoJson);
            Terraformer.Proj.convert(geoJson, 'EPSG:' + mapWkid, srcProj);
            console.log(geoJson);
            esriJson = Terraformer.ArcGIS.convert(geoJson, { sr: mapWkid });
            console.log('geojson -> esrijson converted');
            console.log(esriJson);
            fs = { features: esriJson, geometryType: layerDefinition.drawingInfo.geometryType };

            layer = new FeatureLayer({ layerDefinition: layerDefinition, featureSet: fs }, { mode: FeatureLayer.MODE_SNAPSHOT });
            // ＼(｀O´)／ manually setting SR because it will come out as 4326
            layer.spatialReference = new SpatialReference({ wkid: mapWkid });
            layer.ramp = { type: "newtype?" };
            return layer;
        }

        /**
        * Constructs a FeatureLayer from CSV data.
        * @param {string} csvData the CSV data to be processed
        * @param {object} opts options to be set for the parser {string} latfield, {string} lonfield, {string} delimiter
        * @returns {Promise} a promise resolving with a {FeatureLayer}
        */
        function buildCsv(csvData, opts) {
            var def = new Deferred(), csvOpts = { latfield: 'Lat', lonfield: 'Long', delimiter: ',' };

            if (opts) {
                if (opts.latfield) {
                    csvOpts.latfield = opts.latfield;
                }
                if (opts.lonfield) {
                    csvOpts.lonfield = opts.lonfield;
                }
                if (opts.delimiter) {
                    csvOpts.delimiter = opts.delimiter;
                }
            }

            try {
                csv2geojson.csv2geojson(csvData, csvOpts, function (err, data) {
                    var jsonLayer;

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

            return def.promise;
        }

        /**
        * Constructs a FeatureLayer from a Shapefile.
        * @param {ArrayBuffer} shpData an ArrayBuffer of the Shapefile in zip format
        * @returns {Promise} a promise resolving with a {FeatureLayer}
        */
        function buildShapefile(shpData) {
            var def = new Deferred();

            try {
                shp(shpData).then(function (geojson) {
                    var jsonLayer;
                    try {
                        jsonLayer = makeGeoJsonLayer(geojson);
                        def.resolve(jsonLayer);
                    } catch (e) {
                        def.reject(e);
                    }
                }, function (error) {
                    def.reject(error);
                });
            } catch (e) {
                def.reject(e);
            }

            return def.promise;
        }

        /**
        * Constructs a FeatureLayer from a GeoJSON string.
        * This wraps makeGeoJsonLayer in an async wrapper, this is unnecessary but provides a consistent API.
        * @param {string} jsonData a string containing the GeoJSON
        * @returns {Promise} a promise resolving with a {FeatureLayer}
        */
        function buildGeoJson(jsonData) {
            var def = new Deferred(), jsonLayer = null;

            try {
                jsonLayer = makeGeoJsonLayer(JSON.parse(jsonData));
                def.resolve(jsonLayer);
            } catch (e) {
                def.reject(e);
            }

            return def.promise;
        }

        return {
            loadDataSet: loadDataSet,
            makeGeoJsonLayer: makeGeoJsonLayer,
            buildCsv: buildCsv,
            buildShapefile: buildShapefile,
            buildGeoJson: buildGeoJson
        };
    });