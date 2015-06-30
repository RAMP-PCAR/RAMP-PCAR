/* global define, console, RAMP */

/**
*
*
* @module RAMP
* @submodule AttributeLoader
*/

//TODO should this be under DataLoader submodule??

/**
* Attribute Loader class.
*
* Handles the extraction of attribute data from map services, and transforms it to standard format
*
* ####Imports RAMP Modules:
* {{#crossLink "EventManager"}}{{/crossLink}}
* {{#crossLink "GlobalStorage"}}{{/crossLink}}
*
* @class AttributeLoader
* @static
* @uses dojo/topic
* @uses dojo/Deferred
* @uses dojo/request/script
*/

define([
/* Dojo */
'dojo/topic', 'dojo/request/script', 'dojo/Deferred',

/* Esri */
'esri/request',

/* RAMP */
'ramp/eventManager', 'ramp/globalStorage', 'ramp/map'],

    function (
    /* Dojo */
    topic, script, Deferred,

    /* Esri */
    esriRequest,

    /* RAMP */
    EventManager, GlobalStorage, RampMap) {
        'use strict';

        /**
        * Will generate object id indexes and parent pointers on a layer data object.
        * Assumes data object already has features and object id field defined
        *
        * @method addLayerData
        * @private
        * @param  {Object} layerData layer data object
        * @param  {Array} featureData feature objects to enhance and add to layer data
        */
        function addLayerData(layerData, featureData) {
            var offset = layerData.features.length;

            //add new data to layer data's array
            layerData.features = layerData.features.concat(featureData);

            //make parent pointers and a fun index on object id
            featureData.forEach(function (elem, idx) {
                //map object id to index of object in feature array
                //use toString, as objectid is integer and will act funny using array notation.
                layerData.index[elem.attributes[layerData.idField].toString()] = idx + offset;

                //pointer back to parent
                elem.parent = layerData;
            });
        }

        /**
        * Will generate an empty layer data object
        *
        * @method newLayerData
        * @private
        * @return {Object} empty layer data object
        */
        function newLayerData() {
            return {
                layerId: '',
                idField: '',
                features: [],
                index: {}
                //maxRecord: 0,
                //loadRangeSet: []
            };
        }

        /**
        * Recursive function to load a full set of attributes, regardless of the maximum output size of the service
        * Passes result back on the provided Deferred object
        *
        * @method loadDataBatch
        * @private
        * @param  {Integer} maxId largest object id that has already been downloaded
        * @param  {Integer} maxBatch maximum number of results the service will return. if -1, means currently unknown
        * @param  {String} layerUrl URL to feature layer endpoint
        * @param  {String} idField name of attribute containing the object id for the layer
        * @param  {String} layerId id of the layer
        * @param  {dojo/Deferred} callerDef deferred object that resolves when current data has been downloaded
        */
        function loadDataBatch(maxId, maxBatch, layerUrl, idField, layerId, callerDef) {
            // fetch attributes from feature layer. where specifies records with id's higher than stuff already
            // downloaded. outFields * (all attributes). no geometry.
            var defData = esriRequest({
                url: layerUrl + '/query',
                content: {
                    where: idField + '>' + maxId,
                    outFields: RAMP.layerRegistry[layerId].ramp.config.layerAttributes,
                    returnGeometry: 'false',
                    f: 'json'
                },
                callbackParamName: 'callback',
                handleAs: 'json'
            });

            defData.then(function (dataResult) {
                if (dataResult.features) {
                    var len = dataResult.features.length;
                    if (len > 0) {
                        if (maxBatch === -1) {
                            //this is our first batch and our server is 10.0.  set the max batch size to this batch size
                            maxBatch = len;
                        }
                        if (len < maxBatch) {
                            //this batch is less than the max.  this is last batch.  no need to query again.
                            callerDef.resolve(dataResult.features);
                        } else {
                            //stash the result and call the service again for the next batch of data.
                            //max id becomes last object id in the current batch
                            var thisDef = new Deferred();
                            loadDataBatch(dataResult.features[len - 1].attributes[idField], maxBatch, layerUrl,
                                idField, layerId, thisDef);

                            thisDef.then(function (dataArray) {
                                callerDef.resolve(dataResult.features.concat(dataArray));
                            }, function (error) {
                                callerDef.reject(error);
                            });
                        }
                    } else {
                        //no more data.  we are done
                        callerDef.resolve([]);
                    }
                } else {
                    //it is possible to have an error, but it comes back on the "success" channel.
                    callerDef.reject(dataResult.error);
                }
            },
            function (error) {
                callerDef.reject(error);
            });
        }

        /**
        * Will download the attribute data for a layer.
        *
        * @method loadAttributeData
        * @private
        * @param  {String} layerId id of the layer
        * @param  {String} layerUrl the URL of the layer
        * @param  {String} layerType type of the layer. should be a value from GlobalStorage.layerType
        */
        function loadAttributeData(layerId, layerUrl, layerType) {
            switch (layerType) {
                case GlobalStorage.layerType.feature:

                    console.log('BEGIN ATTRIB LOAD: ' + layerId);

                    //extract info for this service
                    var defService = esriRequest({
                        url: layerUrl,
                        content: { f: 'json' },
                        callbackParamName: 'callback',
                        handleAs: 'json'
                    });

                    defService.then(function (serviceResult) {
                        if (serviceResult && (typeof serviceResult.error === 'undefined')) {
                            RampMap.updateDatagridUpdatingState(RAMP.layerRegistry[layerId], true);

                            //set up layer data object based on layer data
                            //10.0 server will not supply a max record value
                            var maxBatchSize = serviceResult.maxRecordCount || -1,
                                defFinished = new Deferred(),
                                layerData = newLayerData();
                            layerData.layerId = layerId;

                            //find object id field
                            serviceResult.fields.every(function (elem) {
                                if (elem.type === 'esriFieldTypeOID') {
                                    layerData.idField = elem.name;
                                    return false; //break the loop
                                }
                                return true; //keep looping
                            });

                            //begin the loading process
                            loadDataBatch(-1, maxBatchSize, layerUrl, layerData.idField, layerId, defFinished);

                            //after all data has been loaded
                            defFinished.promise.then(function (features) {
                                addLayerData(layerData, features);

                                //store attribData
                                // (Set layer data in global object only once all data has been downloaded
                                //  Used as both a flag and a data store)
                                RAMP.data[layerId] = layerData;
                                //new data. tell grid to reload
                                topic.publish(EventManager.Datagrid.LOAD_DATA_GRID);

                                RampMap.updateDatagridUpdatingState(RAMP.layerRegistry[layerId], false);
                                console.log('END ATTRIB LOAD: ' + layerId);
                            },
                            function (error) {
                                console.log('error getting attribute data for id ' + layerId);
                                //set layer to error state
                                RampMap.updateDatagridUpdatingState(RAMP.layerRegistry[layerId], false);
                                topic.publish(EventManager.LayerLoader.LAYER_ERROR, {
                                    layer: RAMP.layerRegistry[layerId],
                                    error: error
                                });
                            });
                        } else {
                            console.log('Service metadata load error');
                            if (serviceResult && serviceResult.error) {
                                console.log(serviceResult.error);
                            }
                        }
                    },
                     function (error) {
                         console.log('Service metadata load error : ' + error);
                     });

                    break;

                default:
                    console.log('Layer type not supported by attribute loader: ' + layerType);
            }

            //TODO do we need to return any sort of promise to indicate when the loading has finished?
        }

        /**
        * Will extract the attribute data from a file based layer.
        *
        * @method extractAttributeData
        * @private
        * @param  {Object} layer the layer object
        */
        function extractAttributeData(layer) {
            switch (layer.ramp.type) {
                case GlobalStorage.layerType.feature:

                    //change to standard format and store.
                    var layerData = newLayerData();
                    layerData.layerId = layer.id;
                    layerData.idField = layer.objectIdField;

                    addLayerData(layerData, layer.graphics.map(function (elem) {
                        return { attributes: elem.attributes };
                    }));

                    //we dont care about setting range values, as all the data is already loaded

                    //store attribData
                    RAMP.data[layer.id] = layerData;
                    //new data. tell grid to reload
                    topic.publish(EventManager.Datagrid.LOAD_DATA_GRID);
                    console.log('END ATTRIB LOAD: ' + layer.id);

                    break;

                default:
                    console.log('Layer type not supported by attribute extractor: ' + layer.ramp.type);
            }

            //TODO do we need to return any sort of promise to indicate when the loading has finished?
        }

        return {
            loadAttributeData: loadAttributeData,
            extractAttributeData: extractAttributeData
        };
    });