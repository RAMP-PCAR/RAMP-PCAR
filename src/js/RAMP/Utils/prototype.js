/* global define */
/* jshint bitwise:false  */

/**
* @module Utils
*/

/**
* Adds method prototypes to predefined classes to enhance their functionality.
*
* @class Prototype
* @static
* @uses esri/geometry/Extent
*/
define([
/* ESRI */
        "esri/geometry/Extent"
],

    function (
    /* ESRI */
        EsriExtent) {
        "use strict";

        /**
        * Attempt to add the given fcn as a prototype to the given obj under
        * the given name. Outputs a warning message to the console if
        * a prototype of the same name already exists.
        *
        * @method addProtytype
        * @param {Object} obj
        * @param {String} name
        * @param {Function} fcn
        * @private
        */
        function addPrototype(obj, name, fcn) {
            if (typeof obj.prototype[name] !== 'function') {
                obj.prototype[name] = fcn;
            } else {
                console.log(String.format("WARNING: unable to add prototype {0} to {1}. One already exists!", name, obj.toString()));
            }
        }

        /**
        * Attempt to add the given fcn as a static function to the given class under
        * the given name. Outputs a warning message to the console if
        * a function of the same name already exists.
        *
        * @method AddStaticFcn
        * @param {Object} obj
        * @param {String} name
        * @param {Function} fcn
        * @private
        */
        function addStaticFcn(obj, name, fcn) {
            if (typeof obj[name] !== 'function') {
                obj[name] = fcn;
            } else {
                console.log(String.format("WARNING: unable to add static function {0} to {1}. One already exists!", name, obj.toString()));
            }
        }

        /**
        * Add extra functions to the Array object. Adds the following:
        * - `Array.remove()` - prototype for removing items from array
        * - `Array.append(arr)` - Add all the elements of the given array to this array.
        * - `Array.isEmpty()` - Returns true if the length of the array is 0.
        * - `Array.last()` - Returns true if the length of the array is 0.
        * - `Array.contains(obj)` - Returns true if this Array contains the given object
        * - `Array.flatter(arr)` - Array Flatten object extention: http://tech.karbassi.com/2009/12/17/pure-javascript-flatten-array/
        * - `Array.max()` - Returns the max value in the array
        * - `Array.min()` - Returns the min value in the array
        *
        *
        * @method _initArrayPrototype
        * @return {Array} The array
        * @private
        */
        function _initArrayPrototype() {
            // prototype for removing items from array
            addPrototype(Array, "remove", function () {
                var what, a = arguments,
                    L = a.length,
                    ax;
                while (L && this.length) {
                    what = a[--L];
                    while ((ax = this.indexOf(what)) !== -1) {
                        this.splice(ax, 1);
                    }
                }
                return this;
            });

            // Add all the elements of the given array to this array.
            addPrototype(Array, "append", function (arr) {
                this.push.apply(this, arr);
            });

            // Sum all the elements in the array, no checking for non-numeric types
            addPrototype(Array, "sum", function () {
                var i, res;
                for (i = 0, res = 0; i < this.length; ++i) {
                    res += this[i];
                }
                return res;
            });

            // Returns true if the length of the array is 0.
            addPrototype(Array, "isEmpty", function () {
                return this.length === 0;
            });

            // Returns the last element of the array
            addPrototype(Array, "last", function () {
                return this[this.length - 1];
            });

            // Returns true if this Array contains the given object
            addPrototype(Array, "contains", function (obj) {
                return this.indexOf(obj) > -1;
            });

            // Array Flatten object extention: http://tech.karbassi.com/2009/12/17/pure-javascript-flatten-array/
            addStaticFcn(Array, "flatten", function flatten(arr) {
                var flat = [],
                    i, l, type;

                for (i = 0, l = arr.length; i < l; i++) {
                    type = Object.prototype.toString.call(arr[i]).split(' ').pop().split(']').shift().toLowerCase();
                    if (type) {
                        flat = flat.concat(/^(array|collection|arguments|object)$/.test(type) ? flatten.call(arr[i]) : arr[i]);
                    }
                }
                return flat;
            });

            // Returns the max value in the array
            addStaticFcn(Array, "max", function (arr) {
                return Math.max.apply(Math, arr);
            });

            // Returns the min value in the array
            addStaticFcn(Array, "min", function (arr) {
                return Math.min.apply(Math, arr);
            });
        }

        /**
        * Add extra functions to the Object object. Adds the following:
        * - `Object.create(o)` - Takes an old object as a parameter and returns an empty new object that inherits from the old one
        *
        * @method _initObjectPrototype
        * @return {Array} The array
        * @private
        */
        function _initObjectPrototype() {
            // Takes an old object as a parameter and returns an empty new object that inherits from the old one
            addStaticFcn(Object, "create", function (o) {
                function F() { }
                F.prototype = o;
                return new F();
            });
        }

        /**
        * Add extra functions to the String object. Adds the following:
        * - `String.format()` - format the string replacing the placeholders with provided values
        * - `String.replaceAll(search, replace)` - replaces all instances
        *
        * @method _initStringPrototype
        * @return {Array} The array
        * @private
        */
        function _initStringPrototype() {
            addStaticFcn(String, "format", function () {
                var s = arguments[0],
                    i,
                    reg;

                for (i = 0; i < arguments.length - 1; i++) {
                    reg = new RegExp("\\{" + i + "\\}", "gm");
                    s = s.replace(reg, arguments[i + 1]);
                }

                return s;
            });

            addPrototype(String, "replaceAll", function (search, replace) {
                return this.toString().split(search).join(replace);
            });
        }

        /**
        * Add extra functions to the EsriExtent object. Adds the following:
        * - `EsriExtent.clone()` -
        * - `EsriExtent.widht()` -
        * - `EsriExtent.height()` -
        * - `EsriExtent.xyAspectFactor()` - Returns the ratio of this Extent's width to this Extent's height
        * - `EsriExtent.centerX()` -
        * - `EsriExtent.centerY()` -
        * - `EsriExtent.center()` -
        * - `EsriExtent.pan()` -
        *
        * @method _initEsriPrototype
        * @return {Array} The array
        * @private
        */
        function _initEsriPrototype() {
            addPrototype(EsriExtent, "clone", function () {
                return new EsriExtent(this.xmin, this.ymin, this.xmax, this.ymax, this.spatialReference);
            });

            addPrototype(EsriExtent, "width", function () {
                return Math.abs(this.xmin - this.xmax);
            });

            addPrototype(EsriExtent, "height", function () {
                return Math.abs(this.ymin - this.ymax);
            });

            // Returns the ratio of this Extent's width to this Extent's height
            addPrototype(EsriExtent, "xyAspectFactor", function () {
                return this.width() / this.height();
            });

            addPrototype(EsriExtent, "centerX", function () {
                return (this.xmin + this.xmax) / 2;
            });

            addPrototype(EsriExtent, "centerY", function () {
                return (this.ymin + this.ymax) / 2;
            });

            addPrototype(EsriExtent, "center", function () {
                return {
                    X: this.centerX,
                    Y: this.centerY
                };
            });

            addPrototype(EsriExtent, "pan", function (x, y) {
                var dx = this.centerX() - x,
                    dy = this.centerY() - y;
                return new EsriExtent(this.xmin - dx, this.ymin - dy, this.xmax - dx, this.ymax - dy, this.spatialReference);
            });
        }

        /**
        * Add extra jQuery functions. Adds the following:
        * - `$.findInputLabel()` - Returns labels corresponding to the set of input controls.
        * - `$.isOverflowed()` - Detects if the given span is overflowing with text
        *
        * @method _initJQueryprototype
        * @return {Array} The array
        * @private
        */
        function _initJQueryprototype() {
            // Returns labels corresponding to the set of input controls.
            $.fn.findInputLabel = function () {
                return this.map(function () {
                    return $(this).parent().find("label[for='" + this.id + "']")[0];
                });
            };

            // Detects if the given span is overflowing with text
            $.fn.isOverflowed = function () {
                var result,
                    span = $(this),
                    element = span
                        .clone()
                        .css({
                            display: 'inline',
                            width: 'auto',
                            visibility: 'hidden'
                        })
                        .appendTo('body');

                // also check the size of the parent's container
                result = element.width() > span.width() || span.width() > span.parent().width();

                element.remove();

                return result;
            };

            $.fn.forceStyle = function (obj) {
                var element = $(this);

                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        element[0].style.cssText += ';' + prop + ':' + obj[prop] + ' !important';
                    }
                }

                return element;
            };
        }

        _initStringPrototype();
        _initObjectPrototype();
        _initArrayPrototype();
        _initEsriPrototype();
        _initJQueryprototype();

        return {
            /**
            * Defines useful prototypes for basic types in javascript (e.g. String, Array)
            *
            * @param {Number} id
            * @param {String} require
            * @param {Function} load
            * @method load
            */
            load: function (id, require, load) {
                load();
            }
        };
    }
);