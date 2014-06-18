/* global define */

/**
* Utility module containint useful static classes.
*
* @module Utils
*/

/**
* A set of useful functions for manipulating dictionaries.
*
*
* @class Dictionary
* @static
* @uses dojo/_base/array
* @uses dojo/_base/lang
* @uses Util
*/
define([
        "dojo/_base/array", "dojo/_base/lang",
        "utils/util"
    ],

    function (
        dojoArray, dojoLang,
        UtilMisc) {
        "use strict";

        return {

            /** 
            * Iterates over the key-value pair in the given dictionary (in arbitrary order) and
            * calls the given function on each key-value pair.
            *
            * @method forEachEntry
            * @static
            * @param {Object} dict a dictionary object
            * @param {Function} fcn a function that takes the following parameters:
            *  - the `key`
            *  - the `value`
            *  - `obj` (an optional parameter) that contains two fields, exit and returnVal. If exit is set to true,
            * forEachEntry terminates right away (without iterating over the rest of the dictionary). The
            * return value of forEackKeyValuePair is returnVal (which by default is undefined).</param>
            * @param {Function} [sortFcn] true if the dictionary keys are to be sorted before iterating
            * @param {Object} [scope] The scope to be hitched to the given fcn
            */
            forEachEntry: function (dict, fcn, sortFcn, scope) {
                if (!UtilMisc.isUndefined(scope)) {
                    fcn = dojoLang.hitch(scope, fcn);
                }

                var keys = [];

                for (var key in dict) {
                    if (dict.hasOwnProperty(key)) {
                        keys.push(key);
                    }
                }

                if (sortFcn) {
                    keys.sort(sortFcn);
                }

                dojoArray.forEach(keys, function (key) {
                    fcn(key, dict[key]);
                });
            },

            /** 
            * Iterates over the key-value pair in the given dictionary and
            * returns the index of the first element to cause the given fcn to return
            * true.
            *
            * @method find
            * @static
            * @param {Object} dict a dictionary object
            * @param {Function} fcn a function that takes the following parameters:
            * - the `key`
            * - the `value`
            * and returns true if the given key or value satisfy some condition
            * @param {Function} [compareFcn] a comparator function (takes two arguments and returns an integer) used to sort the keys
            */
            find: function (dict, fcn, compareFcn) {
                var keys = [];

                for (var key in dict) {
                    if (dict.hasOwnProperty(key)) {
                        keys.push(key);
                    }
                }

                if (compareFcn) {
                    keys.sort(compareFcn);
                }

                var index = -1;
                dojoArray.some(keys, function (key, i) {
                    if (fcn(key, dict[key])) {
                        index = i;
                        return true;
                    }
                });

                return index;
            },

            /**
            * Returns the number of keys in the given dictionary.
            *
            * @method length
            * @param dict {Object} a dictionary
            * @return {Integer} the number of keys in the dictionary
            * @static
            */
            length: function (dict) {
                return Object.keys(dict).length;
            },

            /**
            * Returns true if the given dictionary is empty (i.e. has no keys)
            *
            * @method isEmpty
            * @static
            * @param  dict {Object} a dictionary
            * @return {Boolean} true if the dictionary is empty, false otherwise
            */
            isEmpty: function (dict) {
                return this.length(dict) === 0;
            },

             /**
            * Returns a shallow copy of the given dictionary.
            * 
            * @static
            * @method clone
            * @param dict {Object} a dictionary
            * @return {Object} a shallow copy of the given dictionary
            */
            clone: function (dict) {
                var copy = {};
                this.forEachEntry(dict, function (key, value) {
                    copy[key] = value;
                });
                return copy;
            }

        };
    });