/* global define */

/**
 * @module Utils
 */

/**
 * A class containing functions that accepts a function as argument and returns a function.
 *
 *
 * @class Decorator
 * @static
 */
define([],
    function () {
        "use strict";
        return {
            /**
             * Given a comparator function that takes two objects and returns an integer (positive integer
             * means the first object is greater in sort order than the second object, negative integer
             * means the second object is greater in sort order than the first object, zero if both objects
             * have the same sort order). Returns a function that takes one object compares it to the given
             * target using the given compareFcn and returns the result of the `compareFcn`.
             *
             * A useful scenario of this function would be if one had a sorting function used to sort an array
             * then one wishes to perform binary search on the sorted array.
             *
             * @method getFindFcn
             * @static
             * @param {Function} compareFcn
             * @param {Object} target
             * @return {Function} that takes one object compares it to the given target using the given compareFcn and returns the result of the compareFcn
             */
            getFindFcn: function (compareFcn, target) {
                function findFcn(obj) {
                    return compareFcn(target, obj);
                }

                return findFcn;
            }
        };
    });