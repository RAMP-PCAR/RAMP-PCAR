/*global define, RAMP */

/**
*
*
* @module RAMP
*/

/**
* RAMP class.
*
* Module for shared code that need the global configuration object.
* For code that can be of use to any javascript program and do not
* require the global configuration object, place the code in
* util.js
*
* ####Imports RAMP Modules:
* {{#crossLink "Array"}}{{/crossLink}}  
* 
* @class RAMP
*/

define(["utils/array"], function (UtilArray) {
    "use strict";
    return {
        /**
        * Returns the feature layer config for the given id
        *
        * @param {String} id layer id string
        * @method getLayerConfigWithId
        */
        getLayerConfigWithId: function (id) {
            return UtilArray.find(RAMP.config.layers.wms.concat(RAMP.config.layers.feature),
                function (layerConfig) {
                    return layerConfig.id === id;
                });
        }
    };
});