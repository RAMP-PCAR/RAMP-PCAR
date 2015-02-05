﻿/* global define, console, Terraformer, shp, csv2geojson, RAMP */

/**
* A module for loading from web services and local files.  Fetches and prepares data for consumption by the ESRI JS API.
* 
* @module RAMP
* @submodule DataLoader
*/

define([
        "dojo/Deferred", "dojo/query", "esri/request", "esri/SpatialReference", "esri/layers/FeatureLayer", "ramp/layerLoader", "utils/util", "dojo/_base/array"
    ],
    function (
            Deferred, query, EsriRequest, SpatialReference, FeatureLayer, LayerLoader, Util, dojoArray
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

        /**
        * Fetch relevant data from a single feature layer endpoint.  Returns a promise which
        * resolves with a partial list of properites extracted from the endpoint.
        *
        * @param {string} featureLayerEndpoint a URL pointing to an ESRI Feature Layer
        * @returns {Promise} a promise resolving with an object containing basic properties for the layer
        */
        function getFeatureLayer(featureLayerEndpoint) {
            var def = new Deferred(), promise;

            try {
                promise = (new EsriRequest({ url: featureLayerEndpoint + '?f=json'})).promise;
            } catch (e) {
                def.reject(e);
            }

            promise.then(
                function (data) {
                    var res = {
                        layerId: data.id,
                        layerName: data.name,
                        layerUrl: featureLayerEndpoint,
                        geometryType: data.geometryType,
                        fields: dojoArray.map(data.fields, function (x) { return x.name; })
                    };

                    def.resolve(res);
                },
                function (error) {
                    console.log(error);
                    def.reject(error);
                }
            );

            return def.promise;
        }

        /**
        * Fetch layer data from a WMS endpoint.  This method will execute a WMS GetCapabilities
        * request against the specified URL, it requests WMS 1.3 and it is capable of parsing
        * 1.3 or 1.1.1 responses.  It returns a promise which will resolve with basic layer
        * metadata and querying information.
        * 
        * metadata response format:
        *   { queryTypes: [mimeType], layers: [{name, desc, queryable(bool)}] }
        *
        * @param {string} wmsEndpoint a URL pointing to a WMS server (it must not include a query string)
        * @returns {Promise} a promise resolving with a metadata object (as specified above)
        */
        function getWmsLayerList(wmsEndpoint) {
            var def = new Deferred(), promise;

            try {
                promise = (new EsriRequest({ url: wmsEndpoint + '?service=WMS&version=1.3&request=GetCapabilities', handleAs: 'xml' })).promise;
            } catch (e) {
                def.reject(e);
            }

            // there might already be a way to do this in the parsing API
            // I don't know XML parsing well enough (and I don't want to)
            function getImmediateChild(node, childName) {
                var i;
                for (i = 0; i < node.childNodes.length; ++i) {
                    if (node.childNodes[i].nodeName === childName) {
                        return node.childNodes[i];
                    }
                }
                return undefined;
            }

            promise.then(
                function (data) {
                    var layers, res = {};

                    try {
                        layers = dojoArray.map(query('Layer > Name',data), function (nameNode) { return nameNode.parentNode; });
                        res.layers = dojoArray.map(layers, function (x) {
                            var name = getImmediateChild(x, 'Name').textContent,
                                titleNode = getImmediateChild(x, 'Title');
                            return {
                                name: name,
                                desc: titleNode ? titleNode.textContent : name,
                                queryable: x.getAttribute('queryable') === '1'
                            };
                        });
                        res.queryTypes = dojoArray.map(query('GetFeatureInfo > Format', data), function (node) { return node.textContent; });
                    } catch (e) {
                        def.reject(e);
                    }

                    def.resolve(res);
                },
                function (error) {
                    console.log(error);
                    def.reject(error);
                }
            );

            return def.promise;
        }

        /**
        * Performs in place assignment of integer ids for a GeoJSON FeatureCollection.
        */
        function assignIds(geoJson)
        {
            if (geoJson.type !== 'FeatureCollection') {
                throw new Error("Assignment can only be performed on FeatureCollections");
            }
            dojoArray.forEach(geoJson.features, function (val, idx) {
                if (typeof val.id === "undefined") {
                    val.id = idx;
                }
            });
        }

        /**
        * Converts a GeoJSON object into a FeatureLayer.  Expects GeoJSON to be formed as a FeatureCollection
        * containing a uniform feature type (FeatureLayer type will be set according to the type of the first
        * feature entry).  Accepts the following options:
        *   - renderer: a string identifying one of the properties in defaultRenders
        *   - sourceProjection: a string matching a proj4.defs projection to be used for the source data (overrides
        *     geoJson.crs)
        *   - targetWkid: an integer for an ESRI wkid, defaults to map wkid if not specified
        *   - fields: an array of fields to be appended to the FeatureLayer layerDefinition (OBJECTID is set by default)
        *
        * @param {Object} geoJson An object following the GeoJSON specification, should be a FeatureCollection with
        * Features of only one type
        * @param {Object} opts An object for supplying additional parameters
        * @returns {FeatureLayer} An ESRI FeatureLayer
        */
        function makeGeoJsonLayer(geoJson, opts) {
            var esriJson, layerDefinition, layer, fs, targetWkid, srcProj;
            layerDefinition = {
                objectIdField: "OBJECTID",
                fields: [{
                    name: "OBJECTID",
                    type: "esriFieldTypeOID"
                }]
            };

            targetWkid = RAMP.map.spatialReference.wkid;
            assignIds(geoJson);
            layerDefinition.drawingInfo = defaultRenderers[featureTypeToRenderer[geoJson.features[0].geometry.type]];

            if (opts) {
                if (opts.renderer && defaultRenderers.hasOwnProperty(opts.renderer)) {
                    layerDefinition.drawingInfo = { renderer: defaultRenderers[opts.renderer].renderer };
                    fs.geometryType = defaultRenderers[opts.renderer].geometryType;
                }
                if (opts.sourceProjection) {
                    srcProj = opts.sourceProjection;
                }
                if (opts.targetWkid) {
                    targetWkid = opts.targetWkid;
                }
                if (opts.fields) {
                    layerDefinition.fields = layerDefinition.fields.concat(opts.fields);
                }
            }

            console.log('reprojecting ' + srcProj + ' -> EPSG:' + targetWkid);
            console.log(geoJson);
            Terraformer.Proj.convert(geoJson, 'EPSG:' + targetWkid, srcProj);
            console.log(geoJson);
            esriJson = Terraformer.ArcGIS.convert(geoJson, { sr: targetWkid });
            console.log('geojson -> esrijson converted');
            console.log(esriJson);
            fs = { features: esriJson, geometryType: layerDefinition.drawingInfo.geometryType };

            layer = new FeatureLayer({ layerDefinition: layerDefinition, featureSet: fs }, { mode: FeatureLayer.MODE_SNAPSHOT });
            // ＼(｀O´)／ manually setting SR because it will come out as 4326
            layer.spatialReference = new SpatialReference({ wkid: targetWkid });
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
            getFeatureLayer: getFeatureLayer,
            getWmsLayerList: getWmsLayerList,
            makeGeoJsonLayer: makeGeoJsonLayer,
            buildCsv: buildCsv,
            buildShapefile: buildShapefile,
            buildGeoJson: buildGeoJson
        };
    });