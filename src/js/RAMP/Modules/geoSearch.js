/* global define, console, RAMP, $, i18n */

/**
*
*
* @module RAMP
* @submodule GeoSearch
*/

/**
* GeoSearch class.
*
* Handles the querying of the geolocation service
* This includes adding user filters, parsing user input, and packaging return values
*
* @class LayerLoader
* @static
* @uses dojo/topic
* @uses dojo/_base/array
* @uses esri/geometry/Extent
* @uses esri/tasks/GeometryService
* @uses esri/tasks/ProjectParameters
* @uses EventManager
* @uses GlobalStorage
* @uses Map
* @uses Ramp
* @uses Util
*/

define([
/* Dojo */
"dojo/topic", "dojo/_base/array",

/* ESRI */
"esri/tasks/GeometryService", "esri/tasks/ProjectParameters", "esri/geometry/Extent",

/* RAMP */
"ramp/eventManager", "ramp/map", "ramp/globalStorage", "ramp/ramp",

/* Util */
"utils/util"],

    function (
    /* Dojo */
    topic, dojoArray,

    /* ESRI */
    GeometryService, ProjectParameters, EsriExtent,

    /* RAMP */
    EventManager, RampMap, GlobalStorage, Ramp,

     /* Util */
    UtilMisc) {
        "use strict";

        //types of special inputs by the user
        var parseType = {
            "none": "none",
            "fsa": "fsa",
            "latlong": "latlong",
            "prov": "prov"
        };

        /**
        * Will determine if a value is a valid number for a lat/long co-ordinate
        *
        * @method isLatLong
        * @private
        * @param {String} value value to test
        * @return {Boolean} tells if value is valid lat/long
        */
        function isLatLong(value) {
            if (isNaN(value)) {
                return false;
            } else {
                var numType = Number(value);
                return ((numType >= -180) && (numType <= 180));
            }
        }

        /**
        * Will examine the user search string. Returns any special type and related data
        * Valid types are: none, fsa, latlong, prov
        *
        * @method parseInput
        * @private
        * @param {String} input user search string
        * @return {Object} result of parse.  has .type (string) and .data (object) properties
        */
        function parseInput(input) {
            var ret = {
                type: parseType.none,
                data: input
            },
                fsaReg = /[A-Za-z]\d[A-Za-z]/;

            //check for FSA
            if ((input.length > 2) && (fsaReg.test(input.substring(0, 3)))) {
                //ensure there is a break after first 3 characters
                if (((input.length > 3) && (input.substring(3, 4) === ' ')) || (input.length === 3)) {
                    //tis an FSA
                    ret.type = parseType.fsa;
                    ret.data = input.substring(0, 3);
                    return ret;
                }
            }

            if (input.indexOf(',') > 0) {
                var vals = input.split(',');

                //check lat/long
                if (vals.length === 2) {
                    if (isLatLong(vals[0]) && isLatLong(vals[1])) {
                        ret.type = parseType.latlong;
                        ret.data = {
                            lat: Number(vals[0]),
                            long: Number(vals[1]),
                        }
                        return ret;
                    }
                }

                //check for trailing province
                //TODO move this into language configs?
                var provFull = ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon", "Alberta", "Colombie-Britannique", "Manitoba", "Nouveau-Brunswick", "Terre-Neuve-et-Labrador", "Territoires du Nord-Ouest", "Nouvelle-Écosse", "Nunavut", "Ontario", "île-du-Prince-Édouard", "Québec", "Saskatchewan", "Yukon"],
                    provAbbr = ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"],
                    provTest = vals[vals.length - 1].trim();

                //lower case equality test
                function lc_comp(arrayElem) {
                    return provTest.toLowerCase() === arrayElem.toLowerCase();
                }

                //see if item after last comma is a province
                if (provFull.some(lc_comp) || provAbbr.some(lc_comp)) {
                    ret.type = parseType.prov;
                    ret.data = {
                        prov: provTest,
                        searchVal: input.substring(0, input.lastIndexOf(","))
                    };
                }
            }

            return ret;
        }

        return {
            /**
            * Initializes properties.  Set up event listeners
            *
            * @method init
            */
            parseInput: parseInput
        };
    });