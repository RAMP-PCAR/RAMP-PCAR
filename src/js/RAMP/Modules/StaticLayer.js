/*global define, esri */

//the "use strict" forces the ECMA Script 5 interpretation of the code

/**
*
*
* @module RAMP
* @submodule StaticLayer
*/

/**
* A subclass of esri.layers.FeatureLayer that is used to represent static layers
*
* @class StaticLayer
*/

define(["dojo/_base/declare"],
    function (declare) {
        //"use strict";
        return declare(esri.layers.FeatureLayer, {
            constructor: function (url, options) {
                this.inherited(arguments);
            }
        });
    });