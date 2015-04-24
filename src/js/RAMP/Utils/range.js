/*global define */
/*jshint bitwise: false*/

/**
* @module Utils
*/

/**
* Set of functions that deal with ranges of integers.
* Code assumes caller does not supply bad values (e.g. tries to insert a new range that overlaps an existing range).
*
* ####Imports RAMP Modules:
* {{#crossLink "Util"}}{{/crossLink}}
*
* @class Range
* @static
*/
define(["utils/array"],
    function (UtilArray) {
        "use strict";
        return {
            /**
            * Returns an object describing the range between the min and max values.
            *
            * @method newRange
            * @static
            * @param {Integer} min minimum value of the range
            * @param {Integer} max maximum value of the range
            * @return {Object} object describing the range
            */
            newRange: function (min, max) {
                return { min: min, max: max };
            },

            /**
            * Returns if a number is inside an individual range
            *
            * @method isInRange
            * @static
            * @param {Object} range a single range of integers
            * @param {Integer} num number to test if inside the range
            * @return {Boolean} if the number is inside the range
            */
            isInRange: function (range, num) {
                return (range.min <= num) && (range.max >= num);
            },

            /**
            * Returns the array index where a number would reside between existing ranges
            *
            * @method findInsertionIndex
            * @static
            * @param {Array} rangeSet an ordered array of ranges.
            * @param {Integer} num number find and insertion point for. number should not exist in any ranges in the range set
            * @return {Integer} insertion index. can point to an index one beyond the current max of the range set
            */
            findInsertionIndex: function (rangeSet, num) {
                var insertIdx = UtilArray.indexOf(rangeSet, function (range) {
                    return range.min > num;
                });

                if (insertIdx === -1) {
                    insertIdx = rangeSet.length;
                }

                return insertIdx;
            },

            /**
            * Merge two adjacent ranges in a range set into one single range
            *
            * @method mergeRanges
            * @static
            * @param {Array} rangeSet an ordered array of ranges. The array is modified by the function.
            * @param {Integer} firstIdx position in rangeSet of the range to be merged with the range directly after it.
            */
            mergeRanges: function (rangeSet, firstIdx) {
                //combine the two ranges
                var newRange = this.newRange(rangeSet[firstIdx].min, rangeSet[firstIdx + 1].max);

                //remove the original two ranges, insert the new range
                rangeSet.splice(firstIdx, 2, newRange);
            },

            /**
            * Will add a new range of numbers to a range set.  If numbers are adjacent to existing ranges, ranges will be merged.
            *
            * @method addRange
            * @static
            * @param {Array} rangeSet an ordered array of ranges. The array is modified by the function.
            * @param {Object} newRange new range to add
            */
            addRange: function (rangeSet, newRange) {
                if (rangeSet.length === 0) {
                    rangeSet.push(newRange);
                } else {
                    //find insertion point.  find the range where the min value is greater than the max of the new range.
                    var insertIdx = this.findInsertionIndex(rangeSet, newRange.max);

                    //insert at appropriate spot
                    rangeSet.splice(insertIdx, 0, newRange);

                    //check for touching range boundaries (high + low), merge ranges if they exists
                    if (insertIdx < (rangeSet.length - 1)) {
                        if (rangeSet[insertIdx + 1].min === (newRange.max + 1)) {
                            this.mergeRanges(rangeSet, insertIdx);
                        }
                    }

                    if (insertIdx > 0) {
                        if (rangeSet[insertIdx - 1].max === (newRange.min - 1)) {
                            this.mergeRanges(rangeSet, insertIdx - 1);
                        }
                    }
                }
            },

            /**
            * Will find an optimal empty space between existing ranges to house a new range containing a specific number.
            * Optimal range is as close to the maximum size as possible, and favours values ahead of the number rather than behind it.
            *
            * @method findOptimalEmptyRange
            * @static
            * @param {Array} rangeSet an ordered array of ranges. The array is modified by the function.
            * @param {Integer} value number that will belong in the new range. should not be in any existing ranges in the range set
            * @param {Integer} maxSize maximum size for a new range
            * @return {Object} a range object describing the optimal range for the new value to reside in
            */
            findOptimalEmptyRange: function (rangeSet, value, maxSize) {
                //find insertion point
                var bottom, top,
                    insertIdx = this.findInsertionIndex(rangeSet, value);

                //find border min/max
                //remember, we havn't inserted a new range into the set yet, so the insert index represents where the new range *will* be

                if (insertIdx < rangeSet.length) {
                    top = rangeSet[insertIdx].min + 1;
                } else {
                    top = 9007199254740991; //fairly close to the biggest int possible
                }

                if (insertIdx > 0) {
                    bottom = rangeSet[insertIdx - 1].max - 1;
                } else {
                    bottom = 0;
                }

                if ((top - bottom) > (maxSize - 1)) {
                    //the number of values between the gap in ranges is larger than our maximum request size
                    //go forward first
                    if ((top - value) > (maxSize - 1)) {
                        //range forward is too big as well.  clip it
                        top = value + (maxSize - 1);
                        bottom = value;
                    } else {
                        //take from top of range, then go backwards
                        bottom = top - (maxSize - 1);
                    }
                } //else the size of the gap is less than our max, so we take it all (values stay unchanged)

                //return new optimal range
                return this.newRange(bottom, top);
            }
        };
    });