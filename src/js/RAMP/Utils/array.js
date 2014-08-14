﻿/*global define */
/*jshint bitwise: false*/

/**
* @module Utils
*/

/**
* Set of functions that deal with arrays.
*
* @class Array
* @static
* @uses dojo/_base/array
* @uses dojo/_base/lang
*/
define(["dojo/_base/array", "dojo/_base/lang"],
    function (dojoArray, dojoLang) {
        "use strict";
        return {
            /**
            * Returns an array that has only unique values (only the first element is kept).
            *
            * @method unique
            * @static
            * @param {Array} array Array to be searched
            * @return {Array} array that has only unique values
            */
            unique: function (array) {
                return array.reverse().filter(function (e, i, array) {
                    return array.indexOf(e, i + 1) === -1;
                }).reverse();
            },

            /**
            * Returns the first element in the given array that satisfies the given
            * predicate. Returns null if no element in the given array satisfies
            * the given predicate.
            *
            * #####EXAMPLE
            *     var array = [1, 2, 3, 4]
            *     find(array, function(a_number) { return a_number === 2 }); -> 2
            *     find(array, function(a_number) { return a_number === 5 }); -> null
            *
            *
            * @method find
            * @static
            * @param {Array} arr Array to be searched
            * @param {Function} predicate a function that takes one argument and returns true if the
            * argument satisfies some condition, and false otherwise.</param>
            * @param {Object} scope ???
            * @return {Object} first elemtn that satisfies the given preidcate; `null` if no such element is found
            */
            find: function (arr, predicate, scope) {
                var index = this.indexOf(arr, predicate, scope);
                if (index === -1) {
                    return null;
                } else {
                    return arr[index];
                }
            },

            /**
            * Returns the index of the first element in the given array that satisfies the given
            * predicate. Returns -1 if no element in the given array satisfies the predicate.
            *
            *
            * @method indexOf
            * @static
            * @param {Array} arr Array to be searched
            * @param {Function} predicate predicate a function that takes one argument and returns true if the
            * @param {Object} scope ???
            * @return {Number} index of the first element that satisfied the predicate; `-1` if no such element is found
            */
            indexOf: function (arr, predicate, scope) {
                if (typeof scope !== 'undefined') {
                    predicate = dojoLang.hitch(scope, predicate);
                }
                var i;
                for (i = 0; i < arr.length; i++) {
                    if (predicate(arr[i])) {
                        return i;
                    }
                }
                return -1;
            },

            /**
            * Given a function which takes one argument and returns 1, 0, or -1, returns the first element
            * which causes the given function to return 0.
            *
            * @method binaryIndexOf
            * @static
            * @param {Array} arr Array to be searched
            * @param {Function} compareFcn ???
            * @return {Number} the index of the element that causes the given function to return 0, returns -1 if no such element exists
            */
            binaryIndexOf: function (arr, compareFcn) {
                var minIndex = 0,
                    maxIndex = arr.length - 1,
                    currentIndex,
                    currentElement;

                while (minIndex <= maxIndex) {
                    currentIndex = (minIndex + maxIndex) / 2 | 0;
                    currentElement = arr[currentIndex];

                    if (compareFcn(currentElement) < 0) {
                        minIndex = currentIndex + 1;
                    } else if (compareFcn(currentElement) > 0) {
                        maxIndex = currentIndex - 1;
                    } else {
                        return currentIndex;
                    }
                }

                return -1;
            },

            /**
            * Given a function which takes one argument and returns 1, 0, or -1, returns the first element
            * which causes the given function to return 0.
            *
            * @method binaryFind
            * @static
            * @param {Array} arr Array to be searched
            * @param {Function} compareFcn ???
            * @return {Number} the index of the element that causes the given function to return 0, returns -1 if no such element exists</returns>
            */
            binaryFind: function (arr, compareFcn) {
                var index = this.binaryIndexOf(arr, compareFcn);
                return arr[index];
            }
        };
    });