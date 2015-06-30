/* global define */

/**
* Utility module containing useful static classes.
*
* @module Utils
* @uses dojo/_base/declare
* @uses dojo/io-query
*/

define(['dojo/_base/declare', 'dojo/io-query'],
    function (declare, dojoQuery) {
        'use strict';
        return declare(null, {
            /**
            * A simple class that replaces the `dojo._Url` functionality that became deprecated
            * Construct a Url object from a url string, then the uri and query
            * part of the url string can be accessed from the Url's uri and query
            * field respectively.
            *
            * #####Example
            *
            *      require(['scripts/Url'], function(Url) {
            *              var urlObj = new Url('http://somewebsite.com');
            *
            *              // Access the uri and query using the urlObj's fields
            *              var uri = urlObj.uri;
            *              var query = urlObj.query;
            *        });
            *
            * @class Url
            * @constructor
            * @param {String} fullUrl a string denoting the full url of a webpage
            * @uses dojo/_base/declare
            * @uses dojo/io-query
            */
            constructor: function (fullUrl) {
                var index = fullUrl.indexOf('?');

                if (index === -1) {
                    this.uri = fullUrl;
                    this.query = '';
                } else {
                    this.uri = fullUrl.substring(0, index);
                    this.query = fullUrl.substring(index + 1);
                }
                this.queryObject = dojoQuery.queryToObject(this.query);
            }
        });
    });
