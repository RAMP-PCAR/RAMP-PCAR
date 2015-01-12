/* global define, tmpl, $, console */

/**
* @module RAMP
* @submodule FilterManager
* @main FilterManager
*/

/**
* Create a layer item for each map layer to be displayed in the layer selector. Allows for dynamic changing of the layer item state. 
* 
* ####Imports RAMP Modules:
* {{#crossLink "TmplHelper"}}{{/crossLink}}  
* {{#crossLink "TmplUtil"}}{{/crossLink}}  
* {{#crossLink "Array"}}{{/crossLink}}  
*  
* 
* ####Uses RAMP Templates:
* {{#crossLink "templates/layer_selector_template.json"}}{{/crossLink}}
* 
* @class LayerItem
* @constructor
* @uses dojo/Evented
* @uses dojo/_base/declare
* @uses dojo/lang
* 
* @param {Object} config a config definition of the layer
* @param {Object} [options] Additional options
* 
* @param {String} [options.state] Specifies the initial state of the LyerItem; must be one of the `LayerItem.state` defaults
* @param {String} [options.type] Specifies type of this LayerItem and the name of the layer item template to use
* 
* @param {Object} [options.stateMatrix] additional state matrix records to be mixed into the default
* @param {Object} [options.transitionMatrix] additional state transition matrix records to be mixed into the default
* 
* @return {LayerItem} A control object representing a layer allowing to dynamically change its state.
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
                // declare individual properties inside the constructor: http://dojotoolkit.org/reference-guide/1.9/dojo/_base/declare.html#id6
                lang.mixin(this,
                    {
                        /**
                         * Layer id. Upon initialization, `id` can be overwritten by `config.id` value. 
                         *
                         * @property id
                         * @type String
                         * @default null
                         */
                        id: null,

                        /**
                         * A node of the LayerItem.
                         *
                         * @property node
                         * @type JObject
                         * @default null
                         */
                        node: null,

                        /**
                         * A copy of the layer config supplied during LayerItem creation; is set to `config` value.
                         *
                         * @property _config
                         * @private
                         * @type Object
                         * @default null
                         */
                        _config: null,

                        /**
                         * A node of the image container.
                         *
                         * @property _imageContainerNode
                         * @private
                         * @type JObject
                         * @default null
                         */
                        _imageContainerNode: null,

                        /**
                         * A node of the layer display name.
                         *
                         * @property _displayNameNode
                         * @private
                         * @type JObject
                         * @default null
                         */
                        _displayNameNode: null,

                        /**
                         * A node of the layer controls.
                         *
                         * @property _controlsNode
                         * @private
                         * @type JObject
                         * @default null
                         */
                        _controlsNode: null,

                        /**
                         * A node of the layer toggles.
                         *
                         * @property _togglesNode
                         * @private
                         * @type JObject
                         * @default null
                         */
                        _togglesNode: null,

                        /**
                         * A dictionary of control nodes available for this layer.
                         *
                         * @property _controlStore
                         * @private
                         * @type Object
                         * @default {}
                         */
                        _controlStore: {},

                        /**
                         * A dictionary of toggle nodes available for this layer.
                         *
                         * @property _toggleStore
                         * @private
                         * @type Object
                         * @default {}
                         */
                        _toggleStore: {},

                        /**
                         * A dictionary of notice nodes available for this layer.
                         *
                         * @property _noticeStore
                         * @private
                         * @type Object
                         * @default {}
                         */
                        _noticeStore: {},

                        /**
                         * Templates to be used in construction of the layer nodes.
                         *
                         * @property templates
                         * @type Object
                         * @default layer_selector_template.json
                         */
                        templates: JSON.parse(TmplHelper.stringifyTemplate(layer_selector_template)),

                        /**
                         * State of this LayerItem; can be overwritten by `options.state`.
                         *
                         * @property state
                         * @type String
                         * @default LayerItem.state.DEFAULT
                         */
                        state: LayerItem.state.DEFAULT,

                        /**
                         * Specifies type of this LayerItem and the name of the layer item template to use; can be overwritten by `options.type`.
                         *
                         * @property type
                         * @type String
                         * @default null
                         */
                        type: null
                    },
                    options,
                    {
                        id: config.id,

                        _config: config,

                        /**
                         * Specifies a state matrix for this particular LayerItem. The default is mixed with `options.stateMatrix` upon initialization.
                         * The state matrix prescribes what controls, toggles, and notices are present in specific states. 
                         * 
                         * @property stateMatrix
                         * @type Object
                         * @default LayerItem.stateMatrix
                         */
                        stateMatrix: lang.mixin(
                            lang.clone(LayerItem.stateMatrix),
                            options.stateMatrix
                        ),

                        /**
                         * Specifies a state transition matrix for this particular LayerItem. The default is mixed with `options.transitionMatrix` upon initialization.
                         * The state transition matrix prescribes the direction of state changes for specific states.
                         *
                         * @property transitionMatrix
                         * @type Object
                         * @default LayerItem.transitionMatrix
                         */
                        transitionMatrix: lang.mixin(
                            lang.clone(LayerItem.transitionMatrix),
                            options.transitionMatrix
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

            /**
             * Generates control, toggle, and notice nodes for the LayerItem object to be used in different states.
             *
             * @param {String} partType name of the part type - "controls", "toggles", or "notices"
             * @param {String} templateKey a template name prefix for the template parts
             * @param {Object} partStore a dictionary to store generated nodes
             * @method _generateParts
             * @private
             */
            _generateParts: function (partType, templateKey, partStore) {
                var that = this,

                    stateKey,
                    partKeys = [],
                    control;

                Object
                    .getOwnPropertyNames(LayerItem.state)
                    .forEach(function (s) {
                        stateKey = LayerItem.state[s];
                        partKeys = partKeys.concat(that.stateMatrix[stateKey][partType]);
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

            /**
             * Changes the state of the LayerItem and update its UI representation.
             *
             * @param {String} state name of the state to be set
             * @param {Object} options additional options [not used now]
             * @param {Boolean} force if `true`, forces the state change even if it's no allowed by the `transitionMatrix`
             * @method setState
             */
            setState: function (state, options, force) {
                var allowedStates = this.transitionMatrix[this.state];

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
                            console.log(LayerItem.state.DEFAULT);
                            break;

                        case LayerItem.state.LOADING:
                            this.node.attr("aria-busy", true); // indicates that the region is loading

                            console.log(LayerItem.state.LOADING);
                            break;

                        case LayerItem.state.LOADED:
                            this.node.attr("aria-busy", false); // indicates that the loading is complete
                            this.setState(LayerItem.state.DEFAULT);

                            console.log(LayerItem.state.LOADED);
                            break;

                        case LayerItem.state.ERROR:
                            console.log(LayerItem.state.ERROR);
                            break;

                        case LayerItem.state.OFF_SCALE:
                            console.log(LayerItem.state.OFF_SCALE);
                            break;

                        default:
                            break;
                    }

                    return true;
                } else {
                    return false;
                }
            },

            /**
             * Sets controls, toggles, and notices of the LayerItem according to its state.
             *
             * @param {String} partType name of the part type - "controls", "toggles", or "notices"
             * @param {Object} partStore a dictionary to store generated nodes
             * @param {JObject} target a jQuery node where the nodes should be appended
             * @method _setParts
             * @private
             */
            _setParts: function (partType, partStore, target) {
                var controls = [];

                this.stateMatrix[this.state][partType].forEach(function (pKey) {
                    controls.push(partStore[pKey]);
                });

                target
                    .empty()
                    .append(controls);
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
                data.fn = TmplUtil;

                return tmpl(key, data);
            }
        });

        lang.mixin(LayerItem,
            {
                /**
                * A default collection of possible LayerItem states.
                *
                * @property LayerItem.state
                * @static
                * @type Object
                * @example 
                *     state: {
                *       DEFAULT: "layer-state-default",
                *       LOADING: "layer-state-loading",
                *       ERROR: "layer-state-load-error",
                *       OFF_SCALE: "layer-state-off-scale"
                *       }
                */
                state: {
                    DEFAULT: "layer-state-default",
                    LOADING: "layer-state-loading",
                    LOADED: "layer-state-loaded",
                    ERROR: "layer-state-load-error",
                    OFF_SCALE: "layer-state-off-scale"
                },

                /**
                * A default collection of possible LayerItem controls.
                *
                * @property LayerItem.controls
                * @static
                * @type Object
                * @example 
                *     controls: {
                *            METADATA: "metadata",
                *            SETTINGS: "settings",
                *            LOADING: "loading",
                *            ERROR: "error"
                *           }
                */
                controls: {
                    METADATA: "metadata",
                    SETTINGS: "settings",
                    LOADING: "loading",
                    ERROR: "error"
                },

                /**
                * A default collection of possible LayerItem toggles.
                *
                * @property LayerItem.toggles
                * @static
                * @type Object
                * @example 
                *     toggles: {
                *           EYE: "eye",
                *           BOX: "box",
                *            RELOAD: "reload",
                *            HIDE: "hide",
                *            ZOOM: "zoom",
                *            PLACEHOLDER: "placeholder"
                *        }
                */
                toggles: {
                    EYE: "eye",
                    BOX: "box",
                    RELOAD: "reload",
                    HIDE: "hide",
                    ZOOM: "zoom",
                    PLACEHOLDER: "placeholder"
                },

                /**
                * A default collection of possible LayerItem notices.
                *
                * @property LayerItem.notices
                * @static
                * @type Object
                * @example 
                *     notices: {
                *            SCALE: "scale"
                *           }
                */
                notices: {
                    SCALE: "scale"
                },

                /**
                * A default state matrix specifying what controls are active in which state.
                *
                * @property LayerItem.stateMatrix
                * @static
                * @type Object
                * @example 
                *        DEFAULT: {
                *            controls: [
                *                LayerItem.controls.METADATA,
                *                LayerItem.controls.SETTINGS
                *            ],
                *            toggles: [
                *                LayerItem.toggles.EYE,
                *                LayerItem.toggles.BOX
                *            ],
                *            notices: []
                *        },
                *
                *        LOADING: {
                *            controls: [
                *                LayerItem.controls.LOADING
                *            ],
                *            toggles: [],
                *            notices: []
                *        },
                * 
                *        LOADED: {
                *            controls: [],
                *            toggles: [],
                *            notices: []
                *        },
                *
                *        ERROR: {
                *            controls: [
                *                LayerItem.controls.ERROR
                *            ],
                *            toggles: [
                *                LayerItem.toggles.RELOAD,
                *                LayerItem.toggles.HIDE
                *            ],
                *            notices: []
                *        },
                *
                *        OFF_SCALE: {
                *            controls: [
                *                LayerItem.controls.METADATA,
                *                LayerItem.controls.SETTINGS
                *            ],
                *            toggles: [
                *                LayerItem.toggles.ZOOM,
                *                LayerItem.toggles.EYE,
                *                LayerItem.toggles.BOX
                *            ],
                *            notices: [
                *                LayerItem.notices.SCALE,
                *            ]
                *        }
                */
                stateMatrix: {},

                /**
                * A default state transition matrix specifying to what state the LayerItem can transition.
                *
                * @property LayerItem.transitionMatrix
                * @static
                * @type Object
                * @example 
                *        DEFAULT: [
                *            LayerItem.state.ERROR,
                *            LayerItem.state.OFF_SCALE
                *        ],
                *        LOADED: [
                *            LayerItem.state.LOADING
                *        ],
                *        LOADING: [
                *            LayerItem.state.ERROR,
                *            LayerItem.state.DEFAULT,
                *            LayerItem.state.OFF_SCALE
                *        ],
                *        ERROR: [
                *            LayerItem.state.LOADING
                *        ],
                *        OFF_SCALE: [
                *            LayerItem.state.ERROR,
                *            LayerItem.state.DEFAULT
                *        ]
                * 
                */
                transitionMatrix: {}
            }
        );

        // setting defaults for state matrix
        LayerItem.stateMatrix[LayerItem.state.DEFAULT] = {
            controls: [
                LayerItem.controls.METADATA,
                LayerItem.controls.SETTINGS
            ],
            toggles: [
                LayerItem.toggles.EYE,
                LayerItem.toggles.BOX
            ],
            notices: []
        };

        LayerItem.stateMatrix[LayerItem.state.LOADING] = {
            controls: [
                LayerItem.controls.LOADING
            ],
            toggles: [],
            notices: []
        };

        LayerItem.stateMatrix[LayerItem.state.LOADED] = {
            controls: [],
            toggles: [],
            notices: []
        };

        LayerItem.stateMatrix[LayerItem.state.ERROR] = {
            controls: [
                LayerItem.controls.ERROR
            ],
            toggles: [
                LayerItem.toggles.RELOAD,
                LayerItem.toggles.HIDE
            ],
            notices: []
        };

        LayerItem.stateMatrix[LayerItem.state.OFF_SCALE] = {
            controls: [
                LayerItem.controls.METADATA,
                LayerItem.controls.SETTINGS
            ],
            toggles: [
                LayerItem.toggles.ZOOM,
                LayerItem.toggles.EYE,
                LayerItem.toggles.BOX
            ],
            notices: [
                LayerItem.notices.SCALE
            ]
        };

        // setting defaults for transition matrix
        LayerItem.transitionMatrix[LayerItem.state.DEFAULT] = [
            LayerItem.state.ERROR,
            LayerItem.state.OFF_SCALE
        ];

        LayerItem.transitionMatrix[LayerItem.state.LOADING] = [
            LayerItem.state.LOADED
        ];

        LayerItem.transitionMatrix[LayerItem.state.LOADED] = [
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