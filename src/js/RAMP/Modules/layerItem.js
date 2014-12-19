/* global define, tmpl, console */

/**
* @module Utils
*/

/**
* Wraps the specified checkbox input nodes to provide an alternative rendering of checkbox without compromising
* its functionality. Handles synchronization of the checkbox's state with its new rendering.
* Also adds highlight/unhighlight on focus/unfocus, update label when checked/unchecked
*
*
* @class LayerItem
* @constructor
* @uses dojo/Evented
* @uses dojo/_base/declare
* @uses dojo/lang
*
* @param {jObject} node a jQuery object representing the input checkbox node to be wrapped
* @param {Object} [options] Additional options
* @param {String} [options.nodeIdAttr] Name of the "data-*" attribute set on the checkbox node to be treated as the checkbox id. If no appropriate "data-*" attribute found,
* `nodeIdAttr` is used directly, failing that, regular `id` is used.
* @param {Object} [options.cssClass] `active`, `focus`, and `check` CSS class to be applied to the Checkbox correspondingly.
* @param {Object} [options.cssClass.active] CSS class to be set when the Checkbox is `active`.
* @param {Object} [options.cssClass.focus] CSS class to be set when the Checkbox is `focused`.
* @param {Object} [options.cssClass.check] CSS class to be set when the Checkbox is `checked`.
* @param {Object} [options.label] `check` and `uncheck` label texts to be applied to the Checkbox labels.
* @param {Object} [options.label.check] A text to be set as a label when the Checkbox is `checked`
* @param {Object} [options.label.uncheck] A text to be set as a label when the Checkbox is `unchecked`
* @param {Function} [options.onChnage] A function to be called when the state of the Checkbox changes.
*
* @return {Checkbox} A control objects allowing to toggle checkbox.
*/

define([
    "dojo/Evented", "dojo/_base/declare", "dojo/_base/lang",

    /* Text */
    "dojo/text!./templates/layer_selector_template.json",

    /* Util */
    "utils/tmplHelper", "utils/tmplUtil"
],
    function (
        Evented, declare, lang,
        layer_selector_template,
        TmplHelper, TmplUtil
    ) {
        "use strict";

        var LayerItem;

        LayerItem = declare([Evented], {
            constructor: function (config, options) {
                //var that = this;

                // declare individual properties inside the constructor: http://dojotoolkit.org/reference-guide/1.9/dojo/_base/declare.html#id6
                lang.mixin(this,
                    {
                        config: null,

                        node: null,

                        templates: JSON.parse(TmplHelper.stringifyTemplate(layer_selector_template)),

                        state: LayerItem.state.DEFAULT,

                        type: null                       
                    },
                    options,
                    {
                        config: config
                    }
                );

                this.node = this._template(this.type, this.config);

                console.debug(temp++);

                this.setState(this.state);
            },

            _template: function (key, data) {
                tmpl.cache = {};
                tmpl.templates = this.templates;

                data = data || {};
                data.fn = TmplUtil;

                return tmpl(key, data);
            },

            setState: function (state) {
                switch (state) {
                    case LayerItem.state.LOADING: 
                        console.log("load");
                        break;

                    case LayerItem.state.ERROR:
                        console.log("error");
                        break;

                    case LayerItem.state.SCALE:
                        console.log("scale");
                        break;

                    default:
                        break;
                }
            }
        });
        
        lang.mixin(LayerItem,
            {
                state: {
                    DEFAULT: "default",
                    LOADING: "loading",
                    ERROR: "load_error",
                    SCALE: "wrong_scale"
                }
            }
        );
        
        return LayerItem;
    });