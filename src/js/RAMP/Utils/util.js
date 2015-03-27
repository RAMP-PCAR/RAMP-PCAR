/* global define, window, XMLHttpRequest, ActiveXObject, XSLTProcessor, console, $, document, jQuery, FileReader, Btoa */
/* jshint bitwise:false  */

/**
* Utility module containing useful static classes.
*
* @module Utils
* @main Utils
*/

/**
* A set of functions used by at least one module in this project. The functions
* are generic enough that they may become useful for other modules later or functions
* that are shared amongst multiple modules should be added here.
*
* *__NOTE__: None of these functions require the global configuration object. (i.e. they
* are not exclusive to RAMP). For functions that depend on the global configuration
* object, place them in ramp.js.*
*
* @class Util
* @static
* @uses dojo/_base/array
* @uses dojo/_base/lang
* @uses dojo/topic
* @uses dojo/Deferred
* @uses esri/geometry/Extent
* @uses esri/graphic
*/
define(["dojo/_base/array", "dojo/_base/lang", "dojo/topic", "dojo/Deferred", "esri/geometry/Extent", "esri/graphic"],
    function (dojoArray, dojoLang, topic, Deferred, Extent, Graphic) {
        "use strict";

        /**
        * Helper function for wrapping File API calls in Promise objects.  Used for building a series of helpers which
        * call different file read methods.
        *
        * @method _wrapFileCallInPromise
        * @private
        * @param {String} readMethod a string indicating the FileReader method to call
        * @return {Function} a function which accepts a {File} object and returns a Promise
        */
        function _wrapFileCallInPromise(readMethod) {
            return function (file) {
                var reader = new FileReader(),
                    def = new Deferred();

                reader.onloadend = function (e) { def.resolve(e.target.result); };
                reader.onerror = function (e) { def.reject(e.target.error); };
                try {
                    reader[readMethod](file);
                } catch (e) {
                    def.reject(e);
                }

                return def.promise;
            };
        }

        return {
            /**
            * Checks if the console exists, if not, redefine the console and all console methods to
            * a function that does nothing. Useful for IE which does not have the console until the
            * debugger is opened.
            *
            * @method checkConsole
            * @static
            */
            checkConsole: function () {
                var noop = function () { },
                    methods = [
                        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
                        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
                        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
                        'timeStamp', 'trace', 'warn'
                    ],
                    length = methods.length,
                    console = (window.console = window.console || {}),
                    method;

                while (length--) {
                    method = methods[length];

                    // Only stub undefined methods.
                    if (!console[method]) {
                        console[method] = noop;
                    }
                }
            },

            // String Functions

            /**
            * Returns an String that has it's angle brackets ('<' and '>') escaped (replaced by '&lt;' and '&gt;').
            * This will effectively cause the String to be displayed in plain text when embedded in an HTML page.
            *
            * @method escapeHtml
            * @static
            * @param {String} html String to escape
            * @return {String} escapeHtml Escaped string
            */
            escapeHtml: function (html) {
                return html.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
            },

            /**
            * Returns true if the given String is a number
            *
            * @method isNumber
            * @static
            * @param {String} input The string to check
            * @return {boolean} True if number
            */
            isNumber: function (input) {
                return isFinite(String(input).trim() || NaN);
            },

            /**
            * Parse the given String into a boolean. Returns true if the String
            * is the word "true" (case insensitive). False otherwise.
            *
            * @method parseBool
            * @static
            * @param {String} str The string to check
            * @return {boolean} True if `true`
            */
            parseBool: function (str) {
                return (str.toLowerCase() === 'true');
            },

            // Deferred

            /**
            * Executes the callback function only after all the deferred Objects in the
            * given deferredList has resolved.
            *
            * @method afterAll
            * @static
            * @param {array} deferredList A list of Deferred objects
            * @param {function} callback The callback to be executed
            */
            afterAll: function (deferredList, callback, context) {
                if (deferredList.length === 0) {
                    callback();
                    return;
                }

                var completed = 0; // Keeps track of the number of deferred that has resolved
                dojoArray.forEach(deferredList, function (deferred) {
                    deferred.then(function () {
                        completed++;
                        if (completed === deferredList.length) {
                            callback.call(context);
                        }
                    });
                });
            },

            // Serialization

            /**
            * Converts an array into a '+' separated String that can be used as
            * the query parameter of a URL.
            *
            *      arrayToQuery(["abc", 123, "efg"]) -> "abc+123+efg"
            *
            * *__NOTE:__ the array should only contain primitives, objects will not be serialized
            * properly.*
            *
            * @method arrayToQuery
            * @static
            * @param {array} array An array of primitives to be serialized
            * @return {String} A serialized representation of the given array
            */
            arrayToQuery: function (array) {
                return array.join("+");
            },

            /**
            * Converts a query String generated by arrayToQuery into an array object.
            * The array object will only contain Strings.
            *
            *      queryToArray("abc+123+efg") -> ["abc", "123", "efg"]
            *
            * @method queryToArray
            * @static
            * @param {String} query A query string to be converted
            * @return {String} A resulting array of strings
            */
            queryToArray: function (query) {
                return query.split("+");
            },

            // Event handling

            /**
            * A convenience method that wraps around Dojo's subscribe method to allow
            * a scope to hitched to the given callback function.
            *
            * @method subscribe
            * @static
            * @param {String} name Event name
            * @param {function} callback The callback to be executed
            * @param {object} scope Scope of the callback
            */
            subscribe: function (name, callback, scope) {
                if (this.isUndefined(scope)) {
                    topic.subscribe(name, callback);
                } else {
                    topic.subscribe(name, dojoLang.hitch(scope, callback));
                }
            },

            /**
            * Subscribes to an event, after the event has occurred, the handle is
            * removed.
            *
            * @method subscribeOnce
            * @static
            * @param {String} name Event name
            * @param {function} callback The callback to be executed
            */
            subscribeOnce: function (name, callback) {
                var handle = null,
                    wrapper = function (evt) {
                        handle.remove();
                        callback(evt);
                    };

                return (handle = topic.subscribe(name, wrapper));
            },

            /**
            * Subscribes to a set of events, executes the callback when any of the events fire, then removes the handle.
            *
            * @method subscribeOnceAny
            * @static
            * @param  {String} names An array of event names
            * @param  {Function} callback The callback to be executed
            */
            subscribeOnceAny: function (names, callback) {
                var handles = [];

                function wrapper(evt) {
                    dojoArray.forEach(handles, function (handle) {
                        handle.remove();
                    });

                    callback(evt);
                }

                dojoArray.forEach(names, dojoLang.hitch(this,
                    function (name) {
                        handles.push(this.subscribeOnce(name, wrapper));
                    }));
            },

            /**
            * Given an array of event names published by topic.publish, call the given
            * callback function after ALL of the given events have occurred. An array of
            * arguments is passed to the callback function, the arguments are those returned
            * by the events (in the order that the events appear in the array).
            *
            * #####Example
            *
            * Assume somewhere a module publishes a "click" event:
            *
            *      topic.publish("click", { mouseX: 10, mouseY: 50 });
            *
            * and somewhere else another module publishes a "finishLoading" event:
            *
            *      topic.publish("finishLoading", { loadedPictures: [pic1, pic2] });
            *
            * Then if one wants to do something (e.g. display pictures) only after the pictures
            * have been loaded AND the user clicked somewhere, then:
            *
            * - args[0] will be the object returned by the "click" event
            * - which in this case will be: { mouseX: 10, mouseY: 50 }
            * - args[1] will be the object returned by the "finishLoading" event
            * - which in this case will be: { loadedPictures: [pic1, pic2] }
            *
            *
            *      subscribe(["click", "finishLoading"], function(args) {
            *          doSomething();
            *      });
            *
            * *__NOTE:__
            * If one of the events fires multiple times before the other event, the object
            * passed by this function to the callback will be the object returned when the
            * event FIRST fired (subsequent firings of the same event are ignored). Also, if
            * some event do not return an object, it will also be excluded in the arguments to
            * the callback function. So be careful! For example, say you subscribed to the events:
            * "evt1", "evt2", "evt3". "evt1" returns an object (call it "evt1Obj"), "evt2" does not,
            * "evt3" returns two objects (call it "evt3Obj-1" and "evt3Obj-2" respectively).
            * Then the array passed to the callback will be: ["evt1Obj", "evt3Obj-1", "evt3Obj-2"].*
            *
            * @method subscribeAll
            * @static
            * @param {array} nameArray An array of Strings containing the names of events to subscribe to
            * @param {function} callback The callback to be executed
            */
            subscribeAll: function (nameArray, callback) {
                // Keeps track of the status of all the events being subscribed to
                var events = [];

                dojoArray.forEach(nameArray, function (eventName, i) {
                    events.push({
                        fired: false,
                        args: null
                    });

                    topic.subscribe(eventName, function () {
                        // If this is the fire time the event fired
                        if (!events[i].fired) {
                            // Mark the event has fired and capture it's arguments (if any)
                            events[i].fired = true;
                            events[i].args = Array.prototype.slice.call(arguments);

                            // Check if all events have fired
                            if (dojoArray.every(events, function (event) {
                                return event.fired;
                            })) {
                                // If so construct an array with arguments from the events
                                var eventArgs = [];
                                dojoArray.forEach(events, function (event) {
                                    eventArgs.append(event.args);
                                });
                                callback(eventArgs);
                            }
                        }
                    });
                });
            },

            // Specialized Variables *

            /**
            * Creates an object that acts like a lazy variable (i.e. a variable whose value is only
            * resolved the first time it is retrieved, not when it is assigned). The value given to
            * the lazy variable should be the return value of the given initFunc. The returned object
            * has two methods:
            *
            * - get - returns the value of the variable, if it is the first time get is called, the
            * the initFunc will be called to resolve the value of the variable.
            * - reset - forces the variable to call the initFunc again the next time get is called
            *
            * @method createLazyVariable
            * @static
            * @param {function} initFunc A function to call to resolve the variable value
            * @return {Object} The lazy variable
            */
            createLazyVariable: function (initFunc) {
                var value = null;
                return {
                    reset: function () {
                        value = null;
                    },

                    get: function () {
                        if (value == null) {
                            value = initFunc();
                        }
                        return value;
                    }
                };
            },

            // FUNCTION DECORATORS

            /**
            * Returns a function that has the same functionality as the given function, but
            * can only be executed once (subsequent execution does nothing).
            *
            * @method once
            * @static
            * @param {function} func Function to be decorated
            * @return {function} Decorated function that can be executed once
            */
            once: function (func) {
                var ran = false;
                return function () {
                    if (!ran) {
                        func();
                        ran = true;
                    }
                };
            },

            // MISCELLANEOUS

            /**
            * Returns true if the given obj is undefined, false otherwise.
            *
            * @method isUndefined
            * @static
            * @param {object} obj Object to be checked
            * @return {boolean} True if the given object is undefined, false otherwise
            */
            isUndefined: function (obj) {
                console.warn('Think twice about using isDefined: consider checking explicitly or using a falsy test instead');
                return (typeof obj === 'undefined');
            },

            /**
            * Compares two graphic objects.
            *
            * @method compareGraphics
            * @static
            * @param  {Object} one Graphic object
            * @param  {Object} two Graphic object
            * @return {boolean} True if the objects represent the same feature
            */
            compareGraphics: function (one, two) {
                var oneKey = "0",
                    twoKey = "1",
                    objectIdField,
                    oneLayer,
                    twoLayer;

                if (one && two &&
                    $.isFunction(one.getLayer) && $.isFunction(two.getLayer)) {
                    oneLayer = one.getLayer();
                    twoLayer = two.getLayer();
                    objectIdField = oneLayer.objectIdField;
                    oneKey = oneLayer.sourceLayerId + one.attributes[objectIdField];
                    twoKey = twoLayer.sourceLayerId + two.attributes[objectIdField];
                }

                return oneKey === twoKey;
            },

            /**
            * Returns the width of the scrollbar in pixels. Since different browsers render scrollbars differently, the width may vary.
            *
            * @method scrollbarWidth
            * @static
            * @return {int} The width of the scrollbar in pixels
            * @for Util
            */
            scrollbarWidth: function () {
                var $inner = jQuery('<div style="width: 100%; height:200px;">test</div>'),
                    $outer = jQuery('<div style="width:200px;height:150px; position: absolute; top: 0; left: 0; visibility: hidden; overflow:hidden;"></div>').append($inner),
                    inner = $inner[0],
                    outer = $outer[0],
                    width1, width2;

                jQuery('body').append(outer);
                width1 = inner.offsetWidth;
                $outer.css('overflow', 'scroll');
                width2 = outer.clientWidth;
                $outer.remove();

                return (width1 - width2);
            },

            /**
            * Checks if the height of the scrollable content of the body is taller than its height;
            * if so, offset the content horizontally to accommodate for the scrollbar assuming target's width is
            * set to "100%".
            *
            * @method adjustWidthForSrollbar
            * @static
            * @param {jObject} body A DOM node with a scrollbar (or not)
            * @param {jObject} targets An array of jObjects to add the offset to
            */
            adjustWidthForSrollbar: function (body, targets) {
                var offset = body.innerHeight() < body[0].scrollHeight ? this.scrollbarWidth() : 0;

                dojoArray.map(targets, function (target) {
                    target.css({
                        right: offset
                    });
                });
            },

            /**
            * Waits until a given function is available and executes a callback function.
            *
            * @method executeOnLoad
            * @static
            * @param {Object} target an object on which to wait for function to appear
            * @param {function} func A function whose availability in question
            * @param {function} callback The callback function to be executed after func is available
            */
            executeOnLoad: function (target, func, callback) {
                var deferred = new Deferred(),
                    handle;

                deferred.then(function () {
                    window.clearInterval(handle);
                    //console.log("deferred resolved");

                    callback();
                });

                handle = window.setInterval(function () {
                    if ($.isFunction(target[func])) {
                        deferred.resolve(true);
                    }
                }, 500);
            },

            /**
            * Loops through all object properties and applies a given function to each. Resolves the given deferred when done.
            *
            * @method executeOnDone
            * @static
            * @param {object} o Object to look through
            * @param {function} func A function to be executed with each object propety. Accepts two parameters: property and deferred to be resolved when it's done.
            * @param {object} d A deferred to be resolved when all properties have been processed.
            */
            executeOnDone: function (o, func, d) {
                var counter = 0,
                    arr = [],
                    deferred;

                function fnOnDeferredCancel() {
                    d.cancel();
                }

                function fnOnDeferredThen() {
                    counter--;
                    if (counter === 0) {
                        d.resolve(true);
                    }
                }

                d = d || new Deferred();

                for (var q in o) {
                    if (o.hasOwnProperty(q)) {
                        arr.push(o[q]);
                    }
                }

                counter = arr.length;

                arr.forEach(function (p) {
                    deferred = new Deferred(fnOnDeferredCancel);

                    deferred.then(fnOnDeferredThen);

                    func(p, deferred);
                });

                if (counter === 0) {
                    d.resolve(true);
                }
            },

            /**
            * Generates an rfc4122 version 4 compliant guid.
            * Taken from here: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
            *
            * @method guid
            * @static
            * @return {String} The generated guid string
            */
            // TODO: check if there is new/better code for guid generation
            guid: function () {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0,
                        v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            },

            /**
            * Returns an appropriate where clause depending on whether the query
            * is a String (returns a where clause with CASE INSENSITIVE comparison)
            * or an integer.
            *
            * @method getWhereClause
            * @static
            * @param {String} varName ???
            * @param {String | Number} query A query string
            * @return {String} The generated "where" clause
            */
            getWhereClause: function (varName, query) {
                if (this.isNumber(query)) {
                    return String.format("{0}={1}", varName, query);
                }
                return String.format("Upper({0})=Upper(\'{1}\')", varName, query);
            },

            /**
            * Converts html into text by replacing
            * all html tags with their appropriate special characters
            *
            * @method stripHtml
            * @static
            * @param {String} html HTML to be converted to text
            * @return {String} The HTML in text form
            */
            stripHtml: function (html) {
                var tmp = document.createElement("DIV");
                // jquery .text function converts html into text by replacing
                // all html tags with their appropriate special characters
                $(tmp).text(html);
                return tmp.textContent || tmp.innerText || "";
            },

            // Query geometry
            /*
            * Create a new extent based on the current map size, a point (X/Y coordinates), and a pixel tolerance value.
            * @method pointToExtent
            * @static
            * @param {Object} map The map control
            * @param {Object} point The location on screen (X/Y coordinates)
            * @param {Number} toleranceInPixel A value indicating how many screen pixels the extent should be from the point
            * @returns {Object} a new extent calculated from the given parameters
            *
            */
            pointToExtent: function (map, point, toleranceInPixel) {
                var pixelWidth = map.extent.getWidth() / map.width,
                    toleraceInMapCoords = toleranceInPixel * pixelWidth;

                return new Extent(point.x - toleraceInMapCoords,
                              point.y - toleraceInMapCoords,
                              point.x + toleraceInMapCoords,
                              point.y + toleraceInMapCoords,
                              map.spatialReference);
            },

            /**
            * Create boudingbox graphic for a bounding box extent
            *
            * @method createGraphic
            * @static
            * @param  {esri/geometry/Extent} extent of a bounding box
            * @return {esri/Graphic}        An ESRI graphic object represents a bouding box
            */
            createGraphic: function (extent) {
                return new Graphic({
                    geometry: extent,
                    symbol: {
                        color: [255, 0, 0, 64],
                        outline: {
                            color: [240, 128, 128, 255],
                            width: 1,
                            type: "esriSLS",
                            style: "esriSLSSolid"
                        },
                        type: "esriSFS",
                        style: "esriSFSSolid"
                    }
                });
            },

            /**
            * Checks if the string ends with the supplied suffix.
            *
            * @method endsWith
            * @static
            * @param {String} str String to be evaluated
            * @param {String} suffix Ending string to be matched
            * @return {boolean} True if suffix matches
            */
            endsWith: function (str, suffix) {
                return str.indexOf(suffix, str.length - suffix.length) !== -1;
            },

            /**
            * Recursively merge JSON objects into a target object.
            * The merge will also merge array elements.
            *
            * @method mergeRecursive
            * @static
            */
            mergeRecursive: function () {
                function isDOMNode(v) {
                    if (v === null) {
                        return false;
                    }
                    if (typeof v !== 'object') {
                        return false;
                    }
                    if (!('nodeName' in v)) {
                        return false;
                    }
                    var nn = v.nodeName;
                    try {
                        v.nodeName = 'is readonly?';
                    } catch (e) {
                        return true;
                    }
                    if (v.nodeName === nn) {
                        return true;
                    }
                    v.nodeName = nn;
                    return false;
                }

                // _mergeRecursive does the actual job with two arguments.
                // @param {Object} destination JSON object to have other objects merged into.  Parameter is modified by the function.
                // @param {Object} sourceArray Param array of JSON objects to merge into the source
                // @return {Ojbect} merged result object (points to destination variable)
                var _mergeRecursive = function (dst, src) {
                    if (isDOMNode(src) || typeof src !== 'object' || src === null) {
                        return dst;
                    }

                    for (var p in src) {
                        if (src.hasOwnProperty(p)) {
                            if ($.isArray(src[p])) {
                                if (dst[p] === undefined) {
                                    dst[p] = [];
                                }
                                $.merge(dst[p], src[p]);
                                continue;
                            }

                            if (src[p] === undefined) {
                                continue;
                            }
                            if (typeof src[p] !== 'object' || src[p] === null) {
                                dst[p] = src[p];
                            } else if (typeof dst[p] !== 'object' || dst[p] === null) {
                                dst[p] = _mergeRecursive(src[p].constructor === Array ? [] : {}, src[p]);
                            } else {
                                _mergeRecursive(dst[p], src[p]);
                            }
                        }
                    }
                    return dst;
                }, out;

                // Loop through arguments and merge them into the first argument.
                out = arguments[0];
                if (typeof out !== 'object' || out === null) {
                    return out;
                }
                for (var i = 1, il = arguments.length; i < il; i++) {
                    _mergeRecursive(out, arguments[i]);
                }
                return out;
            },

            /**
            * Applies supplied xslt to supplied xml. IE always returns a String; others may return a documentFragment or a jObject.
            *
            * @method transformXML
            * @static
            * @param {String} xmlurl Location of the xml file
            * @param {String} xslurl Location of the xslt file
            * @param {Function} callback The callback to be executed
            * @param {Boolean} returnFragment True if you want a document fragment returned (doesn't work in IE)}
            */
            transformXML: function (xmlurl, xslurl, callback, returnFragment, params) {
                var xmld = new Deferred(),
                    xsld = new Deferred(),
                    xml, xsl,
                    dlist = [xmld, xsld],
                    result,
                    error,
                    that = this;

                that.afterAll(dlist, function () {
                    if (!error) {
                        result = applyXSLT(xml, xsl);
                    }
                    callback(error, result);
                });

                // Transform XML using XSLT
                function applyXSLT(xmlString, xslString) {
                    var output, i;
                    if (window.ActiveXObject || window.hasOwnProperty("ActiveXObject")) { // IE
                        var xslt = new ActiveXObject("Msxml2.XSLTemplate"),
                            xmlDoc = new ActiveXObject("Msxml2.DOMDocument"),
                            xslDoc = new ActiveXObject("Msxml2.FreeThreadedDOMDocument"),
                            xslProc;

                        xmlDoc.loadXML(xmlString);
                        xslDoc.loadXML(xslString);
                        xslt.stylesheet = xslDoc;
                        xslProc = xslt.createProcessor();
                        xslProc.input = xmlDoc;
                        // [patched from ECDMP] Add parameters to xsl document (addParameter = ie only)
                        if (params) {
                            for (i = 0; i < params.length; i++) {
                                xslProc.addParameter(params[i].key, params[i].value, "");
                            }
                        }
                        xslProc.transform();
                        output = xslProc.output;
                    } else { // Chrome/FF/Others
                        var xsltProcessor = new XSLTProcessor();
                        xsltProcessor.importStylesheet(xslString);
                        // [patched from ECDMP] Add parameters to xsl document (setParameter = Chrome/FF/Others)
                        if (params) {
                            for (i = 0; i < params.length; i++) {
                                xsltProcessor.setParameter(null, params[i].key, params[i].value || "");
                            }
                        }
                        output = xsltProcessor.transformToFragment(xmlString, document);

                        // turn a document fragment into a proper jQuery object
                        if (!returnFragment) {
                            output = ($('body')
                                .append(output)
                                .children().last())
                                .detach();
                        }
                    }
                    return output;
                }

                // Distinguish between XML/XSL deferred objects to resolve and set response
                function resolveDeferred(filename, responseObj) {
                    if (filename.endsWith(".xsl")) {
                        xsl = responseObj.responseText;
                        xsld.resolve();
                    } else {
                        xml = responseObj.responseText;
                        xmld.resolve();
                    }
                }
                /*
               function loadXMLFileIE9(filename) {
                   var xdr = new XDomainRequest();
                    xdr.contentType = "text/plain";
                    xdr.open("GET", filename);
                    xdr.onload = function () {
                        resolveDeferred(filename, xdr);
                    };
                    xdr.onprogress = function () { };
                    xdr.ontimeout = function () { };
                    xdr.onerror = function () {
                        error = true;
                        resolveDeferred(filename, xdr);
                    };
                    window.setTimeout(function () {
                        xdr.send();
                    }, 0);
               }
               */
                // IE10+
                function loadXMLFileIE(filename) {
                    var xhttp = new XMLHttpRequest();
                    xhttp.open("GET", filename);
                    try {
                        xhttp.responseType = "msxml-document";
                    } catch (err) { } // Helping IE11
                    xhttp.onreadystatechange = function () {
                        if (xhttp.readyState === 4) {
                            if (xhttp.status !== 200) {
                                error = true;
                            }
                            resolveDeferred(filename, xhttp);
                        }
                    };
                    xhttp.send("");
                }

                if ('withCredentials' in new XMLHttpRequest() && "ActiveXObject" in window) { // IE10 and above
                    loadXMLFileIE(xmlurl);
                    loadXMLFileIE(xslurl);
                } else if (window.XDomainRequest) { // IE9 and below
                    /*
                     loadXMLFileIE9(xmlurl);
                     loadXMLFileIE9(xslurl);
                    */
                    // dataType need to be set to "text" for xml doc requests.
                    $.ajax({
                        type: "GET",
                        url: xmlurl,
                        dataType: "text",
                        cache: false,
                        success: function (data) {
                            xml = data;
                            xmld.resolve();
                        },
                        error: function () {
                            error = true;
                            xmld.resolve();
                        }
                    });

                    $.ajax({
                        type: "GET",
                        url: xslurl,
                        dataType: "text",
                        cache: false,
                        success: function (data) {
                            xsl = data;
                            xsld.resolve();
                        },
                        error: function () {
                            error = true;
                            xsld.resolve();
                        }
                    });
                } else { // Good browsers (Chrome/FF)
                    $.ajax({
                        type: "GET",
                        url: xmlurl,
                        dataType: "xml",
                        cache: false,
                        success: function (data) {
                            xml = data;
                            xmld.resolve();
                        },
                        error: function () {
                            error = true;
                            xmld.resolve();
                        }
                    });

                    $.ajax({
                        type: "GET",
                        url: xslurl,
                        dataType: "xml",
                        cache: false,
                        success: function (data) {
                            xsl = data;
                            xsld.resolve();
                        },
                        error: function () {
                            error = true;
                            xsld.resolve();
                        }
                    });
                }
            },

            /**
            * Parses a file using the FileReader API.  Wraps readAsText and returns a promise.
            *
            * @method readFileAsText
            * @static
            * @param {File} file a dom file object to be read
            * @return {Object} a promise which sends a string containing the file output if successful
            */
            readFileAsText: _wrapFileCallInPromise('readAsText'),

            /**
            * Parses a file using the FileReader API.  Wraps readAsBinaryString and returns a promise.
            *
            * @method readFileAsBinary
            * @static
            * @param {File} file a dom file object to be read
            * @return {Object} a promise which sends a string containing the file output if successful
            */
            readFileAsBinary: _wrapFileCallInPromise('readAsBinary'),

            /**
            * Parses a file using the FileReader API.  Wraps readAsArrayBuffer and returns a promise.
            *
            * @method readFileAsArrayBuffer
            * @static
            * @param {File} file a dom file object to be read
            * @return {Object} a promise which sends an ArrayBuffer containing the file output if successful
            */
            readFileAsArrayBuffer: _wrapFileCallInPromise('readAsArrayBuffer'),

            /**
            * Augments lists of items to be sortable using keyboard.
            * 
            * @method keyboardSortable
            * @param {Array} ulNodes An array of <ul> tags containing a number of <li> tags to be made keyboard sortable.
            * @param {Object} [settings] Additional settings
            * @param {Object} [settings.linkLists] Indicates if the supplied lists (if more than one) should be linked - items could be moved from one to another; Update: this is wrong - items can't be moved from list to list right now, but the keyboard focus can be moved between lists - need to fix.
            * @param {Object} [settings.onStart] A callback function to be called when the user initiates sorting process
            * @param {Object} [settings.onUpdate] A callback function to be called when the user moves the item around
            * @param {Object} [settings.onStop] A callback function to be called when the user commits the item to its new place ending the sorting process
            * @static
            */
            keyboardSortable: function (ulNodes, settings) {
                settings = dojoLang.mixin({
                    linkLists: false,

                    onStart: function () { },
                    onUpdate: function () { },
                    onStop: function () { }
                }, settings);

                ulNodes.each(function (index, _ulNode) {
                    var ulNode = $(_ulNode),
                        liNodes = ulNode.find("> li"),
                        //sortHandleNodes = liNodes.find(".sort-handle"),
                        isReordering = false,
                        grabbed;

                    // Reset focus, set aria attributes, and styling
                    function reorderReset(handle, liNodes, liNode) {
                        handle.focus();
                        liNodes.attr("aria-dropeffect", "move");
                        liNode.attr("aria-grabbed", "true").removeAttr("aria-dropeffect");
                    }

                    // try to remove event handlers to prevent double initialization
                    ulNode
                        .off("focusout", ".sort-handle")
                        .off("keyup", ".sort-handle");

                    ulNode
                        .on("focusout", ".sort-handle", function (event) {
                            var node = $(this).closest("li");

                            // if the list is not being reordered right now, release list item
                            if (node.hasClass("list-item-grabbed") && !isReordering) {
                                liNodes.removeAttr("aria-dropeffect");
                                node
                                    .removeClass("list-item-grabbed")
                                    .attr({ "aria-selected": false, "aria-grabbed": false });

                                grabbed = false;

                                console.log("Keyboard Sortable: OnStop -> ", event);
                                settings.onStop.call(null, event, { item: null });
                            }
                        })
                        .on("keyup", ".sort-handle", function (event) {
                            var liNode = $(this).closest("li"),
                                liId = liNode[0].id,
                                liIdArray = ulNode.sortable("toArray"),
                                liIndex = dojoArray.indexOf(liIdArray, liId);

                            // Toggle grabbed state and aria attributes (13 = enter, 32 = space bar)
                            if (event.which === 13 || event.which === 32) {
                                if (grabbed) {
                                    liNodes.removeAttr("aria-dropeffect");
                                    liNode
                                        .attr("aria-grabbed", "false")
                                        .removeClass("list-item-grabbed");

                                    console.log("Keyboard Sortable: OnStop -> ", liNode);
                                    settings.onStop.call(null, event, { item: liNode });

                                    grabbed = false;
                                } else {
                                    liNodes.attr("aria-dropeffect", "move");
                                    liNode
                                        .attr("aria-grabbed", "true")
                                        .removeAttr("aria-dropeffect")
                                        .addClass("list-item-grabbed");

                                    console.log("Keyboard Sortable: OnStart -> ", liNode);
                                    settings.onStart.call(null, event, { item: liNode });

                                    grabbed = true;
                                }
                                // Keyboard up (38) and down (40)
                            } else if (event.which === 38) {
                                if (grabbed) {
                                    // Don't move up if first layer in list
                                    if (liIndex > 0) {
                                        isReordering = true;

                                        liNode.prev().before(liNode);

                                        reorderReset($(this), liNodes, liNode);

                                        grabbed = true;
                                        liIndex -= 1;

                                        console.log("Keyboard Sortable: OnUpdate -> ", liNode);
                                        settings.onUpdate.call(null, event, { item: liNode });

                                        isReordering = false;
                                    }
                                } else {
                                    // if lists are linked, jump to the last item of the previous list, if any
                                    if (settings.linkLists &&
                                        liIndex === 0 &&
                                        index !== 0) {
                                        liNode = $(ulNodes[index - 1]).find("> li:last");
                                    } else {
                                        liNode = liNode.prev();
                                    }

                                    liNode.find(":tabbable:first").focus();
                                }
                            } else if (event.which === 40) {
                                if (grabbed) {
                                    // Don't move down if last layer in list
                                    if (liIndex < liNodes.length - 1) {
                                        isReordering = true;

                                        liNode.next().after(liNode);

                                        reorderReset($(this), liNodes, liNode);

                                        grabbed = true;
                                        liIndex += 1;

                                        console.log("Keyboard Sortable: OnUpdate -> ", liNode);
                                        settings.onUpdate.call(null, event, { item: liNode });

                                        isReordering = false;
                                    }
                                } else {
                                    // if lists are linked, jump to the first item of the next list, if any
                                    if (settings.linkLists &&
                                        liIndex === liNodes.length - 1 &&
                                        index < ulNodes.length - 1) {
                                        liNode = $(ulNodes[index + 1]).find("> li:first");
                                    } else {
                                        liNode = liNode.next();
                                    }

                                    liNode.find(":tabbable:first").focus();
                                }
                            }
                        });
                });
            },

            /**
             * Takes an array of timelines and their generator functions, clear and recreates timelines optionally preserving the play position.
             * ####Example of tls parameter
             * 
             *      [
             *          {
             *              timeline: {timeline},
             *              generator: {function}
             *          }
             *      ]
             *      
             * 
             * @method resetTimelines
             * @static
             * @param {Array} tls An array of objects containing timeline objects and their respective generator functions
             * @param {Boolean} keepPosition Indicates if the timeline should be set in the play position it was in before the reset
             */
            resetTimelines: function (tls, keepPosition) {
                var position;

                tls.forEach(function (tl) {
                    position = tl.timeLine.time(); // preserve timeline position
                    tl.timeLine.seek(0).clear();

                    tl.generator.call();

                    if (keepPosition) {
                        tl.timeLine.seek(position);
                    }
                });
            },

            /**
            * Checks if two spatial reference objects are equivalent.  Handles both wkid and wkt definitions
            *
            * @method isSpatialRefEqual
            * @static
            * @param {Esri/SpatialReference} sr1 First {{#crossLink "Esri/SpatialReference"}}{{/crossLink}} to compare
            * @param {Esri/SpatialReference} sr2 Second {{#crossLink "Esri/SpatialReference"}}{{/crossLink}} to compare
            * @return {Boolean} true if the two spatial references are equivalent.  False otherwise.
            */
            isSpatialRefEqual: function (sr1, sr2) {
                if ((sr1.wkid) && (sr2.wkid)) {
                    //both SRs have wkids
                    return sr1.wkid === sr2.wkid;
                } else if ((sr1.wkt) && (sr2.wkt)) {
                    //both SRs have wkt's
                    return sr1.wkt === sr2.wkt;
                } else {
                    //not enough info provided or mismatch between wkid and wkt.
                    return false;
                }
            },

            /**
            * Checks if the given dom node is present in the dom.
            *
            * @method containsInDom
            * @static
            * @param {Object} el DOM node to check
            * @return {Boolean} true if the given node is in the dom
            */
            containsInDom: function (el) {
                return $.contains(document.documentElement, el);
            },

            styleBrowseFilesButton: function (nodes) {
                var input,
                    button;

                function focusIn(event) {
                    event.data.button.not(".disabled").addClass("btn-focus btn-hover");
                }

                function focusOut(event) {
                    event.data.button.removeClass("btn-focus btn-hover btn-active");
                }

                function mouseEnter(event) {
                    event.data.button.not(".disabled").addClass("btn-hover");
                }

                function mouseLeave(event) {
                    event.data.button.removeClass("btn-hover btn-active");
                }

                function mouseDown(event) {
                    event.data.button.not(".disabled").addClass("btn-focus btn-hover btn-active");
                }

                function mouseUp(event) {
                    event.data.button.removeClass("btn-active");
                }

                nodes.each(function (i, node) {
                    node = $(node);
                    input = node.find("input[type='file']");
                    button = node.find(".browse-button");

                    input
                        .on("focusin", { button: button }, focusIn)
                        .on("focusout", { button: button }, focusOut)

                        .on("mouseenter", { button: button }, mouseEnter)
                        .on("mouseleave", { button: button }, mouseLeave)

                        .on("mousedown", { button: button }, mouseDown)
                        .on("mouseup", { button: button }, mouseUp)
                    ;
                });
            },

            /**
            * Detects either cell or line delimiter in a given csv data.
            *
            * @method detectDelimiter
            * @static
            * @param {String} data csv content
            * @param {String} [type] Type of the delimiter to detect. Possible values "cell" or "line". Defaults to "cell".
            * @return {String} Detected delimiter
            */
            detectDelimiter: function (data, type) {
                var count = 0,
                    detected,

                    escapeDelimiters = ['|', '^'],
                    delimiters = {
                        cell: [',', ';', '\t', '|', '^'],
                        line: ['\r\n', '\r', '\n']
                    };

                type = type !== "cell" && type !== "line" ? "cell" : type;

                delimiters[type].forEach(function (delimiter) {
                    var needle = delimiter,
                        matches;

                    if (escapeDelimiters.indexOf(delimiter) !== -1) {
                        needle = '\\' + needle;
                    }

                    matches = data.match(new RegExp(needle, 'g'));
                    if (matches && matches.length > count) {
                        count = matches.length;
                        detected = delimiter;
                    }
                });

                console.log(type + " delimiter detected: '" + (detected || delimiters[type][0]) + "'");

                return (detected || delimiters[type][0]);
            },

            /**
            * Converts HEX colour to RGB.
            * http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb/5624139#5624139
            *
            * @method hexToRgb
            * @static
            * @param {String} hex hex colour code
            * @return {Object} object containing r, g, and b components of the supplied colour
            */
            hexToRgb: function (hex) {
                // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
                var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
                hex = hex.replace(shorthandRegex, function (m, r, g, b) {
                    return r + r + g + g + b + b;
                });

                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : null;
            },

            /**
            * Converts RGB colour to HEX.
            * http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb/5624139#5624139
            *
            * @method rgbToHex
            * @static 
            * @param {Number} r r component
            * @param {Number} g g component
            * @param {Number} b b component
            * @return {Object} hex colour code 
            */
            rgbToHex: function (r, g, b) {
                return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            },

            resetFormElement: function (e) {
                e.wrap('<form>').closest('form').get(0).reset();
                e.unwrap();
            },

            setSelectOptions: function (select, options, append) {
                //var optionsNode;

                if (!append) {
                    select.empty();
                    //select.append(optionsNode);
                }

                options.forEach(function (option) {
                    select.append($("<option/>", {
                        value: option.value,
                        text: option.text
                    }));
                });
            },

            // https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_.22Unicode_Problem.22
            /**
             * Base64 encoding for unicode text.
             * 
             * @method b64EncodeUnicode
             * @param {String} str a string to encode
             * @return {String} encoded string
             */
            b64EncodeUnicode: function (str) {
                return new Btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
                    return String.fromCharCode('0x' + p1);
                })).a;
            }
        };
    });