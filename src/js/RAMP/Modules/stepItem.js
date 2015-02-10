/* global define, tmpl, $, console, Base */

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
* {{#crossLink "Dictionary"}}{{/crossLink}}  
*  
* 
* ####Uses RAMP Templates:
* {{#crossLink "templates/layer_selector_template.json"}}{{/crossLink}}
* 
* @class StepItem
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
* @return {StepItem} A control object representing a layer allowing to dynamically change its state.
*/

define([
    "dojo/Evented", "dojo/_base/declare", "dojo/_base/lang",

    /* Text */
    "dojo/text!./templates/filter_manager_template.json",

    /* Util */
    "utils/tmplHelper", "utils/tmplUtil", "utils/array", "utils/dictionary"
],
    function (
        Evented, declare, lang,
        filter_manager_template,
        TmplHelper, TmplUtil, UtilArray, UtilDict
    ) {
        "use strict";

        var LayerItem,
            ALL_STATES_CLASS,

            templates = JSON.parse(TmplHelper.stringifyTemplate(filter_manager_template)),

            bricks,

            Brick,
            ChoiceBrick;

        Brick = Base.extend({
            initialize: function (id, config) {

                lang.mixin(this,
                    config,
                    {
                        id: id,
                        _listeners: {}
                    }
                );

                this.node = $(_template(this.template, this));

            },

            _notify: function (eventName, data) {

                if (!this._listeners[eventName]) {
                    this._listeners[eventName] = [];
                }
                this._listeners[eventName].forEach(function (listener) {
                    listener.call(this, data);
                });
            },

            on: function (eventName, listener) {
                if (!this._listeners[eventName]) {
                    this._listeners[eventName] = [];
                }
                this._listeners[eventName].push(listener);

                return this;
            },

            isValid: function () {
                return true;
            },

            getData: function (payload, wrap) {
                var result = {};

                if (wrap) {
                    result[this.id] = payload;
                } else {
                    result = payload;
                }

                return result;
            },

            disable: function (disable) {
                if (disable) {
                    this.node.find("button").attr("disabled", true);
                } else {
                    this.node.find("button").attr("disabled", false);
                }
            }
        });

        ChoiceBrick = Brick.extend({
            initialize: function (id, config) {
                var that = this;

                lang.mixin(this,
                    {
                        template: "default_choice_brick_template"
                    }
                );

                Brick.initialize.call(this, id, config);

                lang.mixin(this, {
                    selectedChoice: "",
                    userSelected: false
                }
                );

                this.choiceButtons = this.node.find(".btn-choice");

                this.node.on("click", ".btn-choice:not(.button-pressed)", function (event) {
                    var choiceKey = $(event.currentTarget).data("key");
                    that.setChoice(choiceKey, true);
                });
            },

            setChoice: function (choiceKey, userSelected) {
                this.userSelected = userSelected ? true : false;
                this.selectedChoice = choiceKey;

                this.choiceButtons
                    .removeClass("button-pressed")
                    .filter("[data-key='" + choiceKey + "']")
                    .addClass("button-pressed");

                console.log("ChoiceBrick-" + this.id, ":", this.selectedChoice, "; userSelected:", this.userSelected);

                this._notify("change", this.getData());
            },

            isUserSelected: function () {
                return this.userSelected;
            },

            isValid: function () {
                return this.selectedChoice !== "";
            },

            getData: function (wrap) {
                var payload = {
                    selectedChoice: this.selectedChoice,
                    userSelected: this.userSelected
                };

                return Brick.getData.call(this, payload, wrap);
            }
        });

        bricks = {
            ChoiceBrick: ChoiceBrick
        };

        /**
        * Populates a template specified by the key with the supplied data.
        *
        * @param {String} key template name
        * @param {Object} data data to be inserted into the template
        * @method _template
        * @private
        * @return {String} a string template filled with supplied data
        */
        function _template(key, data) {
            var d = lang.clone(data) || {};
            tmpl.cache = {};
            tmpl.templates = templates;

            d.fn = TmplUtil;

            return tmpl(key, d);
        }

        LayerItem = declare([Evented], {
            constructor: function (config) {
                var that = this;

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

                        expose: [],
                        content: null,
                        contentBricks: {},

                        template: "default_step_template",

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

                        _contentNode: null,
                        _optionsNode: null,

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
                        templates: null, // JSON.parse(TmplHelper.stringifyTemplate(layer_selector_template)),

                        /**
                         * State of this LayerItem; can be overwritten by `options.state`.
                         *
                         * @property state
                         * @type String
                         * @default LayerItem.state.DEFAULT
                         */
                        state: "", //LayerItem.state.DEFAULT,

                        /**
                         * Specifies type of this LayerItem and the name of the layer item template to use; can be overwritten by `options.type`.
                         *
                         * @property type
                         * @type String
                         * @default null
                         */
                        type: null
                    },
                    config
                );

                this.node = $(_template(this.template, this._config));
                this._contentNode = this.node.find("> .step-content");
                this._optionsContainerNode = this.node.find("> .step-options-container");
                this._optionsNode = this._optionsContainerNode.find("> .step-options");

                this.content.forEach(function (contentItem) {
                    var contentBrick = bricks[contentItem.type].new(contentItem.id, contentItem.config);

                    that._addContentBrick(contentItem, contentBrick);

                });

                //this._imageBoxNode = this.node.find(".layer-details > div:first");
                //this._displayNameNode = this.node.find(".layer-name > span");
                //this._controlsNode = this.node.find(".layer-controls-group");
                //this._togglesNode = this.node.find(".layer-checkboxes");
                //this._noticesNode = this.node.find(".layer-notices");

                //this._generateParts("controls", "layer_control_", this._controlStore);
                //this._generateParts("toggles", "layer_toggle_", this._toggleStore);
                //this._generateParts("notices", "layer_notice_", this._noticeStore);

                //this.setState(this.state, null, true);

                $("#add-dataset-section > section").append(this.node);

                console.debug("-->", this.state);
            },

            _addContentBrick: function (contentItem, contentBrick) {
                var that = this;
                this.contentBricks[contentBrick.id] = contentBrick;

                if (contentItem.on) {
                    contentItem.on.forEach(function (o) {
                        contentBrick.on(o.eventName, function (data) {
                            o.callback.call(that, data);

                            if (o.expose) {
                                that._doInternalCheck();
                                that.emit(contentBrick.id + "/" + o.eventName, data);
                            }
                        });
                    });
                }

                contentBrick.on("change", function () {
                    that._doInternalCheck();
                });

                this._contentNode.append(contentBrick.node);
            },

            _doInternalCheck: function () {
                console.log(this.getData(), "internal check");
            },

            getData: function () {
                var data = {};

                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    lang.mixin(data, brick.getData(true));
                });

                return data;
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
                    part;

                Object
                    .getOwnPropertyNames(LayerItem.state)
                    .forEach(function (s) {
                        stateKey = LayerItem.state[s];
                        partKeys = partKeys.concat(that.stateMatrix[stateKey][partType]);
                    });

                partKeys = UtilArray.unique(partKeys);

                partKeys.forEach(function (pKey) {
                    part = that._generatePart(templateKey, pKey);

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
                var part = $(this._template(templateKey + pKey,
                    {
                        id: this.id,
                        config: this._config,
                        nameKey: pKey,
                        data: data
                    }
                ));

                return part;
            },

            /**
             * Changes the state of the LayerItem and update its UI representation.
             *
             * @param {String} state name of the state to be set
             * @param {Object} [options] additional options
             * @param {Object} [options.notices] custom information to be displayed in a notice for the current state if needed; object structure is not set; look at the appropriate template; 
             * @example
             *      {
             *          notices: {
             *              error: {
             *                  message: "I'm error"
             *              },
             *              scale: {
             *                  message: "All your base are belong to us"
             *              }
             *          }
             *      }
             * @param {Boolean} force if `true`, forces the state change even if it's no allowed by the `transitionMatrix`
             * @method setState
             */
            setState: function (state, options, force) {
                var allowedStates = this.transitionMatrix[this.state],
                    notice,

                    that = this;

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
                                notice = that._generatePart("layer_notice_", pKey, data);

                                that._noticeStore[pKey] = (notice);
                            });
                        }
                    }

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
            }
        });

        return LayerItem;
    });