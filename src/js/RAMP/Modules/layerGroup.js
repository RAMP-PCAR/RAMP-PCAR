/* global define, tmpl, $, console */

/**
* @module 
*/

/**
*
*
* @class LayerGroup
* @constructor
* @uses dojo/Evented
* @uses dojo/_base/declare
* @uses dojo/_base/lang
* @uses dojo/_base/array
* @uses Checkbox
*
* @param {JArray} nodes a jQuery object representing the checkboxes to be grouped
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
* @param {Object} [options.master] Additional options applied to the master Checkbox.
* @param {Object} [options.master.node] An `input` node to serve as the master Checkbox for the group.
* @param {Object} [options.master.cssClass] `active`, `focus`, and `check` CSS class to be applied to the master Checkbox correspondingly.
* @param {Object} [options.master.cssClass.active] CSS class to be set when the Checkbox is `active`.
* @param {Object} [options.master.cssClass.focus] CSS class to be set when the master Checkbox is `focused`.
* @param {Object} [options.master.cssClass.check] CSS class to be set when the master Checkbox is `checked`.
* @param {Object} [options.master.label] `check` and `uncheck` label texts to be applied to the master Checkbox labels.
* @param {Object} [options.master.label.check] A text to be set as a label when the master Checkbox is `checked`
* @param {Object} [options.master.label.uncheck] A text to be set as a label when the master Checkbox is `unchecked`
* @param {Function} [options.master.onChnage] A function to be called when the state of the master Checkbox changes.
*
* @return {CheckboxGroup} A control objects allowing to toggle individual checkboxes in a group as well as the group as a whole.
*/

define([
    "dojo/Evented", "dojo/_base/declare", "dojo/_base/lang", "dojo/_base/array",

    /* Text */
    "dojo/text!./templates/layer_selector_template.json",

    /* Util */
    "utils/tmplHelper", "utils/array",

    /* RAMP */
    "ramp/layerItem"
],
    function (
        Evented, declare, lang, dojoArray,
        layer_selector_template,
        TmplHelper, Array,
        LayerItem) {
        "use strict";

        return declare([Evented], {
            constructor: function (layers, options) {
                var that = this;//,
                //layerItem;

                // declare individual properties inside the constructor: http://dojotoolkit.org/reference-guide/1.9/dojo/_base/declare.html#id6
                lang.mixin(this,
                    {
                        node: null,
                        _listNode: null,

                        templates: JSON.parse(TmplHelper.stringifyTemplate(layer_selector_template)),

                        groupType: "layer_group",

                        layerType: null,

                        layerState: LayerItem.state.DEFAULT,

                        layers: [],

                        layerItems: []
                    },
                    options,
                    {
                        layers: layers
                    }
                );

                this.node = $(this._template(this.groupType));
                this._listNode = this.node.find("ul");

                console.debug(LayerItem.state);

                this.layers.forEach(function (layer) {
                    that.addLayer(layer);

                    //layerItem = new LayerItem(layer, layerItemOptions);
                    //that.layerItems.push(layerItem);

                    //that._listNode.append(layerItem.node);
                });
            },

            addLayer: function (layer, options) {
                var layerItem,
                    layerItemOptions = {
                        stateMatrix: this._constructStateMatrix(layer)
                    };
                
                lang.mixin(layerItemOptions,
                    {
                        state: this.layerState
                    },
                    options,
                    {
                        type: this.layerType
                    }
                );

                layerItem = new LayerItem(layer, layerItemOptions);

                this.layerItems.push(layerItem);
                this._listNode.append(layerItem.node);

                //layerItem.setState(LayerItem.state.ERROR);
            },

            _constructStateMatrix: function (layerConfig) {
                var stateMatrix = lang.clone(LayerItem.stateMatrix),
                    settingsKey = "settings",
                    boxKey = "box",
                    placeholderKey = "placeholder";
                                
                if (!layerConfig.settings.panelEnabled) {
                    Array.removeFromArray(stateMatrix[LayerItem.state.DEFAULT].controls, settingsKey);
                    Array.removeFromArray(stateMatrix[LayerItem.state.OFF_SCALE].controls, settingsKey);
                }

                if (!layerConfig.layerExtent) {
                    Array.removeFromArray(stateMatrix[LayerItem.state.DEFAULT].toggles, boxKey);
                    stateMatrix[LayerItem.state.DEFAULT].toggles.push(placeholderKey);

                    Array.removeFromArray(stateMatrix[LayerItem.state.OFF_SCALE].toggles, boxKey);
                    stateMatrix[LayerItem.state.OFF_SCALE].toggles.push(placeholderKey);
                }

                return stateMatrix;
            },

            setState: function (layerId, state) {
                var layerItem;

                layerItem = Array.find(this.layerItems, function (li) {
                    return li.id === layerId;
                });

                if (layerItem) {
                    layerItem.setState(state);
                }
            },

            _template: function (key, data) {
                tmpl.cache = {};
                tmpl.templates = this.templates;

                data = data || {};

                return tmpl(key, data);
            }
        });
    });