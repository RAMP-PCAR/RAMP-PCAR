/* global define, tmpl, $, console */

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

        var LayerItem,
            ALL_STATES_CLASS;

        LayerItem = declare([Evented], {
            constructor: function (config, options) {
                //var that = this;

                this.stateMatrix = {};
                this.stateMatrix[LayerItem.state.DEFAULT] = {
                    controls: ["metadata", "settings"],
                    toggles: ["eye", "box"]
                };

                this.stateMatrix[LayerItem.state.LOADING] = {
                    controls: ["loading"],
                    toggles: []
                };

                this.stateMatrix[LayerItem.state.ERROR] = {
                    controls: ["error"],
                    toggles: ["reload", "hide"]
                };

                this.stateMatrix[LayerItem.state.OFF_SCALE] = {
                    controls: ["metadata", "settings"],
                    toggles: ["zoom", "eye", "box"]
                };
                
                // declare individual properties inside the constructor: http://dojotoolkit.org/reference-guide/1.9/dojo/_base/declare.html#id6
                lang.mixin(this,
                    {
                        id: null,

                        node: null,

                        _config: null,

                        _imageContainerNode: null,
                        _displayNameNode: null,
                        _controlsNode: null,
                        _togglesNode: null,

                        templates: JSON.parse(TmplHelper.stringifyTemplate(layer_selector_template)),

                        state: LayerItem.state.DEFAULT,

                        type: null
                    },
                    options,
                    {
                        id: config.id,

                        _config: config
                    }
                );

                this.node = $(this._template(this.type, this._config));
                this._imageBoxNode = this.node.find(".layer-details > div:first");
                this._displayNameNode = this.node.find(".layer-name > span");
                this._controlsNode = this.node.find(".layer-controls-group");
                this._togglesNode = this.node.find(".layer-checkboxes");

                this.setState(this.state, null, true);

                console.debug("-->", this.state, options);
            },

            setState: function (state, options, force) {
                if (this.state !== state || force) {
                    this.state = state;

                    // set state class on the layerItem root node
                    this.node
                        .removeClass(ALL_STATES_CLASS)
                        .addClass(this.state);

                    this._setControlsGroup();
                    this._setTogglesGroup();

                    switch (this.state) {
                        case LayerItem.state.DEFAULT:
                            console.log("default");
                            break;

                        case LayerItem.state.LOADING:
                            console.log("load");
                            break;

                        case LayerItem.state.ERROR:
                            console.log("error");
                            break;

                        case LayerItem.state.OFF_SCALE:
                            console.log("scale");
                            break;

                        default:
                            break;
                    }
                }
            },

            _setControlsGroup: function () {
                var that = this;

                this._controlsNode
                    .empty()
                    .append(
                        this._template("layer_controls",
                            {
                                id: that.id,
                                controls: that.stateMatrix[that.state].controls
                            }
                        )
                );
            },

            _setTogglesGroup: function () {
                var that = this;

                this._togglesNode
                    .empty()
                    .append(
                        this._template("layer_toggles",
                            {
                                id: that.id,
                                toggles: that.stateMatrix[that.state].toggles
                            }
                        )
                );
            },

            _template: function (key, data) {
                tmpl.cache = {};
                tmpl.templates = this.templates;

                data = data || {};
                data.fn = TmplUtil;

                return tmpl(key, data);
            }
        });

        lang.mixin(LayerItem,
            {
                state: {
                    DEFAULT: "layer-state-default",
                    LOADING: "layer-state-loading",
                    ERROR: "layer-state-load-error",
                    INFO: "layer-state-info",
                    OFF_SCALE: "layer-state-off-scale"
                }
            }
        );

        ALL_STATES_CLASS =
            Object
                .getOwnPropertyNames(LayerItem.state)
                .map(function (key) { return LayerItem.state[key]; })
                .join(" ");

        return LayerItem;
    });