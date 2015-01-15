/* global define, tmpl, $, console */

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
* @param {Array} layers an array of layer config definitions to be added to the group
* @param {Object} [options] Additional options
* 
* @param {String} [options.groupType] Specifies type of this LayerGroup and the name of the layer group template to use
* @param {String} [options.layerState] Specifies the initial state of any LyerItem added to this group; must be one of the `LayerItem.state` defaults
* @param {String} [options.layerType] Specifies type of any LayerItem added to this group and the name of the layer item template to use
* 
* @param {Object} [options.stateMatrix] additional state matrix records to be mixed into the default
* @param {Object} [options.transitionMatrix] additional state transition matrix records to be mixed into the default

*
* @return {LayerGroup} A control object representing a group of layers allowing to dynamically change their states.
*/

define([
    "dojo/Evented", "dojo/_base/declare", "dojo/_base/lang", "dojo/_base/array",

    /* Text */
    "dojo/text!./templates/layer_selector_template.json",

    /* Util */
    "utils/tmplHelper", "utils/array", "utils/dictionary",

    /* RAMP */
    "ramp/layerItem"
],
    function (
        Evented, declare, lang, dojoArray,
        layer_selector_template,
        TmplHelper, UtilArray, UtilDict,
        LayerItem) {
        "use strict";

        return declare([Evented], {
            constructor: function (layers, options) {
                var that = this;

                // declare individual properties inside the constructor: http://dojotoolkit.org/reference-guide/1.9/dojo/_base/declare.html#id6
                lang.mixin(this,
                    {
                        /**
                         * A node of the LayerGroup.
                         *
                         * @property node
                         * @type JObject
                         * @default null
                         */
                        node: null,

                        /**
                         * A node of the list in the LayerGroup.
                         *
                         * @property node
                         * @private
                         * @type JObject
                         * @default null
                         */
                        _listNode: null,

                        /**
                         * Templates to be used in construction of the layer nodes.
                         *
                         * @property templates
                         * @type Object
                         * @default layer_selector_template.json
                         */
                        templates: JSON.parse(TmplHelper.stringifyTemplate(layer_selector_template)),

                        /**
                         * Specifies type of this LayerGroup and the name of the layer group template to use; is set by `groupType` value;
                         *
                         * @property groupType
                         * @type String
                         * @default "layer_group"
                         */
                        groupType: "layer_group",

                        /**
                         * Specifies type of any LayerItem added to this group during initialization and the name of the layer item template to use; is set by `layerType` value;; can be overwritten when adding individual layers by `options.type`.
                         *
                         * @property type
                         * @type String
                         * @default null
                         */
                        layerType: null,

                        /**
                         * State of any LayerItem added to this group during its initialization; is set by `layerSate` value; can be overwritten when adding individual layers by `options.state`.
                         *
                         * @property state
                         * @type String
                         * @default LayerItem.state.DEFAULT
                         */
                        layerState: LayerItem.state.DEFAULT,

                        /**
                         * An array of layer config definitions to be added to the group during initialization; is set to `layers` value.
                         *
                         * @property layers
                         * @type Array
                         * @default []
                         */
                        layers: [],

                        /**
                         * An array of resulting LayerItem objects.
                         *
                         * @property layerItems
                         * @type Array
                         * @default []
                         */
                        layerItems: []
                    },
                    options,
                    {
                        layers: layers
                    }
                );

                // create group node from the template
                this.node = $(this._template(this.groupType));
                this._listNode = this.node.find("ul");

                console.debug(LayerItem.state);

                this.layers.forEach(function (layer) {
                    that.addLayerItem(layer);
                });
            },

            /**
             * Constructs and adds a LayerItem to the LayerGroup.
             *
             * @param {Object} layer config of the layer to be added
             * @param {Object} options additional options allowing for customization
             * @method addLayerItem
             * @return {Object} the item that was added
             */
            addLayerItem: function (layer, options) {
                var layerItem,
                    layerItemOptions = {
                        stateMatrix: this._constructStateMatrix(layer)
                    };

                lang.mixin(layerItemOptions,
                    {
                        state: this.layerState,
                        type: this.layerType
                    },
                    options
                );

                layerItem = new LayerItem(layer, layerItemOptions);

                this.layerItems.push(layerItem);
                this._listNode.prepend(layerItem.node);

                if (this.layerItems.length === 1) {
                    this.node.show();
                }

                return layerItem;
            },

            /**
             * Removes the specified LayerItem from the LayerGroup.
             *
             * @param {String} layerId id of the layer to be removed
             * @method removeLayerItem
             * @return {Object} this LayerGroup for chaining
             */
            removeLayerItem: function (layerId) {
                var layerItem = this.getLayerItem(layerId);

                // remove layerItem from DOM
                layerItem.node.remove();

                // remove layerItem from the list
                UtilArray.remove(this.layerItems, layerItem, function (l) {
                    return l.id === layerItem.id;
                });

                if (this.layerItems.length === 0) {
                    this.node.hide();
                }

                return this;
            },

            /**
             * Modifies the state matrix of the layer to accommodate types of layers that might not use/have all the default controls or have extra controls.
             *
             * @param {Object} layerConfig layer config
             * @method _constructStateMatrix
             * @private
             * @return {Object} modified layer state matrix
             */
            _constructStateMatrix: function (layerConfig) {
                var stateMatrix = lang.clone(LayerItem.stateMatrix);

                if (!layerConfig.settings.panelEnabled) {
                    this._removeStateMatrixPart(stateMatrix, "controls", LayerItem.controls.SETTINGS);
                }

                // remove bounding box toggle if there is no layer extent property - layer is a wms layer
                if (!layerConfig.layerExtent) {
                    this._removeStateMatrixPart(stateMatrix, "toggles", LayerItem.toggles.BOX);
                    this._addStateMatrixPart(stateMatrix, "toggles", LayerItem.toggles.PLACEHOLDER);
                }

                return stateMatrix;
            },

            /**
             * Modifies the state matrix by adding specified partKey to the specified partType collection
             *
             * @param {Object} stateMatrix matrix to modify
             * @param {String} partType type of the parts to modify: `controls`, `toggles`, `notices`
             * @param {String} partKey part key to be inserted into the collection
             * @method _addStateMatrixPart
             * @private
             */
            _addStateMatrixPart: function (stateMatrix, partType, partKey) {
                UtilDict.forEachEntry(stateMatrix, function (state, data) {
                    data[partType].push(partKey);
                });
            },

            /**
             * Modifies the state matrix by removing specified partKey to the specified partType collection
             *
             * @param {Object} stateMatrix matrix to modify
             * @param {String} partType type of the parts to modify: `controls`, `toggles`, `notices`
             * @param {String} partKey part key to be removed into the collection
             * @method _addStateMatrixPart
             * @private
             */
            _removeStateMatrixPart: function (stateMatrix, partType, partKey) {
                UtilDict.forEachEntry(stateMatrix, function (state, data) {
                    UtilArray.remove(data[partType], partKey);
                });
            },

            /**
             * Constructs and adds a LayerItem to the LayerGroup.
             *
             * @param {String} layerId an id of the LayerItem to set the state on
             * @param {String} state state to be set; must be one of the `LayerItem.state` defaults
             * @param {Object} options additional options allowing for customization
             * @method setState
             */
            setState: function (layerId, state, options) {
                var layerItem = this.getLayerItem(layerId);

                if (layerItem) {
                    layerItem.setState(state, options);
                }
            },

            /**
             * Finds and returns a LayerItem object with the specified id. If none found, returns null.
             *
             * @param {String} layerId an id of the LayerItem to return
             * @return {LayerItem} a LayerItem with the specified id
             * @method getLayerItem
             */
            getLayerItem: function (layerId) {
                var layerItem;

                layerItem = UtilArray.find(this.layerItems, function (li) {
                    return li.id === layerId;
                });

                return layerItem;
            },

            /**
             * Populates a template specified by the key with the supplied data.
             *
             * @param {String} key template name
             * @param {Object} data data to be inserted into the template
             * @method _template
             * @private
             * @return {String} a string template filled with supplied data
             */
            _template: function (key, data) {
                tmpl.cache = {};
                tmpl.templates = this.templates;

                data = data || {};

                return tmpl(key, data);
            }
        });
    });