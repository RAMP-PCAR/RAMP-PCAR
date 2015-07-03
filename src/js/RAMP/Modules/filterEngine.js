/* global define, RAMP, RqlArray, console */

/**
*
*
* @module RAMP
* @submodule FilterEngine
*/

/**
* FilterEngine class.
*
* Handles the filtering of data on the map and in the grids
*
*
* ####Imports RAMP Modules:
* {{#crossLink "RAMP"}}{{/crossLink}}
* {{#crossLink "GraphicExtension"}}{{/crossLink}}
* {{#crossLink "Map"}}{{/crossLink}}
* {{#crossLink "Util"}}{{/crossLink}}
* {{#crossLink "Array"}}{{/crossLink}}
*
* ####Uses RAMP Templates:
* {{#crossLink "templates/datagrid_template.json"}}{{/crossLink}}
* {{#crossLink "templates/extended_datagrid_template.json"}}{{/crossLink}}
*
* @class FilterEngine
* @static
* @uses esri/tasks/query
*
*/

define([

/* Dojo */
    'dojo/request/script', 'dojo/Deferred',

/* Ramp */
    'ramp/graphicExtension',

/* ESRI */
    'esri/tasks/query',

/* Util */
    'utils/util', 'utils/dictionary', 'utils/array',
],

    function (

    /* Dojo */
        script, Deferred,

     // Ramp
        GraphicExtension,

    // Esri
        EsriQuery,

    /* Util */
        UtilMisc, UtilDict, UtilArray) {
        'use strict';

        /**
        * Will apply a spatial filter to a set of feature layers, returning features inside the given extent
        * organized by layerId.  E.g.
        * {
        *   <layerId1>: { type: "features", features: [feat1, feat2, ...]},
        *   <layerId2>: { type: "features", features: [featA, featB, ...]}
        * }
        *
        * @method applyExtentFilter
        * @private
        * @param {Array} featureLayers array of feature layers to apply extent filter to
        * @param {Esri/Extent} extent area to filter within
        * @return {Object} promise of search results
        */
        function applyExtentFilter(featureLayers, extent) {
            var visibleFeatures = {};
            var deferredList;
            var dReady = new Deferred();
            var q = new EsriQuery();

            //this will result in just objectid fields, as that is all we have in feature layers
            q.outFields = ['*'];
            q.geometry = extent;

            //apply spatial query to the layers, collect deferred results in the array.
            deferredList = featureLayers.map(function (fLayer) {
                return fLayer.queryFeatures(q).then(function (queryResult) {
                    if (queryResult.features.length > 0) {
                        //stuff data bundle into the visible features object
                        var layer = queryResult.features[0].getLayer();
                        visibleFeatures[layer.id] = {
                            type: 'features',
                            features: queryResult.features,
                        };
                    }
                });
            });

            //wait for all our queries to finish
            UtilMisc.afterAll(deferredList, function () {
                dReady.resolve(visibleFeatures);
            });

            //give caller a promise
            return dReady.promise;
        }

        //takes an object of feature sets and creates an object of feature data
        /**
        * Takes a mapping of feature sets and creates a mapping of feature data objects.
        * Feature set can include 'features' type bundles containing specific features
        * E.g. { <layerId>: {type: 'features', features: [feat1, feat2, ...]}}
        * Can also include 'raw' type bundle which indicates to take all data in the layer
        * E.g. { <layerId>: {type: 'raw', layerId: '<layerId>'}}
        *
        * @method featuresToData
        * @private
        * @param {Object} featureSet mapping of feature bundles by layer id
        * @return {Object} promise of search results
        */
        function featuresToData(featureSet) {
            var dataSet = {};

            //for each feature layer (key is layerId)
            UtilDict.forEachEntry(featureSet, function (key, layerBundle) {
                //ensure attribute data has been downloaded
                if (RAMP.data[key]) {
                    switch (layerBundle.type) {
                        case 'features':

                            //for each feature in a specific layer
                            dataSet[key] = layerBundle.features.map(function (feature) {
                                //fetch the feature data for this feature
                                return GraphicExtension.getFDataForGraphic(feature);
                            });

                            break;

                        case 'raw':

                            //just take all the feature data in the data store.  this will grab data that is not
                            //visible on the map (and possibly not in an onDemand layer)
                            //use slice to make a shallow copy of the array. we don't want to point to the same array,
                            //as we don't want to manipulate the RAMP.data set
                            dataSet[key] = RAMP.data[key].features.slice();

                            break;
                    }
                }
            });

            return dataSet;
        }

        //make an individual text search query
        /*
        search - string, what user typed in text search box
        all - boolean, true if searching all attributes, false if searching grid-visible attributes
        grid - string, indicating if extended or summary grid is active
        */

        //takes an object of feature sets and creates an object of feature data

        /**
        * Makes an RQL query string for a text search on a specific layer
        *
        * @method makeTextSearchQuery
        * @private
        * @param {Object} fData a sample feature data object for the layer being searched. any will do
        * @param {String} search the string to search for
        * @param {Boolean} all if true, search all attributes. if false, search only grid-visible attributes
        * @param {String} grid current mode of the data grid (summary or full)
        * @return {String} the RQL query string
        */
        function makeTextSearchQuery(fData, search, all, grid) {
            var query = '';
            var attribs = [];
            var layerConfig = RAMP.layerRegistry[fData.parent.layerId].ramp.config;

            //figure out the fields we want to search against
            if (all) {
                //all keys i.e. field names in attributes
                //TODO test to ensure there are no secret keys showing up
                attribs = Object.keys(fData.attributes);
            } else if (grid === 'summary') {
                //just the name field, as that is all we see in summary view
                attribs = [layerConfig.nameField];
            } else if (grid === 'full') {
                //only search fields that are part of the extended grid
                attribs = layerConfig.datagrid.gridColumns.map(function (col) {
                    return col.fieldName;
                });

                attribs = attribs.splice(0, 2); //remove icon and detail button fields
            }

            //apply searches to valid fields.  may need extra regex magic
            attribs.forEach(function (attribName) {
                //add a pattern match for this field
                query += 'match((attributes,' + attribName + '),' + search + '),';
            });

            //or together all the field matches
            return 'or(' + query.substring(0, query.length - 1) + ')';
        }

        /**
        * Makes a query set to perform a text search over all valid layers
        * Result example:
        * {
        *    <layerId1>: "<rql query for layerId1>",
        *    <layerId2>: "<rql query for layerId2>"
        * }
        *
        * @method makeTextSearch
        * @private
        * @param {Object} dataSet mapping of feature data objects that are still in consideration for the filter
        * @param {String} search the string to search for
        * @param {Boolean} all if true, search all attributes. if false, search only grid-visible attributes
        * @param {String} grid current mode of the data grid (summary or full)
        * @return {Object} the query set for the text search
        */
        function makeTextSearch(dataSet, search, all, grid) {
            var query = {};

            UtilDict.forEachEntry(dataSet, function (layerId, fDataArray) {
                if (fDataArray && fDataArray.length > 0) {
                    query[layerId] = makeTextSearchQuery(fDataArray[0], search, all, grid);
                }
            });

            return query;
        }

        /**
        * Changes visibility of individual features on map based on the filter.
        *
        * @method updateFeatureVisibility
        * @private
        * @param {Object} featureSet mapping of feature objects that satisfy the spatial filter
        * @param {Object} dataSet mapping of feature data objects that satisfy spatial + RQL filters
        */
        function updateFeatureVisibility(featureSet, dataSet) {
            var idx;
            var oidField;
            var sortedIds;
            var queryString;
            var rqlArray = new RqlArray();

            //for each feature layer (key is layerId)
            UtilDict.forEachEntry(featureSet, function (key, layerBundle) {
                switch (layerBundle.type) {
                    case 'features':

                        if (dataSet[key] && dataSet[key].length > 0) {
                            //get list of oids in sorted order (for use in binary search below)
                            oidField = dataSet[key][0].parent.idField;

                            //query: pull attribute sub-object up to top level of array. sort by oid, then extract oid.
                            //       for some reason you can't sort right if you extract oid first.
                            queryString = 'values(attributes),sort(+' + oidField + '),values(' + oidField + ')';
                            sortedIds = rqlArray.executeQuery(queryString, {}, dataSet[key]);
                        } else {
                            sortedIds = [];
                        }

                        //go through all potential features (features in current extent)
                        layerBundle.features.forEach(function (feature) {
                            //find if the feature has an item in the feature data list.
                            //if so, it means it passed the RQL filters and is visible;
                            //otherwise it is not visible
                            if (sortedIds.length > 0) {
                                idx = UtilArray.binaryIndexOf(sortedIds, function (fDataId) {
                                    var graphicID = GraphicExtension.getGraphicOid(feature);

                                    if (graphicID === fDataId) {
                                        return 0;
                                    } else if (graphicID > fDataId) {
                                        //searching too low in the list
                                        return -1;
                                    } else {
                                        //searching too high in the list
                                        return 1;
                                    }
                                });
                            } else {
                                idx = -1;
                            }

                            if (idx > -1) {
                                feature.show();
                            } else {
                                feature.hide();
                            }

                            // NOTE using .visible seems to fail hard, its like the value gets overwritten again
                            // by the api
                            // feature.visible = (idx > -1);
                        });

                        break;

                    case 'raw':
                        console.warn('Raw bundle passed to map feature visibility updater.  layer id ' + key);
                        break;
                }
            });
        }

        /**
        * Execute a filter on the given layers
        * Returns a mapping of feature data objects grouped by layer
        * e.g.  {<layerId1>: [fData1, fData2, ...], <layerId2>: [fDataA, fDataB, ...]}
        * Accepts the following options
        *   - extent: ESRI Extent object. defines a spatial filter. omission means include entire layer
        *   - gridMode: string. current mode of the data grid (summary or full)
        *   - textSearch: string. user entered term for the text search. omission means no text search
        *   - visibleAttribsOnly: boolean. if true, text search is only applied to fields visible in the grid
        *
        * @method getFilteredData
        * @private
        * @param {Array} layers feature layers to apply the filter to
        * @param {Object} options set of options for the filter
        * @return {Object} a promise of a feature data set
        */
        function getFilteredData(layers, options) {
            var dFilter = new Deferred();
            var pSpatial;
            var extentFilter = options.extent ? true : false; //TODO is there a prettier way to do this logic?

            if (extentFilter) {
                pSpatial = applyExtentFilter(layers, options.extent);
            } else {
                //set up a raw list
                var temp = {};
                var d = new Deferred();

                layers.forEach(function (layer) {
                    temp[layer.id] = {
                        type: 'raw',
                        layerId: layer.id,
                    };
                });

                //trickery to allow the next step to handle the result in the same way as the asynch spatial query case
                pSpatial = d.promise;
                d.resolve(temp);
            }

            //wait for feature set to be ready
            pSpatial.then(function (featureSet) {
                //convert map features to feature data objects
                var dataSet = featuresToData(featureSet);
                var queries = [];
                var rqlArray = new RqlArray();

                //TODO generate custom filter implementation here when we are ready to support it

                // text search if any
                if (options.textSearch && options.textSearch.length > 0) {
                    queries.push(makeTextSearch(dataSet, options.textSearch, options.visibleAttribsOnly ? false :
                        true, options.gridMode));
                }

                //execute queries, if any
                queries.forEach(function (querySet) {
                    UtilDict.forEachEntry(querySet, function (layerId, queryString) {
                        //apply the layer's query to the array of feature data for that layer.
                        //the array of feature data gets overwritten with the query results
                        dataSet[layerId] = rqlArray.executeQuery(queryString, {}, dataSet[layerId]);
                    });
                });

                // set visibility of individual feature sprites
                if (options.gridMode === 'summary') {
                    //we dont mess with the map when the big grid is open
                    updateFeatureVisibility(featureSet, dataSet);
                }

                //give the promise the dataSet  e.g. {"layerId1":[fData,fData], "layerId2":[fData,...]}
                dFilter.resolve(dataSet);
            });

            //returns a promise of a dataSet  e.g. {"layerId1":[fData,fData], "layerId2":[fData,...]}
            return dFilter.promise;
        }

        return {
            getFilteredData: getFilteredData,
        };
    });
