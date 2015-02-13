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
    "utils/util", "utils/tmplHelper", "utils/tmplUtil", "utils/array", "utils/dictionary", "utils/bricks"
],
    function (
        Evented, declare, lang,
        filter_manager_template,
        UtilMisc, TmplHelper, TmplUtil, UtilArray, UtilDict, Bricks
    ) {
        "use strict";

        var LayerItem,
            ALL_STATES_CLASS,

            templates = JSON.parse(TmplHelper.stringifyTemplate(filter_manager_template));

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

                        content: null,
                        contentBricks: {},

                        template: "default_step_template",

                        /**
                         * A copy of the layer config supplied during LayerItem creation; is set to `config` value.
                         *
                         * @property _config
                         * @private
                         * @type Object
                         * @default null
                         */
                        _config: config,

                        /**
                         * A node of the LayerItem.
                         *
                         * @property node
                         * @type JObject
                         * @default null
                         */
                        node: null,


                        _contentNode: null,
                        _optionsContainerNode: null,
                        _optionsNode: null,

                        state: ""
                    },
                    config
                );

                this.node = $(_template(this.template, config));
                this._contentNode = this.node.find("> .step-content");
                this._optionsContainerNode = this.node.find("> .step-options-container");
                this._optionsNode = this._optionsContainerNode.find("> .step-options");

                this.content.forEach(function (contentItem) {
                    that._addContentBrick(contentItem);
                });

                console.debug("-->", this.state);
            },

            _addContentBrick: function (contentItem) {
                var that = this,
                    contentBrick = contentItem.type.new(contentItem.id, contentItem.config);

                // if it's a multiBrick, add individual bricks from its content to the main content and wire them as separate bricks
                if (Bricks.MultiBrick === contentItem.type) {

                    contentBrick.content.forEach(function (contentItem) {
                        that._wireBrickUp(contentItem, contentBrick.contentBricks[contentItem.id]);
                    });

                } else {
                    that._wireBrickUp(contentItem, contentBrick);
                }

                this._contentNode.append(contentBrick.node);

                this._doInternalCheck();
            },

            _wireBrickUp: function (contentItem, contentBrick) {
                var that = this;
                this.contentBricks[contentBrick.id] = contentBrick;

                // set brick events if specified
                if (contentItem.on) {
                    contentItem.on.forEach(function (o) {
                        contentBrick.on(o.eventName, function (data) {
                            o.callback.call(contentBrick, that, data);

                            // if event is exposed; emit it
                            if (o.expose) {
                                that._doInternalCheck();
                                that.emit(contentBrick.id + "/" + o.eventName, data);
                            }
                        });
                    });
                }

                // do a check of all the bricks in case some of them depend on validity of other bricks in this step
                contentBrick.on("change", function () {
                    that._doInternalCheck();
                });
            },

            _doInternalCheck: function () {
                var flag,
                    that = this;

                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    flag = brick.required.every(function (req) {
                        return that.contentBricks[req].isValid();
                    });

                    // disable or enable a brick based on sum validity of its dependencies
                    brick.disable(!flag);
                });
            },

            getData: function () {
                var data = {};

                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    lang.mixin(data, brick.getData(true));
                });

                return data;
            },

            addChild: function (stepItem) {
                this._optionsNode.append(stepItem.node);
            },

            currentStep: function(bool) {
                if (bool) {

                    this.node.addClass("current-step");

                    this.emit("curentStep", { id: this.id });
                } else {
                    this.node.removeClass("current-step");
                }
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