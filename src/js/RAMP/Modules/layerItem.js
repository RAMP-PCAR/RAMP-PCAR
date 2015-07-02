/* global define, tmpl, $, console, i18n */

/**
* @module RAMP
* @submodule FilterManager
* @main FilterManager
*/

/**
* Create a layer item for each map layer to be displayed in the layer selector. Allows for dynamic
* changing of the layer item state.
*
* ####Imports RAMP Modules:
* {{#crossLink "Util"}}{{/crossLink}}
* {{#crossLink "TmplHelper"}}{{/crossLink}}
* {{#crossLink "TmplUtil"}}{{/crossLink}}
* {{#crossLink "Array"}}{{/crossLink}}
* {{#crossLink "Dictionary"}}{{/crossLink}}
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
* @param {String} [options.state] Specifies the initial state of the LyerItem; must be one of the
* `LayerItem.state` defaults
* @param {String} [options.type] Specifies type of this LayerItem and the name of the layer item
* template to use
*
* @param {Object} [options.stateMatrix] additional state matrix records to be mixed into the default
* @param {Object} [options.transitionMatrix] additional state transition matrix records to be mixed
* into the default
*
* @return {LayerItem} A control object representing a layer allowing to dynamically change its state.
*/

define([
    'dojo/Evented', 'dojo/_base/declare', 'dojo/_base/lang',

    /* Text */
    'dojo/text!./templates/layer_selector_template.json',

    /* Util */
    'utils/util', 'utils/tmplHelper', 'utils/tmplUtil', 'utils/array', 'utils/dictionary', 'utils/bricks',
],
    function (
        Evented, declare, lang,
        layerSelectorTemplate,
        Util, TmplHelper, TmplUtil, UtilArray, UtilDict, Bricks
    ) {
        'use strict';

        var LayerItem;
        var ALL_STATES_CLASS;

        LayerItem = declare([Evented], {
            constructor: function (config, options) {
                // declare individual properties inside the constructor:
                // http://dojotoolkit.org/reference-guide/1.9/dojo/_base/declare.html#id6
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
                         * A node of the layer toggles.
                         *
                         * @property _togglesNode
                         * @private
                         * @type JObject
                         * @default null
                         */
                        _noticesNode: null,

                        /**
                         * A node of the layer toggles.
                         *
                         * @property _togglesNode
                         * @private
                         * @type JObject
                         * @default null
                         */
                        _settingsNode: null,

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
                         * A dictionary of setting nodes available for this layer.
                         *
                         * @property _settingStore
                         * @private
                         * @type Object
                         * @default {}
                         */
                        _settingsStore: {},

                        /**
                         * Templates to be used in construction of the layer nodes.
                         *
                         * @property templates
                         * @type Object
                         * @default layer_selector_template.json
                         */
                        templates: JSON.parse(TmplHelper.stringifyTemplate(layerSelectorTemplate)),

                        /**
                         * State of this LayerItem; can be overwritten by `options.state`.
                         *
                         * @property state
                         * @type String
                         * @default LayerItem.state.DEFAULT
                         */
                        state: LayerItem.state.DEFAULT,

                        /**
                         * Specifies type of this LayerItem and the name of the layer item template to use;
                         * can be overwritten by `options.type`.
                         *
                         * @property type
                         * @type String
                         * @default null
                         */
                        type: null,
                    },
                    options,
                    {
                        id: config.id,

                        _config: config,

                        /**
                         * Specifies a state matrix for this particular LayerItem. The default is mixed with
                         * `options.stateMatrix` upon initialization.
                         * The state matrix prescribes what controls, toggles, and notices are present in
                         * specific states.
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
                         * Specifies a state transition matrix for this particular LayerItem. The default is mixed with
                         * `options.transitionMatrix` upon initialization.
                         * The state transition matrix prescribes the direction of state changes for specific states.
                         *
                         * @property transitionMatrix
                         * @type Object
                         * @default LayerItem.transitionMatrix
                         */
                        transitionMatrix: lang.mixin(
                            lang.clone(LayerItem.transitionMatrix),
                            options.transitionMatrix
                        ),
                    }
                );

                // can't use i18n before locale files are loaded, so have to set brick templates after
                if (!LayerItem.brickTemplates) {
                    LayerItem.brickTemplates = {
                        boundingBoxBrick: {
                            type: Bricks.CheckboxfsBrick,
                            config: {
                                label: i18n.t('filterManager.boundingBox'),
                                customContainerClass: 'bbox',
                                checked: false,

                                //instructions: i18n.t('addDataset.help.dataSource')
                            },
                        },

                        allDataBrick: {
                            type: Bricks.ChoiceBrick,
                            config: {
                                header: i18n.t('filterManager.layerData'),
                                template: 'default_choice_brick_inline_template',
                                containerClass: 'choice-brick-inline-container',
                                customContainerClass: 'all-data',
                                choices: [
                                    {
                                        key: 'layerDataPrefetch',
                                        value: i18n.t('filterManager.layerDataPrefetch'),
                                    },
                                ],

                                //instructions: i18n.t('addDataset.help.dataSource')
                            },
                        },

                        allDataCheckedBrick: {
                            type: Bricks.ChoiceBrick,
                            config: {
                                header: i18n.t('filterManager.layerData'),
                                template: 'default_choice_brick_inline_template',
                                containerClass: 'choice-brick-inline-container',
                                customContainerClass: 'all-data',
                                isEnabled: false,
                                preselect: 'layerDataPrefetch',
                                choices: [
                                    {
                                        key: 'layerDataPrefetch',
                                        value: i18n.t('filterManager.layerDataPrefetch'),
                                    },
                                ],

                                //instructions: i18n.t('addDataset.help.dataSource')
                            },
                        },
                    };
                }

                tmpl.cache = {};
                tmpl.templates = this.templates;

                var info = this._config;
                info.fn = TmplUtil;

                this.node = $(tmpl(this.type, info));
                this._imageBoxNode = this.node.find('.layer-details > div:first');
                this._displayNameNode = this.node.find('.layer-name > span');
                this._controlsNode = this.node.find('.layer-controls-group');
                this._togglesNode = this.node.find('.layer-checkboxes');
                this._noticesNode = this.node.find('.layer-notices');
                this._settingsNode = this.node.find('.layer-settings');

                this._generateParts('controls', 'layer_control_', this._controlStore);
                this._generateParts('toggles', 'layer_toggle_', this._toggleStore);
                this._generateParts('notices', 'layer_notice_', this._noticeStore);
                this._generateParts('settings', 'layer_setting_', this._settingsStore);

                this.setState(this.state, options, true);

                console.debug('-->', this.state, options);
            },

            /**
             * Generates control, toggle, and notice nodes for the LayerItem object to be used in different states.
             *
             * @param {String} partType name of the part type - 'controls', 'toggles', or 'notices'
             * @param {String} templateKey a template name prefix for the template parts
             * @param {Object} partStore a dictionary to store generated nodes
             * @method _generateParts
             * @private
             */
            _generateParts: function (partType, templateKey, partStore) {
                var _this = this;

                var stateKey;
                var partKeys = [];
                var part;

                var brickTemplate;
                var brickPart;

                Object
                    .getOwnPropertyNames(LayerItem.state)
                    .forEach(function (s) {
                        stateKey = LayerItem.state[s];
                        partKeys = partKeys.concat(_this.stateMatrix[stateKey][partType]);
                    });

                partKeys = UtilArray.unique(partKeys);

                partKeys.forEach(function (pKey) {
                    if (LayerItem.brickTemplates[pKey]) {
                        brickTemplate = LayerItem.brickTemplates[pKey];

                        brickPart = brickTemplate.type.new(pKey, brickTemplate.config);

                        // TODO: fix
                        // hack to get the data-layer-id attribute onto checkboxBrick input node
                        // used in conjunction with ChekcboxGroup in FilterManager; will be removed when layerItem
                        // is switched full to Bricks and  LayerCollection controller is added in between filterManager
                        // and LayerGroup.

                        if (Bricks.CheckboxBrick.isPrototypeOf(brickPart)) {
                            brickPart.inputNode.attr('data-layer-id', _this._config.id);
                        } else {
                            brickPart.choiceButtons.attr('data-layer-id', _this._config.id);
                        }

                        part = brickPart.node;
                    } else {
                        part = _this._generatePart(templateKey, pKey);
                    }

                    partStore[pKey] = (part);
                });
            },

            /**
             * Generates a control given the template name and additional data object to pass to the template engine.
             *
             * @param {String} templateKey a template name prefix for the template parts
             * @param {String} pKey name of the template to build
             * @param {Object} [data] optional data to pass to template engine; used to update strings on notice objects
             * @method _generatePart
             * @private
             * @return Created part node
             */
            _generatePart: function (templateKey, pKey, data) {
                tmpl.cache = {};
                tmpl.templates = this.templates;

                var info = {
                        id: this.id,
                        config: this._config,
                        nameKey: pKey,
                        data: data,
                    };
                info.fn = TmplUtil;
                var part = $(tmpl(templateKey + pKey, info));

                return part;
            },

            /**
             * Changes the state of the LayerItem and update its UI representation.
             *
             * @param {String} state name of the state to be set
             * @param {Object} [options] additional options
             * @param {Object} [options.notices] custom information to be displayed in a notice for the current state
             * if needed; object structure is not set; look at the appropriate template;
             * @example
             *      {
             *          notices: {
             *              error: {
             *                  message: "I am error"
             *              },
             *              scale: {
             *                  message: "All your base are belong to us"
             *              }
             *          }
             *      }
             * @param {Boolean} force if `true`, forces the state change even if it's no allowed by the
             * `transitionMatrix`
             * @method setState
             */
            setState: function (state, options, force) {
                var allowedStates = this.transitionMatrix[this.state];
                var notice;
                var focusedNode;

                var _this = this;

                if (allowedStates.indexOf(state) !== -1 || force) {
                    this.state = state;

                    //lang.mixin(this, options);

                    // set state class on the layerItem root node
                    this.node
                        .removeClass(ALL_STATES_CLASS)
                        .addClass(this.state);

                    // regenerate notice controls if extra data is provided
                    if (options) {
                        if (options.notices) {
                            UtilDict.forEachEntry(options.notices, function (pKey, data) {
                                notice = _this._generatePart('layer_notice_', pKey, data);

                                _this._noticeStore[pKey] = (notice);
                            });
                        }
                    }

                    // store reference to a focused node inside this layer item if any
                    focusedNode = this.node.find(':focus');

                    this._setParts('controls', this._controlStore, this._controlsNode);
                    this._setParts('toggles', this._toggleStore, this._togglesNode);
                    this._setParts('notices', this._noticeStore, this._noticesNode);
                    this._setParts('settings', this._settingsStore, this._settingsNode);

                    switch (this.state) {
                        case LayerItem.state.DEFAULT:
                            console.log(LayerItem.state.DEFAULT);
                            break;

                        case LayerItem.state.LOADING:
                            this.node.attr('aria-busy', true); // indicates that the region is loading

                            console.log(LayerItem.state.LOADING);
                            break;

                        case LayerItem.state.LOADED:
                            this.node.attr('aria-busy', false); // indicates that the loading is complete
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

                    // reset focus after changing layer item's state
                    if (focusedNode.length > 0) {
                        // if the previously focused node still in DOM, set focus to it
                        if (Util.containsInDom(focusedNode[0])) {
                            focusedNode.focus();
                        } else {
                            // if this node is no longer in DOM, set focus to the first focusable element in layer item
                            this.node.find(':focusable:first').focus();
                        }
                    }

                    return true;
                } else {
                    return false;
                }
            },

            refresh: function () {
                this.setState(this.state, null, true);
            },

            /**
             * Sets controls, toggles, and notices of the LayerItem according to its state.
             *
             * @param {String} partType name of the part type - 'controls', 'toggles', or 'notices'
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

                // use detach instead of empty to preserve handlers that jQuery deletes on empty
                // http://stackoverflow.com/questions/2027706/why-do-registered-events-disappear-when-an-element-is-removed-from-dom/14900035#14900035
                // http://api.jquery.com/detach/
                target
                    .children()
                    .detach()
                    .end()
                    .append(controls)
                ;
            },
        });

        /**
         * Helper function to check if `states` parameter is false or []. If empty array is supplied,
         * all available states are returned
         *
         * @param {Array} [states] state names
         * @method getStateNames
         * @private
         */
        function getStateNames(states) {
            if (typeof states === 'undefined' || !states || states.length === 0) {
                states = Object
                    .getOwnPropertyNames(LayerItem.state)
                    .map(function (key) { return LayerItem.state[key]; });
            }

            return states;
        }

        /**
         * Helper function to check if `partKeys` parameter is false or []. If empty array is supplied,
         * all available partKeys for the specified partType are returned.
         *
         * @param {String} partType a part type
         * @param {Array} [partKeys] part keys
         * @method getPartKeys
         * @return {Array} an array of partKeys
         * @private
         */
        function getPartKeys(partType, partKeys) {
            if (typeof partKeys === 'undefined' || !partKeys || partKeys.length === 0) {
                partKeys = Object
                    .getOwnPropertyNames(LayerItem[partType])
                    .map(function (key) { return LayerItem[partType][key]; });
            }

            return partKeys;
        }

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
                *       DEFAULT: 'layer-state-default',
                *       LOADING: 'layer-state-loading',
                *       LOADED: 'layer-state-loaded',
                *       UPDATING: 'layer-state-updating',
                *       ERROR: 'layer-state-error',
                *       OFF_SCALE: 'layer-state-off-scale'
                *       }
                */
                state: {
                    DEFAULT: 'layer-state-default',
                    LOADING: 'layer-state-loading',
                    LOADED: 'layer-state-loaded',
                    UPDATING: 'layer-state-updating',
                    ERROR: 'layer-state-error',
                    OFF_SCALE: 'layer-state-off-scale',
                },

                /**
                * A default collection of possible LayerItem part types.
                *
                * @property LayerItem.partTypes
                * @static
                * @type Object
                * @example
                *     partTypes: {
                *       TOGGLES: 'toggles',
                *       CONTROLS: 'controls',
                *       NOTICES: 'notices',
                *       SETTINGS: 'settings'
                *       }
                */
                partTypes: {
                    TOGGLES: 'toggles',
                    CONTROLS: 'controls',
                    NOTICES: 'notices',
                    SETTINGS: 'settings',
                },

                /**
                * A default collection of possible LayerItem controls.
                *
                * @property LayerItem.controls
                * @static
                * @type Object
                * @example
                *     controls: {
                *            METADATA: 'metadata',
                *            SETTINGS: 'settings',
                *            LOADING: 'loading',
                *            REMOVE: 'remove',
                *            RELOAD: 'reload',
                *            ERROR: 'error'
                *           }
                */
                controls: {
                    METADATA: 'metadata',
                    SETTINGS: 'settings',
                    LOADING: 'loading',
                    REMOVE: 'remove',
                    RELOAD: 'reload',
                    ERROR: 'error',
                },

                /**
                * A default collection of possible LayerItem toggles.
                *
                * @property LayerItem.toggles
                * @static
                * @type Object
                * @example
                *     toggles: {
                *           EYE: 'eye',
                *           BOX: 'box',
                *            RELOAD: 'reload',
                *            HIDE: 'hide',
                *            ZOOM: 'zoom',
                *            PLACEHOLDER: 'placeholder'
                *        }
                */
                toggles: {
                    EYE: 'eye',
                    BOX: 'box',
                    RELOAD: 'reload',
                    HIDE: 'hide',
                    ZOOM: 'zoom',
                    PLACEHOLDER: 'placeholder',
                    QUERY: 'query',
                },

                /**
                * A default collection of possible LayerItem notices.
                *
                * @property LayerItem.notices
                * @static
                * @type Object
                * @example
                *     notices: {
                *            SCALE: 'scale'
                *            ERROR: 'error',
                *            UPDATE: 'update',
                *            USER: 'user'
                *           }
                */
                notices: {
                    SCALE: 'scale',
                    ERROR: 'error',
                    UPDATE: 'update',
                    USER: 'user',
                },

                /**
                * A default collection of possible LayerItem settings.
                *
                * @property LayerItem.settings
                * @static
                * @type Object
                * @example
                *     settings: {
                *           OPACITY: 'opacity',
                *           BOUNDING_BOX: 'bounding_box',
                *           SNAPSHOT: 'snapshot'
                *           }
                */
                settings: {
                    OPACITY: 'opacity',
                    BOUNDING_BOX: 'boundingBoxBrick',
                    SNAPSHOT: 'snapshot',
                    ALL_DATA: 'allDataBrick',
                    ALL_DATA_CHECKED: 'allDataCheckedBrick', // a Choice brick which is alreayd preselected
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
                *        DEFAULT: {
                *            controls: [
                *                LayerItem.controls.METADATA,
                *                LayerItem.controls.SETTINGS
                *            ],
                *            toggles: [
                *                LayerItem.toggles.EYE,
                *                LayerItem.toggles.BOX
                *            ],
                *            notices: [
                *                LayerItem.notices.UPDATE
                *            ]
                *        },
                *
                *        ERROR: {
                *            controls: [
                *                LayerItem.controls.RELOAD,
                *                LayerItem.controls.REMOVE
                *            ],
                *            toggles: [],
                *            notices: [
                *                LayerItem.notices.ERROR
                *            ]
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
                *                LayerItem.notices.SCALE
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
                *            LayerItem.state.OFF_SCALE,
                *            LayerItem.state.UPDATING
                *        ],
                *        LOADED: [
                *            LayerItem.state.DEFAULT
                *        ],
                *        LOADING: [
                *            LayerItem.state.LOADED
                *        ],
                *        UPDATING: [
                *            LayerItem.state.ERROR,
                *            LayerItem.state.OFF_SCALE,
                *            LayerItem.state.DEFAULT
                *        ],
                *        ERROR: [
                *            LayerItem.state.LOADING
                *        ],
                *        OFF_SCALE: [
                *            LayerItem.state.ERROR,
                *            LayerItem.state.DEFAULT,
                *            LayerItem.state.UPDATING
                *        ]
                *
                */
                transitionMatrix: {},

                /**
                 * A temporary store for brick templates.
                 * TODO: re-think how to best use brick/templates inside the layer item
                 *
                 * @property LayerItem.brickTemplates
                 * @static
                 * @type Object
                 * @default null
                 */
                brickTemplates: null,
            }
        );

        // setting defaults for state matrix
        LayerItem.stateMatrix[LayerItem.state.DEFAULT] = {
            controls: [
                LayerItem.controls.METADATA,
                LayerItem.controls.SETTINGS,
                LayerItem.controls.REMOVE,
            ],
            toggles: [],
            notices: [],
            settings: [
                LayerItem.settings.OPACITY,
            ],
        };

        LayerItem.stateMatrix[LayerItem.state.LOADING] = {
            controls: [
                LayerItem.controls.LOADING,
            ],
            toggles: [],
            notices: [],
            settings: [
                LayerItem.settings.OPACITY,
            ],
        };

        LayerItem.stateMatrix[LayerItem.state.LOADED] = {
            controls: [],
            toggles: [],
            notices: [],
            settings: [],
        };

        LayerItem.stateMatrix[LayerItem.state.UPDATING] = {
            controls: [
                LayerItem.controls.METADATA,
                LayerItem.controls.SETTINGS,
                LayerItem.controls.REMOVE,
            ],
            toggles: [],
            notices: [
                LayerItem.notices.UPDATE,
            ],
            settings: [
                LayerItem.settings.OPACITY,
            ],
        };

        LayerItem.stateMatrix[LayerItem.state.ERROR] = {
            controls: [
                LayerItem.controls.RELOAD,
                LayerItem.controls.REMOVE,
            ],
            toggles: [],
            notices: [
                LayerItem.notices.ERROR,
            ],
            settings: [
                LayerItem.settings.OPACITY,
            ],
        };

        LayerItem.stateMatrix[LayerItem.state.OFF_SCALE] = {
            controls: [
                LayerItem.controls.METADATA,
                LayerItem.controls.SETTINGS,
                LayerItem.controls.REMOVE,
            ],
            toggles: [
                LayerItem.toggles.ZOOM,
            ],
            notices: [
                LayerItem.notices.SCALE,
            ],
            settings: [
                LayerItem.settings.OPACITY,
            ],
        };

        // setting defaults for transition matrix
        LayerItem.transitionMatrix[LayerItem.state.DEFAULT] = [
            LayerItem.state.ERROR,
            LayerItem.state.OFF_SCALE,
            LayerItem.state.UPDATING,
        ];

        LayerItem.transitionMatrix[LayerItem.state.LOADING] = [
            LayerItem.state.LOADED,
            LayerItem.state.ERROR,
            LayerItem.state.UPDATING,
        ];

        LayerItem.transitionMatrix[LayerItem.state.LOADED] = [
            LayerItem.state.DEFAULT,
        ];

        LayerItem.transitionMatrix[LayerItem.state.UPDATING] = [
            LayerItem.state.LOADED,
            LayerItem.state.ERROR,
        ];

        LayerItem.transitionMatrix[LayerItem.state.ERROR] = [
            LayerItem.state.LOADING,
        ];

        LayerItem.transitionMatrix[LayerItem.state.OFF_SCALE] = [
            LayerItem.state.ERROR,
            LayerItem.state.DEFAULT,
            LayerItem.state.UPDATING,
        ];

        /**
        * Modifies a given state matrix by adding specified partKey to the specified partType collection.
        *
        * @param {Object} stateMatrix matrix to modify
        * @param {String} partType type of the parts to modify: `controls`, `toggles`, `notices`
        * @param {String} partKey part key to be inserted into the collection
        * @param {Array} [states] array of state names to insert the part into; if false or [], all states are assumed
        * @param {Boolean} [prepend] indicates if the part key should be prepended or appended
        * @method addStateMatrixPart
        * @static
        */
        LayerItem.addStateMatrixPart = function (stateMatrix, partType, partKey, states, prepend) {
            var parts;

            states = getStateNames(states);
            states.forEach(function (state) {
                parts = stateMatrix[state][partType];
                if (prepend) {
                    parts.unshift(partKey);
                } else {
                    parts.push(partKey);
                }
            });

            /*UtilDict.forEachEntry(stateMatrix, function (state, data) {
                if (states.indexOf(state) !== -1) {
                    if (prepend) {
                        data[partType].unshift(partKey);
                    } else {
                        data[partType].push(partKey);
                    }
                }
            });*/
        };

        /**
        * Sets given matrix states by adding specified partKeys to the specified partType collection.
        *
        * @param {Object} stateMatrix matrix to modify
        * @param {String} partType type of the parts to modify: `controls`, `toggles`, `notices`
        * @param {Array} [partKeys] an array of part key names to be inserted into the collection; if false or [],
        * all part keys are assumed
        * @param {Array} [states] array of state names to insert the part into; if false or [], all states are assumed
        * @param {Boolean} [prepend] indicates if the part key should be prepended or appended
        * @param {Boolean} [clear] a flag to clear existing partKey collections
        * @method addStateMatrixParts
        * @static
        */
        LayerItem.addStateMatrixParts = function (stateMatrix, partType, partKeys, states, prepend, clear) {
            var _this = this;
            partKeys = getPartKeys(partType, partKeys);
            states = getStateNames(states);

            // remove partkeys
            if (clear) {
                states.forEach(function (state) {
                    stateMatrix[state][partType] = [];
                });
            }

            // add new ones
            partKeys.forEach(function (partKey) {
                _this.addStateMatrixPart(stateMatrix, partType, partKey, states, prepend);
            });
        };

        /**
         * Modifies a given state matrix by removing specified partKey to the specified partType collection.
         *
         * @param {Object} stateMatrix matrix to modify
         * @param {String} partType type of the parts to modify: `controls`, `toggles`, `notices`
         * @param {String} partKey part key to be removed from the collection
         * @param {Array} [states] array of state names to remove the part from; if false or [], all states are assumed
         * @method addStateMatrixPart
         * @static
         */
        LayerItem.removeStateMatrixPart = function (stateMatrix, partType, partKey, states) {
            states = getStateNames(states);
            states.forEach(function (state) {
                UtilArray.remove(stateMatrix[state][partType], partKey);
            });
        };

        /**
         * Modifies a given state matrix by removing specified partKeys to the specified partType collection.
         *
         * @param {Object} stateMatrix matrix to modify
         * @param {String} partType type of the parts to modify: `controls`, `toggles`, `notices`
         * @param {String} [partKeys] array of part key names to be removed from the collection; if false or [],
         * all part keys are assumed
         * @param {Array} [states] array of state names to remove the part from; if false or [], all states are assumed
         * @method removeStateMatrixParts
         * @static
         */
        LayerItem.removeStateMatrixParts = function (stateMatrix, partType, partKeys, states) {
            var _this = this;
            partKeys = getPartKeys(partType, partKeys);
            states = getStateNames(states);

            // remove partkey from states
            partKeys.forEach(function (partKey) {
                _this.removeStateMatrixPart(stateMatrix, partType, partKey, states);
            });
        };

        /**
         * Get a deep copy of the default stateMatrix.
         *
         * @method getStateMatrixTemplate
         * @static
         * @return {Object} a deep copy of the default stateMatrix
         */
        LayerItem.getStateMatrixTemplate = function () {
            return lang.clone(LayerItem.stateMatrix);
        };

        // a string with all possible layerItem state CSS classes joined by ' '; used to clear any CSS state class
        // from the node
        ALL_STATES_CLASS =
            Object
                .getOwnPropertyNames(LayerItem.state)
                .map(function (key) { return LayerItem.state[key]; })
                .join(' ');

        return LayerItem;
    });
