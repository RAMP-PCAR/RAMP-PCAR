/*global define */

//the "use strict" forces the ECMA Script 5 interpretation of the code

/**
*
*
* @module RAMP
*
*/

/**
* GlobalStorage class is used to store variables and exchange them between different modules. Each module has the ability to add variables to the global storage and retrieve them as needed.
*
* @class GlobalStorage
*/

define([],
    function () {
        "use strict";
        return {
            /**
             * Returns a URL that points to the application configuration (JSON format) if it's hosted on a web service.
             * This is not required if the application has a JSON config file in the website's folder
             * @property getConfigUrl
             * @type Object
             */
            getConfigUrl: function () {
                return "http://sncr01wbingsdv1.ncr.int.ec.gc.ca/ECDMP_Service/";
            }
        };
    });