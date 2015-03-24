﻿/* global define, console, Terraformer, shp, csv2geojson, RAMP, ArrayBuffer, Uint16Array */

/**
* A module for loading from web services and local files.  Fetches data via File API (IE9 is currently not supported) or
* via XmlHttpRequest.  Handles GeoJSON, Shapefiles and CSV currently.  Includes utilities for parsing files into GeoJSON
* (currently the selected intermediate format) and converting GeoJSON into FeatureLayers for consumption by the ESRI JS
* API.
*
* @module RAMP
* @submodule DataLoader
* @uses dojo/Deferred 
* @uses dojo/query
* @uses dojo/_base/array
* @uses esri/request
* @uses esri/SpatialReference
* @uses esri/layers/FeatureLayer
* @uses esri/renderers/SimpleRenderer
* @uses ramp/layerLoader
* @uses ramp/globalStorage
* @uses ramp/map
* @uses utils/util
*/

define([
        "dojo/Deferred", "dojo/query", "dojo/_base/array",
        "esri/request", "esri/SpatialReference", "esri/layers/FeatureLayer", "esri/renderers/SimpleRenderer",
        "ramp/layerLoader", "ramp/globalStorage", "ramp/map",
        "utils/util"
],
    function (
            Deferred, query, dojoArray,
            EsriRequest, SpatialReference, FeatureLayer, SimpleRenderer,
            LayerLoader, GlobalStorage, RampMap,
            Util
        ) {
        "use strict";

        /**
        * Maps GeoJSON geometry types to a set of default renders defined in GlobalStorage.DefaultRenders
        * @property featureTypeToRenderer {Object}
        * @private
        */
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

                promise.then(function (data) { def.resolve(data); }, function (error) { def.reject(error); });
            } else if (args.url) {
                try {
                    promise = (new EsriRequest({ url: args.url, handleAs: "text" })).promise;
                } catch (e) {
                    def.reject(e);
                }

                promise.then(
                    function (data) {
                        // http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
                        function str2ab(str) {
                            var buf = new ArrayBuffer(str.length * 2), // 2 bytes for each char
                                bufView = new Uint16Array(buf),
                                i = 0, j = 0, strLen = str.length, code;

                            while (i < strLen) {
                                // jshint bitwise:false
                                code = str.charCodeAt(i++);
                                if (code & 0xff00) {
                                    bufView[j++] = (0xff00 & code) >> 8;
                                }
                                bufView[j++] = 0xff & code;
                                // jshint bitwise:true
                            }

                            return buf.slice(0,j);
                        }

                        if (args.type === 'binary') {
                            def.resolve(str2ab(data));
                            return;
                        }
                        def.resolve(data);
                    },
                    function (error) { def.reject(error); }
                );
            } else {
                throw new Error("One of url or file should be specified");
            }

            return def.promise;
        }

        /**
        * Fetch relevant data from a single feature layer endpoint.  Returns a promise which
        * resolves with a partial list of properties extracted from the endpoint.
        *
        * @param {string} featureLayerEndpoint a URL pointing to an ESRI Feature Layer
        * @returns {Promise} a promise resolving with an object containing basic properties for the layer
        */
        function getFeatureLayer(featureLayerEndpoint) {
            var def = new Deferred(), promise;

            try {
                promise = (new EsriRequest({ url: featureLayerEndpoint + '?f=json' })).promise;
            } catch (e) {
                def.reject(e);
            }

            promise.then(
                function (data) {
                    try {
                        var alias = {};
                        dojoArray.forEach(data.fields, function (field) {
                            alias[field.name] = field.alias;
                        });

                        var res = {
                            layerId: data.id,  //TODO verifiy this.  i think this is the index.  we would want to use autoID?
                            layerName: data.name,
                            layerUrl: featureLayerEndpoint,
                            geometryType: data.geometryType,
                            fields: dojoArray.map(data.fields, function (x) { return x.name; }),
                            renderer: data.drawingInfo.renderer,
                            aliasMap: alias,
                            maxScale: data.maxScale,
                            minScale: data.minScale
                        };

                        def.resolve(res);
                    } catch (e) {
                        def.reject(e);
                    }
                },
                function (error) {
                    console.log(error);
                    def.reject(error);
                }
            );

            return def.promise;
        }

        /**
        * Fetch relevant data from a legend related to a feature layer endpoint.  Returns a promise which
        * resolves with a partial list of properties extracted from the endpoint.
        *
        * @param {string} featureLayerEndpoint a URL pointing to an ESRI Feature Layer
        * @returns {Promise} a promise resolving with an object mapping legend labels to data URLs for those labels
        */
        function getFeatureLayerLegend(featureLayerEndpoint) {
            var def = new Deferred(), promise, legendUrl, idx, layerIdx;

            //snip off last slash if there
            idx = featureLayerEndpoint.indexOf('/', featureLayerEndpoint.length - 1);
            if (idx > -1) {
                legendUrl = featureLayerEndpoint.substring(0, idx - 1);
            } else {
                legendUrl = featureLayerEndpoint;
            }

            //snip off & store layer index, add legend to url
            idx = legendUrl.lastIndexOf('/');
            layerIdx = parseInt(legendUrl.substring(idx + 1));
            legendUrl = legendUrl.substring(0, idx) + '/legend?f=json';

            try {
                promise = (new EsriRequest({ url: legendUrl })).promise;
            } catch (e) {
                def.reject(e);
            }

            promise.then(
                function (data) {
                    //find our layer in the legend
                    var res = {};
                    dojoArray.forEach(data.layers, function (layer) {
                        if (layer.layerId === layerIdx) {
                            dojoArray.forEach(layer.legend, function (legendItem) {
                                res[legendItem.label] = "data:" + legendItem.contentType + ';base64,' + legendItem.imageData;
                            });
                        }
                    });

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
                        layers = dojoArray.map(query('Layer > Name', data), function (nameNode) { return nameNode.parentNode; });
                        res.layers = dojoArray.map(layers, function (x) {
                            var nameNode = getImmediateChild(x, 'Name'),
                                name = nameNode.textContent || nameNode.text,
                                // .text is for IE9's benefit, even though it claims to support .textContent
                                titleNode = getImmediateChild(x, 'Title');
                            return {
                                name: name,
                                desc: titleNode ? (titleNode.textContent || titleNode.text) : name,
                                queryable: x.getAttribute('queryable') === '1'
                            };
                        });
                        res.queryTypes = dojoArray.map(query('GetFeatureInfo > Format', data), function (node) { return node.textContent || node.text; });
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
         * Extracts fields from the first feature in the feature collection, does no
         * guesswork on property types and calls everything a string.
         */
        function extractFields(geoJson) {
            if (geoJson.features.length < 1) {
                throw new Error("Field extraction requires at least one feature");
            }

            return dojoArray.map(Object.keys(geoJson.features[0].properties), function (prop) {
                return { name: prop, type: "esriFieldTypeString" };
            });
        }

        /**
        * Will generate a generic datagrid config node for a set of layer attributes.
        *
        * @param {Array} fields an array of attribute fields for a layer
        * @param {Object} aliases optional param. a mapping of field names to field aliases
        * @returns {Object} an JSON config object for feature datagrid
        */
        function createDatagridConfig(fields, aliases) {
            function makeField(id, fn, wd, ttl, tp) {
                return {
                    id: id,
                    fieldName: fn,
                    width: wd,
                    orderable: false,
                    type: 'string',
                    alignment: 0,
                    title: ttl,
                    columnTemplate: tp
                };
            }

            var dg = {
                rowsPerPage: 50,
                gridColumns: []
            };

            dg.gridColumns.push(makeField('iconCol', '', '50px', 'Icon', 'graphic_icon'));
            dg.gridColumns.push(makeField('detailsCol', '', '60px', 'Details', 'details_button'));

            dojoArray.forEach(fields, function (field, idx) {
                var fieldTitle = field;
                if (aliases) {
                    if (aliases[field]) {
                        fieldTitle = aliases[field];
                    }
                }
                dg.gridColumns.push(makeField("col" + idx.toString(), field, '100px', fieldTitle, 'title_span'));
            });

            return dg;
        }

        /**
        * Will generate a symbology config node for a ESRI feature service.
        * Uses the information from the feature layers renderer JSON definition
        *
        * @param {Object} renderer renderer object from feature layer endpoint
        * @param {Object} legendLookup object that maps legend label to data url of legend image
        * @returns {Object} an JSON config object for feature symbology
        */
        function createSymbologyConfig(renderer, legendLookup) {
            var symb = {
                type: renderer.type
            };

            switch (symb.type) {
                case "simple":
                    symb.label = renderer.label;
                    symb.imageUrl = legendLookup[renderer.label];

                    break;

                case "uniqueValue":
                    if (renderer.defaultLabel) {
                        symb.defaultImageUrl = legendLookup[renderer.defaultLabel];
                    }
                    symb.field1 = renderer.field1;
                    symb.field2 = renderer.field2;
                    symb.field3 = renderer.field3;
                    symb.valueMaps = dojoArray.map(renderer.uniqueValueInfos, function (uvi) {
                        return {
                            label: uvi.label,
                            value: uvi.value,
                            imageUrl: legendLookup[uvi.label]
                        };
                    });

                    break;
                case "classBreaks":
                    if (renderer.defaultLabel) {
                        symb.defaultImageUrl = legendLookup[renderer.defaultLabel];
                    }
                    symb.field = renderer.field;
                    symb.minValue = renderer.minValue;
                    symb.rangeMaps = dojoArray.map(renderer.classBreakInfos, function (cbi) {
                        return {
                            label: cbi.label,
                            maxValue: cbi.classMaxValue,
                            imageUrl: legendLookup[cbi.label]
                        };
                    });

                    break;
                default:
                    //Renderer we dont support
                    console.log('encountered unsupported renderer type: ' + symb.type);
                    //TODO make a stupid basic renderer to prevent things from breaking?
            }

            return symb;
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
        * @method makeGeoJsonLayer
        * @param {Object} geoJson An object following the GeoJSON specification, should be a FeatureCollection with
        * Features of only one type
        * @param {Object} opts An object for supplying additional parameters
        * @returns {FeatureLayer} An ESRI FeatureLayer
        */
        function makeGeoJsonLayer(geoJson, opts) {
            var esriJson, layerDefinition, layer, fs, targetWkid, srcProj,
                defaultRenderers = GlobalStorage.DefaultRenderers,
                layerID = LayerLoader.nextId();

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

            if (layerDefinition.fields.length === 1) {
                layerDefinition.fields = layerDefinition.fields.concat(extractFields(geoJson));
            }

            console.log('reprojecting ' + srcProj + ' -> EPSG:' + targetWkid);
            //console.log(geoJson);
            Terraformer.Proj.convert(geoJson, 'EPSG:' + targetWkid, srcProj);
            //console.log(geoJson);
            esriJson = Terraformer.ArcGIS.convert(geoJson, { sr: targetWkid });
            console.log('geojson -> esrijson converted');
            //console.log(esriJson);
            fs = { features: esriJson, geometryType: layerDefinition.drawingInfo.geometryType };

            layer = new FeatureLayer({ layerDefinition: layerDefinition, featureSet: fs }, { mode: FeatureLayer.MODE_SNAPSHOT, id: layerID });
            // ＼(｀O´)／ manually setting SR because it will come out as 4326
            layer.spatialReference = new SpatialReference({ wkid: targetWkid });

            // TODO : refactor the hack
            // SZ_HACK
            layer.renderer._RAMP_rendererType = featureTypeToRenderer[geoJson.features[0].geometry.type];

            //SZ TESTING -- this will be removed when the UI separates the layer creation an layer enhancement
            //enhanceFileFeatureLayer(layer, opts);

            return layer;
        }

        /**
        * Will take a feature layer built from user supplied data, and apply extra user options (such as symbology,
        * display field), and generate a config node for the layer.  Accepts the following options:
        *   - renderer: a string identifying one of the properties in defaultRenders
        *   - color: color of the renderer
        *   - icon: icon to display in grid and maptips
        *   - nameField: descriptive name field for the layer
        *   - datasetName: description of the name field
        *
        * @method enhanceFileFeatureLayer
        * @param {Object} featureLayer a feature layer object generated by makeGeoJsonLayer
        * @param {Object} opts An object for supplying additional parameters
        */
        function enhanceFileFeatureLayer(featureLayer, opts) {
            //make a minimal config object for this layer
            var newConfig = {
                    id: featureLayer.id,
                    displayName: opts.datasetName,
                    nameField: opts.nameField,
                    symbology: {
                        type: "simple",
                        imageUrl: opts.icon
                    },
                    datagrid: createDatagridConfig(opts.fields)
                },
                defaultRenderers = GlobalStorage.DefaultRenderers;

            //backfill the rest of the config object with default values
            newConfig = GlobalStorage.applyFeatureDefaults(newConfig);

            //add custom properties and event handlers to layer object
            RampMap.enhanceLayer(featureLayer, newConfig, true);
            featureLayer.ramp.type = GlobalStorage.layerType.feature; //TODO revisit
            featureLayer.ramp.load.state = "loaded"; //because we made the feature layer by hand, it already has it's layer definition, so it begins in loaded state.  the load event never fires
            featureLayer.type = "Feature Layer"; //required to visible layer function

            //plop config in global config object so everyone can access it.
            RAMP.config.layers.feature.push(newConfig);

            //apply new renderer if one is defined
            if (opts.renderer && defaultRenderers.hasOwnProperty(opts.renderer)) {
                var rend = defaultRenderers[opts.renderer].renderer;
                if (opts.colour) {
                    rend.symbol.color = opts.colour;
                }

                featureLayer.renderer = new SimpleRenderer(rend);
            } else if (opts.colour) { // change only color of the renderer
                // SZ_HACK
                featureLayer.renderer.symbol.color = opts.colour;
            }
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
                    // csv2geojson will not include the lat and long in the feature
                    dojoArray.forEach(data.features, function (feature) {
                        // add new property Long and Lat before layer is generated
                        feature.properties[csvOpts.lonfield] = feature.geometry.coordinates[0];
                        feature.properties[csvOpts.latfield] = feature.geometry.coordinates[1];
                    });
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
                // window.crypto.subtle.digest({ name: "SHA-256" }, shpData).then(function (h) { var u8 = new Uint16Array(h); console.log(u8); });
                shp.getShapefile(shpData).then(function (geojson) {
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
            getFeatureLayerLegend: getFeatureLayerLegend,
            getWmsLayerList: getWmsLayerList,
            makeGeoJsonLayer: makeGeoJsonLayer,
            csvPeek: csvPeek,
            buildCsv: buildCsv,
            buildShapefile: buildShapefile,
            buildGeoJson: buildGeoJson,
            enhanceFileFeatureLayer: enhanceFileFeatureLayer,
            createDatagridConfig: createDatagridConfig,
            createSymbologyConfig: createSymbologyConfig
        };
    });
