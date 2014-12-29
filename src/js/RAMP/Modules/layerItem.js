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
    "utils/tmplHelper", "utils/tmplUtil", "utils/array"
],
    function (
        Evented, declare, lang,
        layer_selector_template,
        TmplHelper, TmplUtil, UtilArray
    ) {
        "use strict";

        var LayerItem,
            ALL_STATES_CLASS;

        LayerItem = declare([Evented], {
            constructor: function (config, options) {
                //var that = this;

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

                        _controlStore: {},
                        _toggleStore: {},
                        _noticeStore: {},

                        templates: JSON.parse(TmplHelper.stringifyTemplate(layer_selector_template)),

                        state: LayerItem.state.DEFAULT,

                        type: null
                    },
                    options,
                    {
                        id: config.id,

                        _config: config,

                        stateMatrix: lang.mixin(
                            lang.clone(LayerItem.stateMatrix),
                            options.stateMatrix
                        )
                    }
                );

                this.node = $(this._template(this.type, this._config));
                this._imageBoxNode = this.node.find(".layer-details > div:first");
                this._displayNameNode = this.node.find(".layer-name > span");
                this._controlsNode = this.node.find(".layer-controls-group");
                this._togglesNode = this.node.find(".layer-checkboxes");
                this._noticesNode = this.node.find(".layer-notices");

                this._generateParts("controls", "layer_control_", this._controlStore);
                this._generateParts("toggles", "layer_toggle_", this._toggleStore);
                this._generateParts("notices", "layer_notice_", this._noticeStore);

                this.setState(this.state, null, true);

                console.debug("-->", this.state, options);
            },

            _generateParts: function (partType, templateKey, partStore) {
                var that = this,

                    stateKey,
                    partKeys = [],
                    control;

                Object
                    .getOwnPropertyNames(LayerItem.state)
                    .forEach(function (s) {
                        stateKey = LayerItem.state[s];
                        partKeys = partKeys.concat(LayerItem.stateMatrix[stateKey][partType]);
                    });

                partKeys = UtilArray.unique(partKeys);

                partKeys.forEach(function (pKey) {
                    control = $(that._template(templateKey + pKey,
                        {
                            id: that.id,
                            config: that._config,
                            nameKey: pKey
                        }
                    ));

                    partStore[pKey] = (control);
                });
            },

            setState: function (state, options, force) {
                var allowedStates = LayerItem.transitionMatrix[this.state];

                //if (this.state !== state || force) {

                    if (allowedStates.indexOf(state) !== -1 || force) {

                        this.state = state;
                        //lang.mixin(this, options);

                        // set state class on the layerItem root node
                        this.node
                            .removeClass(ALL_STATES_CLASS)
                            .addClass(this.state);

                        this._setParts("controls", this._controlStore, this._controlsNode);
                        this._setParts("toggles", this._toggleStore, this._togglesNode);
                        this._setParts("notices", this._noticeStore, this._noticesNode);

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

                        return true;
                    } else {
                        return false;
                    }
                //}
            },

            _setParts: function (partType, partStore, target) {
                var controls = [];

                this.stateMatrix[this.state][partType].forEach(function (pKey) {
                    controls.push(partStore[pKey]);
                });
                 
                target
                    .empty()
                    .append(controls);
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
                    OFF_SCALE: "layer-state-off-scale"
                },

                stateMatrix: {},

                transitionMatrix: {}
            }
        );

        LayerItem.stateMatrix[LayerItem.state.DEFAULT] = {
            controls: ["metadata", "settings"],
            toggles: ["eye", "box"],
            notices: []
        };

        LayerItem.stateMatrix[LayerItem.state.LOADING] = {
            controls: ["loading"],
            toggles: [],
            notices: []
        };

        LayerItem.stateMatrix[LayerItem.state.ERROR] = {
            controls: ["error"],
            toggles: ["reload", "hide"],
            notices: []
        };

        LayerItem.stateMatrix[LayerItem.state.OFF_SCALE] = {
            controls: ["metadata", "settings"],
            toggles: ["zoom", "eye", "box"],
            notices: ["scale"]
        };

        LayerItem.transitionMatrix[LayerItem.state.DEFAULT] = [
            LayerItem.state.ERROR,
            LayerItem.state.OFF_SCALE
        ];

        LayerItem.transitionMatrix[LayerItem.state.LOADING] = [
            LayerItem.state.ERROR,
            LayerItem.state.DEFAULT,
            LayerItem.state.OFF_SCALE
        ];

        LayerItem.transitionMatrix[LayerItem.state.ERROR] = [
            LayerItem.state.LOADING
        ];

        LayerItem.transitionMatrix[LayerItem.state.OFF_SCALE] = [
            LayerItem.state.ERROR,
            LayerItem.state.DEFAULT
        ];

        ALL_STATES_CLASS =
            Object
                .getOwnPropertyNames(LayerItem.state)
                .map(function (key) { return LayerItem.state[key]; })
                .join(" ");

        return LayerItem;
    });