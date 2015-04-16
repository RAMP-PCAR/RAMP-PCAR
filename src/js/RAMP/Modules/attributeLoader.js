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
"dojo/topic", "dojo/request/script", "dojo/Deferred",

/* RAMP */
"ramp/eventManager", "ramp/globalStorage"],

    function (
    /* Dojo */
    topic, script, Deferred,

    /* RAMP */
    EventManager, GlobalStorage) {
        "use strict";

        /**
        * Will generate object id indexes and parent pointers on a layer data object.
        * Assumes data object already has features and object id field defined
        *
        * @method enhanceData
        * @private
        * @param  {Object} layerData layer data object        
        */
        function enhanceData(layerData) {
            //make parent pointers and a fun index on object id
            layerData.features.forEach(function (elem, idx) {
                //map object id to index of object in feature array
                //use toString, as objectid is integer and will act funny using array notation.
                layerData.index[elem.attributes[layerData.idField].toString()] = idx;

                //pointer back to parent
                elem.parent = layerData;
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
                    //fetch attributes from feature layer. where 1=1 (all records). outFields * (all attributes). no geometry.
                    var defService = script.get(layerUrl + '/query', {
                        query: "where=1%3D1&outFields=*&returnGeometry=false&f=json",
                        jsonp: "callback"
                    });

                    defService.then(
                    function (result) {
                        //change to standard format and store.
                        //TODO change if we decide on a non-esri standard format
                        var layerData = {
                            layerId: layerId,
                            features: result.features,
                            index: {}
                        };

                        //TODO consider having the following stuff in a different function, that can be called when file based stuff is loaded.

                        //find object id field
                        result.fields.every(function (elem) {
                            if (elem.type === 'esriFieldTypeOID') {
                                layerData.idField = elem.name;
                                return false; //break the loop
                            }
                            return true; //keep looping
                        });

                        enhanceData(layerData);

                        //store attribData
                        RAMP.data[layerId] = layerData;
                        //new data. tell grid to reload
                        topic.publish(EventManager.Datagrid.APPLY_EXTENT_FILTER);
                        console.log('END ATTRIB LOAD: ' + layerId);
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
                    //TODO change if we decide on a non-esri standard format
                    var layerData = {
                        layerId: layer.id,
                        features: [],
                        index: {},
                        idField: layer.objectIdField
                    };

                    //TODO consider having the following stuff in a different function, that can be called when file based stuff is loaded.

                    //find object id field
                    layerData.features = layer.graphics.map(function (elem) {
                        return { attributes: elem.attributes };
                    });

                    enhanceData(layerData);

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
            extractAttributeData: extractAttributeData
        };
    });