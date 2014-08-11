/*global define */

//the "use strict" forces the ECMA Script 5 interpretation of the code

/**
*
*
* @module RAMP
* @submodule BoundingBoxLayer
*/

/**
* A subclass of esri.layers.GraphicsLayer that is used to represent layers containing extent bounding boxes.
*
* @class BoundingBoxLayer
*/

define(["dojo/_base/declare"],
    function (declare) {
        "use strict";
        return declare(esri.layers.GraphicsLayer, {
            // Do this so we can call the superclass constructor ourselves
            "-chains-": {
                constructor: "manual"
            },

            constructor: function (arg) {
                this.inherited(arg);
            }
        });
    });