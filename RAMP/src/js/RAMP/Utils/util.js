/* global define, window, XMLHttpRequest, ActiveXObject, XSLTProcessor */
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
*/
define(["dojo/_base/array", "dojo/_base/lang", "dojo/topic", "dojo/Deferred", "esri/geometry/Extent"],
    function (dojoArray, dojoLang, topic, Deferred, Extent) {
        "use strict";

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
                var noop = function () { };
                var methods = [
                    'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
                    'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
                    'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
                    'timeStamp', 'trace', 'warn'
                ];
                var length = methods.length;
                var console = (window.console = window.console || {});

                var method;
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
            * This will effectively cause the String to be displayed in plain text when embedded in an html page.
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
            afterAll: function (deferredList, callback) {
                if (deferredList.length === 0) {
                    callback();
                    return;
                }

                var completed = 0; // Keeps track of the number of deferred that has resolved
                dojoArray.forEach(deferredList, function (deferred) {
                    deferred.then(function () {
                        completed++;
                        if (completed === deferredList.length) {
                            callback();
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
            * Subscrives to a set of events, executes the callback when any of the events fire, then removes the handle.
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
            * @return {Object} The lazy varialbe
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
                    oneKey = oneLayer.url + one.attributes[objectIdField];
                    twoKey = twoLayer.url + two.attributes[objectIdField];
                }

                return oneKey === twoKey;
            },

            /**
            * Wraps the specified checkboxes to provide an alternative rendering of checkboxes without compromising their functionality.
            * Handles synchronisation of the checkbox's state with its new rendering.
            * Also adds highlight/unhighlight on focus/unfocus, update label when checked/unchecked
            *
            * @method styleCheckboxes
            * @static
            * @param {jObject} nodes An array of jQuery objects
            * @param {String} checkedClass Name of the CSS class to be used when checked
            * @param {String} focusedClass Name of the CSS class to be used when focused
            * @param {object} labels An object containing labels' text { checked: "label when checked", unchecked: "label when unchecked" }
            * @return {CheckboxWrapper} A control objects allowing to toggle checkboxes supplying a state, and retrieve original checkbox nodes
            */
            styleCheckboxes: function (nodes, checkedClass, focusedClass, labels) {
                /**
                * A wrapper class for styled checkboxes that allows to set their states individually and en masse.
                *
                * @class CheckboxWrapper
                * @constructor
                * @for Util
                * @type {Object}
                */
                var checkboxWrapperTemplate = {
                    /**
                    * Toggle the state of checkboxes.
                    *
                    * @method setAll
                    * @param {boolean} state Specifies the state of the checkbox: true, false
                    * @return {object} Control object for chaining
                    * @chainable
                    * @for CheckboxWrapper
                    */
                    setAll: function (state) {
                        _toggleState(function () {
                            return state;
                        });

                        return this;
                    },

                    /**
                    * Toggles the checkboxes based on the return value of the given fcn.
                    *
                    * @method setState
                    * @param {function} fcn A function to be run on each of the nodes to determine the state to be set
                    * @return {object} Control object for chaining
                    * @chainable
                    */
                    setState: function (fcn) {
                        _toggleState(fcn);

                        return this;
                    },

                    /**
                    * Returns original checkbox nodes.
                    *
                    * @method getNodes
                    * @return {jObject} original checkbox nodes
                    */
                    getNodes: function () {
                        return nodes;
                    }
                };
                /*
                * Goes through an array of checkboxes and if any are selected, add the "checked" css class to
                * the label so it displays visually matches the changed state
                * @method _toggleLabels
                * @param {Object} objs An array of checkboxes to toggle
                */
                function _toggleLabels(objs) {
                    var label;

                    objs.each(function (i, obj) {
                        var node = $(obj),
                            newText;
                        label = node.findInputLabel();
                        if (node.is(':checked')) {
                            newText = String.format(labels.checked,
                                label.data("label-name"));
                            label
                                .addClass(checkedClass)
                                .prop('title', newText)
                                .find("> span").text(newText);
                        } else {
                            newText = String.format(labels.unchecked,
                                label.data("label-name"));
                            label
                                .removeClass(checkedClass)
                                .prop('title', newText)
                                .find("> span").text(newText);
                        }
                    });
                }
                /*
                * Goes through an array of checkboxes and toggles their checked state value
                * @method _toggleState
                * @param {Object} fcn An Array of checkboxes
                *
                */
                function _toggleState(fcn) {
                    nodes.each(function () {
                        $(this).prop('checked', fcn($(this)));
                    });

                    _toggleLabels(nodes);
                }

                nodes
                    .on("change", function () {
                        _toggleLabels($(this));
                    })
                    .on("focus", function () {
                        $(this).findInputLabel().addClass(focusedClass);
                    })
                    .on("focusout", function () {
                        $(this).findInputLabel().removeClass(focusedClass);
                    });

                _toggleLabels(nodes);

                return Object.create(checkboxWrapperTemplate);
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
            * if so, offset the content horizontally to accomodate for the scrollbar assuming target's width is
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
            * @param {function} func A function whose availability in question
            * @param {function} callback The callback function to be executed after func is available
            */
            executeOnLoad: function (target, func, callback) {
                var deferred = new Deferred(),
                    handle;

                deferred.then(function () {
                    window.clearInterval(handle);
                    console.log("deffered resolved");

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
            * @param {Object} map The map control
            * @param {Object} point The location on screen (X/Y coordinates)
            * @param {Number} toleranceInPixel A value indicating how many screen pixels the extent should be from the point
            * @returns {Object} a new extent calculated from the given parameters
            *
            */
            pointToExtent: function (map, point, toleranceInPixel) {
                var pixelWidth = map.extent.getWidth() / map.width;
                var toleraceInMapCoords = toleranceInPixel * pixelWidth;
                return new Extent(point.x - toleraceInMapCoords,
                              point.y - toleraceInMapCoords,
                              point.x + toleraceInMapCoords,
                              point.y + toleraceInMapCoords,
                              map.spatialReference);
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
            transformXML: function (xmlurl, xslurl, callback, returnFragment) {
                var xmld = new Deferred(),
                    xsld = new Deferred(),
                    xml, xsl,
                    dlist = [xmld, xsld],
                    result,
                    xsltProcessor;

                function loadXMLFileIE(filename) {
                    var xhttp;

                    if (window.ActiveXObject) {
                        xhttp = new ActiveXObject("Msxml2.XMLHTTP");
                    } else {
                        xhttp = new XMLHttpRequest();
                    }
                    xhttp.open("GET", filename, false);
                    try {
                        xhttp.responseType = "msxml-document";
                    } catch (err) { } // Helping IE11
                    xhttp.send("");
                    return xhttp.responseXML;
                }

                this.afterAll(dlist, function () {
                    xsltProcessor = new XSLTProcessor();
                    xsltProcessor.importStylesheet(xsl);
                    result = xsltProcessor.transformToFragment(xml, document);

                    // turne a document fragment into a proper jQuery object
                    if (!returnFragment) {
                        result = ($('body')
                            .append(result)
                            .children().last())
                            .detach();
                    }

                    callback(result);
                });

                if (window.ActiveXObject || window.hasOwnProperty("ActiveXObject")) {
                    // second part is for IE11 benefit - for some reason it fail the first check
                    xml = loadXMLFileIE(xmlurl);
                    xsl = loadXMLFileIE(xslurl);

                    var xslt = new ActiveXObject("Msxml2.XSLTemplate"),
                        xmlDoc = new ActiveXObject("Msxml2.DOMDocument"),
                        xslDoc = new ActiveXObject("Msxml2.FreeThreadedDOMDocument"),
                        xslProc;

                    xmlDoc.loadXML(xml.xml);
                    xslDoc.loadXML(xsl.xml);
                    xslt.stylesheet = xslDoc;
                    xslProc = xslt.createProcessor();
                    xslProc.input = xmlDoc;
                    xslProc.transform();

                    callback(xslProc.output);
                } else {
                    $.ajax({
                        type: "GET",
                        url: xmlurl,
                        dataType: "xml",
                        cache: false,
                        success: function (data) {
                            xml = data;
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
                        }
                    });
                }
            }
        };
    });