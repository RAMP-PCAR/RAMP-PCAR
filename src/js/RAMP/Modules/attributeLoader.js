/* global define, console */

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
        * Will download the attribute data for a layer.
        *
        * @method loadAttributeData
        * @private
        * @param  {String} layerId id of the layer
        * @param  {String} layerUrl the URL of the layer
        * @param  {String} layerType type of the layer. should be a value from GlobalStorage.layerType
        * @param  {Object} [options] additional options for layer item (mostly error messages in this case)
        */
        function loadAttributeData(layerId, layerUrl, layerType) {
            switch (layerType) {
                case GlobalStorage.layerType.feature:

                    //fetch attributes from feature layer. where 1=1 (all records). outFields * (all attributes). no geometry.
                    var defService = script.get(layerUrl + '/query', {
                        query: "where=1%3D1&outFields=*&returnGeometry=false&f=json",
                        jsonp: "callback"
                    });

                    defService.then(
                    function (result) {
                        //change to standard format and store.
                        //TODO change if we decide on a non-esri standard format
                        var attribData = {
                            layerId: layerId,
                            features: result.features,
                            index: {}
                        };

                        //TODO consider having the following stuff in a different function, that can be called when file based stuff is loaded.

                        //find object id field
                        result.fields.every(function (elem) {
                            if (elem.type === 'esriFieldTypeOID') {
                                attribData.idField = elem.name;
                                return false; //break the loop
                            }
                            return true; //keep looping
                        });

                        //make parent pointers and a fun index on object id
                        attribData.features.forEach(function (elem, idx) {
                            //map object id to index of object in feature array
                            //use toString, as objectid is integer and will act funny using array notation.
                            attribData.index[elem.attributes[attribData.idField].toString()] = idx;

                            //pointer back to parent
                            elem.parent = attribData;
                        });

                        //TODO store attribData somewhere
                    },
                    function (error) {
                        console.log("Attribute load error : " + error);
                    });

                    break;

                default:
                    console.log("Layer type not supported by attribute loader: " + layerType);
            }

            //TODO do we need to return any sort of promise to indicate when the loading has finished?
            //TODO should we raise a topic indicating loading has finished (could trigger a grid refresh)
        }

        return {
            loadAttributeData: loadAttributeData
        };
    });