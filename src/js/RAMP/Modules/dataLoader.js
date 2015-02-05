/* global define, console, Terraformer, shp, csv2geojson, RAMP */

/**
* A module for loading from web services and local files.  Fetches and prepares data for consumption by the ESRI JS API.
*
* @module RAMP
* @submodule DataLoader
*/

define([
        "dojo/Deferred", "esri/request", "esri/SpatialReference", "esri/layers/FeatureLayer", "utils/util", "dojo/_base/array", "ramp/globalStorage", "ramp/map"
],
    function (
            Deferred, EsriRequest, SpatialReference, FeatureLayer, Util, dojoArray, GlobalStorage, RampMap
        ) {
        "use strict";

        var featureTypeToRenderer = {
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
        * Performs in place assignment of integer ids for a GeoJSON FeatureCollection.
        */
        function assignIds(geoJson) {
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
        * Peek at the CSV output (useful for checking headers).
        *
        * @param {string} data a string containing the CSV (or any DSV) data
        * @param {string} delimiter the delimiter used by the data, unlike other functions this will not guess a delimiter and
        * this parameter is required
        * @returns {Array} an array of arrays containing the parsed CSV
        */
        function csvPeek(data, delimiter) {
            return csv2geojson.dsv(delimiter).parseRows(data);
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
            var esriJson, layerDefinition, layer, fs, targetWkid, srcProj,
                defaultRenderers = GlobalStorage.DefaultRenderers,
                d = new Date(),
                layerID = "user" + d.toISOString().substring(11, 19).replace(/:/g, "");

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
                    layerDefinition.drawingInfo = defaultRenderers[opts.renderer];
                    layerDefinition.drawingInfo.renderer.symbol.color = opts.colour;
                    // fs is not defined at this point
                    //fs.geometryType = defaultRenderers[opts.renderer].geometryType;
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

            layer = new FeatureLayer({ layerDefinition: layerDefinition, featureSet: fs }, { mode: FeatureLayer.MODE_SNAPSHOT, id: layerID });
            // ＼(｀O´)／ manually setting SR because it will come out as 4326
            layer.spatialReference = new SpatialReference({ wkid: targetWkid });

            //make a minimal config object for this layer
            var newConfig = {
                id: layerID,
                displayName: "TemporaryName",  //TODO can we use file name here?
                nameField: opts.primary, //"",   //TODO how to we get field from input screen?
                symbology: {
                    type: "simple",
                    imageUrl: opts.icon // "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAMAAAC6CgRnAAAAP1BMVEUAAAB0MjJ2RER4XFx7fHyERESLAACMjIySS0uWAACfW1uifHymp6e4mpq8vb3JmprP0NDSAADmAADxfHz+//91aGULAAAAFXRSTlP//////////////////////////wAr2X3qAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAARUlEQVQokWMQwQ0YRuXAgJ+RgYFZAKscF5ugkJAgBw8WOV5OITDg5sOUY4JICQmzYMqxQuWE2EnTh88+fO7E6z8MMBzkAGdaNvfnBzzpAAAAAElFTkSuQmCC"
                }
            };

            //backfill the rest of the config object with default values
            newConfig = GlobalStorage.applyFeatureDefaults(newConfig);

            //add custom properties and event handlers to layer object
            RampMap.enhanceLayer(layer, newConfig, true);
            layer.ramp.type = GlobalStorage.layerType.feature; //TODO revisit
            layer.ramp.load.state = "loaded"; //because we made the feature layer by hand, it already has it's layer definition, so it begins in loaded state.  the load event never fires
            
            //plop config in global config object so everyone can access it.
            RAMP.config.layers.feature.push(newConfig);

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
                    jsonLayer = makeGeoJsonLayer(data, opts);
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
            csvPeek: csvPeek,
            buildCsv: buildCsv,
            buildShapefile: buildShapefile,
            buildGeoJson: buildGeoJson
        };
    });