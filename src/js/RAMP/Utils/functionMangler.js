/* global define, console */

/**
* Utility module containing useful static classes.
*
* @module Utils
*/

/**
* ??? Description
*
* ####Imports RAMP Modules:
* {{#crossLink "Util"}}{{/crossLink}}  
*
* @class FunctionMangler
* @static
* @uses dojo/on
* @uses dojo/_base/lang
* @uses dojo/topic
*/

define([
/* Dojo */
        "dojo/topic", "dojo/_base/lang", "dojo/on",

/* Utils */
        "utils/util"
],

    function (
    /* Dojo */
        topic, dojoLang, dojoOn,

    /* Utils */
        UtilMisc) {
        "use strict";

        /**
        * [_initDojoPrototype description] Adds following extensions:
        * - `topic.subscrive(name, listener, scope)` - An extension of dojoLang.subscribe that allows the callback function to be
        * hitched with the given scope.
        * - `dojoOn(target, type, listener, scope)` -
        *
        *
        * @method _initDojoPrototype
        * @private
        */
        function _initDojoPrototype() {
            var originalOn = dojoOn;
            dojoOn = function (target, type, listener, scope) {
                if (UtilMisc.isUndefined(scope)) {
                    return originalOn(target, type, listener);
                } else {
                    return originalOn(target, type, dojoLang.hitch(scope, listener));
                }
            };

            var originalSubscribe = topic.subscribe;
            topic.subscribe = function (eventName, listener) {
                if (UtilMisc.isUndefined(eventName)) {
                    console.error("Trying to subscribe to an undefined event");
                    console.trace();
                } else {
                    return originalSubscribe(eventName, listener);
                }
            };
        }

        return {
            /**
            * [load description]
            *
            * @method load
            * @param  {[type]} id      [description]
            * @param  {[type]} require [description]
            * @param  {[type]} load    [description]
            * @return {[type]}         [description]
            */
            load: function (id, require, load) {
                _initDojoPrototype();

                load();
            }
        };
    });