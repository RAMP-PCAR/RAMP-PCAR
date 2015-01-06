﻿/* global define, tmpl, $, console */

/**
* @module RAMP
* @submodule FilterManager
* @main FilterManager
*/

/**
* 
* ####Imports RAMP Modules:
* {{#crossLink "TmplHelper"}}{{/crossLink}}  
* {{#crossLink "Array"}}{{/crossLink}}  
* {{#crossLink "LayerItem"}}{{/crossLink}}  
*  
* ####Uses RAMP Templates:
* {{#crossLink "templates/layer_selector_template.json"}}{{/crossLink}}
* 
* @class LayerGroup
* @constructor
* @uses dojo/Evented
* @uses dojo/_base/declare
* @uses dojo/_base/lang
* @uses dojo/_base/array
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
* @return {LayerGroup} A control objects allowing to toggle individual checkboxes in a group as well as the group as a whole.
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
                var that = this;

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
                    that.addLayerItem(layer);
                });
            },

            addLayerItem: function (layer, options) {
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
            },

            _constructStateMatrix: function (layerConfig) {
                var stateMatrix = lang.clone(LayerItem.stateMatrix);

                if (!layerConfig.settings.panelEnabled) {
                    Array.remove(stateMatrix[LayerItem.state.DEFAULT].controls, LayerItem.controls.SETTINGS);
                    Array.remove(stateMatrix[LayerItem.state.OFF_SCALE].controls, LayerItem.controls.SETTINGS);
                }

                // remove bounding box toggle if there is no layer extent property - layer is a wms layer
                if (!layerConfig.layerExtent) {
                    Array.remove(stateMatrix[LayerItem.state.DEFAULT].toggles, LayerItem.toggles.BOX);
                    stateMatrix[LayerItem.state.DEFAULT].toggles.push(LayerItem.toggles.PLACEHOLDER);

                    Array.remove(stateMatrix[LayerItem.state.OFF_SCALE].toggles, LayerItem.toggles.BOX);
                    stateMatrix[LayerItem.state.OFF_SCALE].toggles.push(LayerItem.toggles.PLACEHOLDER);
                }

                return stateMatrix;
            },

            setState: function (layerId, state, options) {
                var layerItem = this.getLayerItem(layerId);

                if (layerItem) {
                    layerItem.setState(state, options);
                }
            },

            getLayerItem: function (layerId) {
                var layerItem;

                layerItem = Array.find(this.layerItems, function (li) {
                    return li.id === layerId;
                });

                return layerItem;
            },

            _template: function (key, data) {
                tmpl.cache = {};
                tmpl.templates = this.templates;

                data = data || {};

                return tmpl(key, data);
            }
        });
    });