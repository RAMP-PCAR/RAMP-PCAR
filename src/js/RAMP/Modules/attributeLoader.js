/* global define, console, RAMP, escape */

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
"dojo/topic", "dojo/request/script", "dojo/Deferred",

/* RAMP */
"ramp/eventManager", "ramp/globalStorage",

/* Util */
"utils/range"],

    function (
    /* Dojo */
    topic, script, Deferred,

    /* RAMP */
    EventManager, GlobalStorage,

    /* Util */
    Range) {
        "use strict";

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
            //layerData.features.splice(layerData.features.length, 0, featureData);

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
                index: {},
                maxRecord: 0,
                loadRangeSet: []
            };
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

                    //extract the max record count for this service
                    var defService = script.get(layerUrl, {
                        query: "f=json",
                        jsonp: "callback"
                    });

                    defService.then(function (serviceResult) {
                        //fetch attributes from feature layer. where 1=1 (all records). outFields * (all attributes). no geometry.
                        var defData = script.get(layerUrl + '/query', {
                            query: "where=1%3D1&outFields=*&returnGeometry=false&f=json",
                            jsonp: "callback"
                        });

                        defData.then(
                        function (dataResult) {
                            //change to standard format and store.
                            var layerData = newLayerData();
                            layerData.layerId = layerId;
                            //10.0 server will not supply a max record value. so we assume the size of the first request is the maximum.
                            layerData.maxRecord = serviceResult.maxRecordCount || dataResult.features.length;

                            //find object id field
                            dataResult.fields.every(function (elem) {
                                if (elem.type === 'esriFieldTypeOID') {
                                    layerData.idField = elem.name;
                                    return false; //break the loop
                                }
                                return true; //keep looping
                            });

                            addLayerData(layerData, dataResult.features);

                            //figure out range of initial loaded data
                            //ASSUMPTION: data is returned sorted by object id
                            if (dataResult.features.length > 0) {
                                Range.addRange(layerData.loadRangeSet, Range.newRange(dataResult.features[0].attributes[layerData.idField], dataResult.features[dataResult.features.length - 1].attributes[layerData.idField]));
                            }

                            //store attribData
                            RAMP.data[layerId] = layerData;
                            //new data. tell grid to reload
                            topic.publish(EventManager.Datagrid.APPLY_EXTENT_FILTER);
                            console.log('END ATTRIB LOAD: ' + layerId);
                        },
                            function (error) {
                                console.log("Attribute load error : " + error);
                            });
                    },
                     function (error) {
                         console.log("Max Record count load error : " + error);
                     });

                    break;

                default:
                    console.log("Layer type not supported by attribute loader: " + layerType);
            }

            //TODO do we need to return any sort of promise to indicate when the loading has finished?
        }

        /**
        * Will update attribute data for a layer.
        * This happens when a layer has more data than the maximum request, so we need to grab more.
        *
        * @method updateAttributeData
        * @private
        * @param  {String} layerId id of the layer
        * @param  {String} layerUrl the URL of the layer
        * @param  {String} layerType type of the layer. should be a value from GlobalStorage.layerType
        * @param  {Integer} missingOID the object id not currently in layer data
        */
        function updateAttributeData(layerId, layerUrl, layerType, missingOID) {
            switch (layerType) {
                case GlobalStorage.layerType.feature:

                    //console.log('BEGIN ATTRIB LOAD: ' + layerId);

                    //get new range of data to load
                    var layerData = RAMP.data[layerId],
                        newRange = Range.findOptimalEmptyRange(layerData.loadRangeSet, missingOID, layerData.maxRecord),
                        where = escape(layerData.idField + '>=' + newRange.min.toString() + ' AND ' + layerData.idField + '<=' + newRange.max.toString());

                    //temporarily remove the layer data from the public registry.
                    //if another layer triggers a grid refresh while this update request is pending, having the registry item removed will prevent
                    //the grid from processing this layer and re-triggering the update request.
                    RAMP.data[layerId] = undefined;

                    //fetch attributes from feature layer within the new range.
                    var defData = script.get(layerUrl + '/query', {
                        query: "where=" + where + "&outFields=*&returnGeometry=false&f=json",
                        jsonp: "callback"
                    });

                    defData.then(
                    function (dataResult) {
                        //integrate new block of data into our main set

                        addLayerData(layerData, dataResult.features);

                        //add the new range to our range set

                        Range.addRange(layerData.loadRangeSet, newRange);

                        //re-insert the data into the global store
                        RAMP.data[layerId] = layerData;
                        //new data. tell grid to reload
                        topic.publish(EventManager.Datagrid.APPLY_EXTENT_FILTER);
                        //console.log('END ATTRIB LOAD: ' + layerId);
                    },
                        function (error) {
                            console.log("Attribute load error : " + error);
                        });

                    break;

                default:
                    console.log("Layer type not supported by attribute loader: " + layerType);
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
                    topic.publish(EventManager.Datagrid.APPLY_EXTENT_FILTER);
                    console.log('END ATTRIB LOAD: ' + layer.id);

                    break;

                default:
                    console.log("Layer type not supported by attribute extractor: " + layer.ramp.type);
            }

            //TODO do we need to return any sort of promise to indicate when the loading has finished?
        }

        return {
            loadAttributeData: loadAttributeData,
            extractAttributeData: extractAttributeData,
            updateAttributeData: updateAttributeData
        };
    });