/* global define, $, TimelineLite, console */

/**
* @module RAMP
* @submodule FilterManager
* @main FilterManager
*/

/**
* Creates a step in the choice tree. A step item can contain several bricks in it and can take different states. Each step can advance and retreat by either displaying its selected child or hiding it.
* 
* ####Imports RAMP Modules:
* {{#crossLink "Util"}}{{/crossLink}}  
* {{#crossLink "TmplHelper"}}{{/crossLink}}  
* {{#crossLink "TmplUtil"}}{{/crossLink}}  
* {{#crossLink "Array"}}{{/crossLink}}  
* {{#crossLink "Dictionary"}}{{/crossLink}}  
* {{#crossLink "Bricks"}}{{/crossLink}}    
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
* @uses dojo/Deferred
* 
* @param {Object} config a config definition of the step item
* @param {String} config.id step item it; can be anything
* @param {Number} config.level level of this step item
* @param {Array} config.content an array of Brick configuration objects
* @param {String} config.content.[].id content brick id
* @param {Brick} config.content.[].type type of the content brick
* @param {Object} config.content.[].config a brick config object that will be passed to Brick.new() init function
* @param {Array} config.content.[].on a set of callbacks set on the create Brick object
* @param {String} config.content.[].on.[].eventName a name of the Brick event the callback should react to
* @param {Function} config.content.[].on.[].callback a function to be executed when the specified event is fired
* 
* @return {StepItem} A built StepItem object.
*/

define([
    "dojo/Evented", "dojo/_base/declare", "dojo/_base/lang", "dojo/Deferred",

    /* Text */
    "dojo/text!./templates/filter_manager_template.json",

    /* Util */
    "utils/util", "utils/tmplHelper", "utils/tmplUtil", "utils/array", "utils/dictionary", "utils/bricks"
],
    function (
        Evented, declare, lang, Deferred,
        filter_manager_template,
        UtilMisc, TmplHelper, TmplUtil, UtilArray, UtilDict, Bricks
    ) {
        "use strict";

        var StepItem,
            ALL_STATES_CLASS,

            templates = JSON.parse(TmplHelper.stringifyTemplate(filter_manager_template));

        StepItem = declare([Evented], {
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

                        /**
                         * Indicates the level of the step, or how far down the tree this step appears. 
                         * 
                         * @property level
                         * @type Number
                         * @default 0
                         * 
                         */
                        level: 0,

                        /**
                         * A node of the StepItem.
                         *
                         * @property node
                         * @type JObject
                         * @default null
                         */
                        node: null,

                        /**
                         * An array of Brick configs and other related properties.
                         * 
                         * @property content
                         * @type {Array}
                         * @default null
                         * @private
                         * @example
                         *     [{
                         *        id: "sourceType",
                         *        type: Bricks.ChoiceBrick,
                         *        config: {
                         *            header: i18n.t("addDataset.dataSource"),
                         *            instructions: i18n.t("addDataset.help.dataSource"),
                         *            choices: [
                         *                {
                         *                    key: "serviceTypeStep",
                         *                    value: i18n.t("addDataset.dataSourceService")
                         *                },
                         *                {
                         *                    key: "fileTypeStep",
                         *                    value: i18n.t("addDataset.dataSourceFile")
                         *                }
                         *            ]
                         *        },
                         *        on: [
                         *            {
                         *                eventName: Bricks.ChoiceBrick.event.CHANGE,
                         *                //expose: { as: "advance" },
                         *                callback: choiceTreeCallbacks.simpleAdvance
                         *            }
                         *        ]
                         *       }]
                         * 
                         */
                        content: null,

                        /**
                         * A collection of build Bricks that can accessed by their ids.
                         * 
                         * @property contentBricks
                         * @type {Object}
                         * @default {}
                         */
                        contentBricks: {},

                        /**
                         * Default template used for building step items.
                         * 
                         * @property template
                         * @type {String}
                         * @default "default_step_template"
                         */
                        template: "default_step_template",

                        /**
                         * Node of the content div.
                         * 
                         * @private
                         * @property _contentNode
                         * @default null
                         */
                        _contentNode: null,
                        /**
                         * Node of the options container.
                         * 
                         * @private
                         * @property _optionsContainerNode
                         * @default null
                         */
                        _optionsContainerNode: null,
                        /**
                         * Node of the options background node. It's used to change the state of the child steps - SUCCESS, ERROR, etc.
                         * 
                         * @private
                         * @property _optionsBackgroundNode
                         * @default null
                         */
                        _optionsBackgroundNode: null,
                        /**
                         * Node of the options div.
                         * 
                         * @private
                         * @property _optionsNode
                         * @default null
                         */
                        _optionsNode: null,

                        /**
                         * A collection of the child step items of this step item. Should not be accessed directly.
                         * 
                         * @private
                         * @property _childSteps
                         * @default {}
                         */
                        _childSteps: {},

                        /**
                         * A step item of the currently active child of this step item. If there is no active child, it means that a choice or action hasn't been made on this step yet or it's the last step in the branch.
                         * 
                         * @private
                         * @property _activeChildStep
                         * @default null
                         */
                        _activeChildStep: null,

                        /**
                         * A step item of the parent step item if any. Used only for animating background when opening/collapsing (error) notices.
                         * 
                         * @private
                         * @property _parent
                         * @default null
                         */
                        _parent: null,

                        /**
                         * An object containing some data. This is used like that: when the step is advanced, a data object is provided by external code; this object is then passed to whichever child is being advanced so it can be retrieved later without external code having to store it somewhere.
                         * 
                         * @private
                         * @property _stepData
                         * @default null
                         */
                        _stepData: {},

                        /**
                         * The current state of this step item.
                         * 
                         * @private
                         * @property _state
                         * @default StepItem.state.DEFAULT,
                         */
                        _state: StepItem.state.DEFAULT,

                        /**
                         * A timeline of this step item. Used for animation
                         * 
                         * @private
                         * @property _timeline
                         */
                        _timeline: new TimelineLite({ paused: true }),
                        /**
                         * A default duration value for all single transitions of any elements of this step.
                         * 
                         * @private
                         * @property _transitionDuration
                         * @default 0.4
                         */
                        _transitionDuration: 0.4
                    },
                    config
                );

                this.node = $(TmplHelper.template.call(null, this.template, config, templates));

                this._contentNode = this.node.find("> .step-content");
                this._optionsContainerNode = this.node.find("> .step-options-container");
                this._optionsBackgroundNode = this._optionsContainerNode.find("> .options-bg");
                this._optionsNode = this._optionsContainerNode.find("> .step-options");

                this.content.forEach(function (contentItem) {
                    that._addContentBrick(contentItem);
                });

                // console.debug("-->", this._state);
            },

            /**
             * Instantiates and adds a new brick to this step item.
             * 
             * @method _addContentBrick
             * @param {Object} contentItem a config object for a Brick
             * @param {Object} contentItem.id Brick id
             * @param {Object} contentItem.config actual Brick config
             * @private
             */
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

            /**
             * Wire up listeners on the given Brick.
             * 
             * @method _wireBrickUp
             * @param  {Object} contentItem  a config object for a Brick
             * @param  {Object} contentBrick an actual Brick instance
             * @private
             */
            _wireBrickUp: function (contentItem, contentBrick) {
                var that = this;
                this.contentBricks[contentBrick.id] = contentBrick;

                // set brick events if specified
                if (contentItem.on) {
                    contentItem.on.forEach(function (o) {
                        contentBrick.on(o.eventName, function (data) {
                            // if there is a callback specified, call it in the context of the brick
                            if (o.callback) {
                                o.callback.call(contentBrick, that, data);
                            }

                            // if event is exposed; emit it
                            if (o.expose) {
                                that._doInternalCheck();
                                that.emit(contentBrick.id + "/" + o.eventName, data);

                                if (o.expose.as) {
                                    that.emit(o.expose.as, {
                                        brick: contentBrick,
                                        brickData: data
                                    });
                                }
                            }
                        });
                    });
                }

                // do a check of all the bricks in case some of them depend on validity of other bricks in this step
                contentBrick.on(Bricks.Brick.event.CHANGE, function () {
                    that._doInternalCheck();
                });
            },

            /**
             * Checks Brick's requirements. Enables or disabled the target Brick based on validity of its requirements.
             * 
             * @method _internalCheckHelper
             * @param  {Array} required      an array of required rules
             * @param  {Brick} targetBrick   a Brick with requirements
             * @param  {Object} contentBricks a dictionary of bricks available in this step
             * @private
             */
            _internalCheckHelper: function (required, targetBrick, contentBricks) {
                var flag = false;

                switch (required.type) {
                    case "all":
                        flag = required.check.every(function (ch) {
                            return contentBricks[ch].isValid();
                        });
                        break;

                    case "any":
                        flag = required.check.some(function (ch) {
                            return contentBricks[ch].isValid();
                        });
                        break;
                }

                // disable or enable a brick based on sum validity of its dependencies
                targetBrick.disable(!flag);
            },

            /**
             * Checks this step item validity by checking validity of all its Bricks.
             * 
             * @method _doInternalCheck
             * @private
             */
            _doInternalCheck: function () {
                var that = this;

                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {

                    if (brick.required) {

                        // if it's a MultiBrick, check requirements for each of the Bricks in MultiBrick 
                        if (Bricks.MultiBrick.isPrototypeOf(brick)) {

                            if (Array.isArray(brick.required)) {

                                brick.required.forEach(function (req) {
                                    that._internalCheckHelper(req, brick.contentBricks[req.id], that.contentBricks);
                                });

                            } else {
                                that._internalCheckHelper(brick.required, brick, that.contentBricks);
                            }

                        } else {
                            that._internalCheckHelper(brick.required, brick, that.contentBricks);
                        }
                    }
                });

                // if the step in the error state and one of the Bricks is changed, switched to the DEFAULT state and switch all the content Bricks
                if (this._state === StepItem.state.ERROR) {
                    this._notifyStateChange(StepItem.state.DEFAULT);
                }
            },

            /**
             * Creates timeline for retreat animation - when the part of the choice tree is collapsing, switching to another branch of the tree.
             * 
             * @method _makeCloseTimeline
             * @param  {Boolean} skipFirst  indicates whether the first child step should be included in the timeline
             * @param  {Boolean} resetState indicates if the child step state should be reset
             * @return {Object}            a constructed close timeline
             * @private
             */
            _makeCloseTimeline: function (skipFirst, resetState) {
                var closeTimeline = new TimelineLite(),
                    closeStagger,
                    closeTimelines = [];

                this._getCloseTimelines(closeTimelines, skipFirst, resetState);
                closeTimelines = closeTimelines.reverse();

                if (closeTimelines.length > 0) {
                    closeStagger = this._transitionDuration / 2 / closeTimelines.length;
                    closeTimeline.add(closeTimelines, "+=0", "start", closeStagger);
                }

                return closeTimeline;
            },

            /**
             * Generates a close timeline for this particular step item and adds it to the global close timeline. Calls the same on the target child.
             *
             * @method _getCloseTimelines
             * @param  {Object} tls   global close timeline
             * @param  {Boolean} skip  indicates whether to skip the first child step item
             * @param  {Boolean} reset indicates whether to reset the step item state to DEFAULT
             * @return {StepItem}       itself
             * @private
             * @chainable
             */
            _getCloseTimelines: function (tls, skip, reset) {
                var tl = new TimelineLite(),

                    that = this;

                if (this._activeChildStep) {

                    if (!skip) {
                        tl
                            .call(function () {
                                //that.currentLevel()
                                that._notifyCurrentStepChange();
                            })
                            .to(this._optionsContainerNode, this._transitionDuration,
                                { top: -this._activeChildStep.getContentOuterHeight(), ease: "easeOutCirc" },
                                0)
                            .set(this._activeChildStep, { className: "-=active-option" })
                            .set(this._optionsContainerNode, { display: "none" })
                        ;

                        tls.push(tl);
                    }

                    if (reset) {
                        this._notifyStateChange(StepItem.state.DEFAULT);
                    }

                    this._activeChildStep._getCloseTimelines(tls);
                }

                return this;
            },

            /**
             * Creates timeline for shift animation - when the selected option for a choice is changing - animating horizontally.
             * 
             * @method _makeShiftTimeline
             * @param  {String} targetChildStepId  specifies the target childId
             * @return {Object}            a constructed shift timeline
             * @private
             */
            _makeShiftTimeline: function (targetChildStepId) {
                var shiftTimeline = new TimelineLite(),
                    targetChildStep = this._childSteps[targetChildStepId],
                    allChildNodes = this._getChildNodes(),
                    otherChildNodes = this._getChildNodes([targetChildStepId]);

                if (this._activeChildStep) {

                    shiftTimeline
                        .set(allChildNodes, { display: "inline-block" })

                        .to(this._optionsBackgroundNode, this._transitionDuration, {
                            height: targetChildStep.getContentOuterHeight(),
                            "line-height": targetChildStep.getContentOuterHeight(),
                            ease: "easeOutCirc"
                        }, 0)

                        .fromTo(this._optionsNode, this._transitionDuration,
                            { left: -this._activeChildStep.getContentPosition().left },
                            { left: -targetChildStep.getContentPosition().left, ease: "easeOutCirc" }, 0)
                        .set(otherChildNodes, { className: "-=active-option" }) // when shifting, active-option is changing
                        .set(targetChildStep.node, { className: "+=active-option" })

                        .set(this._optionsNode, { left: 0 })
                        .set(otherChildNodes, { display: "none" })
                        .call(function () {
                            targetChildStep._notifyStateChange(targetChildStep._state);
                        }, null, null, this._transitionDuration / 3)
                    ;
                }

                return shiftTimeline;
            },

            /**
             * Creates timeline for advance animation - when the part of the choice tree is unfolding, (after switching to another branch of the tree).
             * 
             * @method _makeOpenTimeline
             * @param  {String} targetChildStepId specifies the target child id
             * @param  {Boolean} skipFirst  indicates whether the first child step should be included in the timeline
             * @return {Object}            a constructed open timeline
             * @private
             */
            _makeOpenTimeline: function (targetChildStepId, skipFirst) {
                var openTimeline = new TimelineLite(),
                    openStagger,
                    openTimelines = [];

                this._getOpenTimelines(openTimelines, targetChildStepId, skipFirst);

                if (openTimelines.length > 0) {
                    openStagger = this._transitionDuration / 2 / openTimelines.length;
                    openTimeline.add(openTimelines, "+=0", "start", openStagger);
                }

                return openTimeline;
            },

            /**
             * Generates an open timeline for this particular step item and adds it to the global open timeline. Calls the same on the target child.
             *
             * @method _getOpenTimelines
             * @param  {Object} tls   global open timeline
             * @param  {String} targetChildStepId specifies the target child id
             * @param  {Boolean} skip  indicates whether to skip the first child step item
             * @return {StepItem}       itself
             * @private
             * @chainable
             */
            _getOpenTimelines: function (tls, targetChildStepId, skip) {
                var tl = new TimelineLite(),
                    targetChildStep = targetChildStepId ? this._childSteps[targetChildStepId] : this._activeChildStep,
                    otherChildNodes = this._getChildNodes([targetChildStepId]);

                if (targetChildStep) {

                    if (!skip) {

                        tl
                            // set options container node to visible, otherwise you can't get its size
                            .set(this._optionsContainerNode, { display: "block", top: -9999 }, 0)

                            // make sure options' node is on the left
                            .set(this._optionsNode, { left: 0 }, 0)

                            // hide children other than target
                            .set(otherChildNodes, { display: "none" }, 0)
                            .set(targetChildStep.node, { className: "+=active-option", display: "inline-block" }, 0)

                            // make the target step current
                            .call(function () {
                                targetChildStep._notifyCurrentStepChange();
                            })

                            // animate step's background
                            .to(this._optionsBackgroundNode, 0, {
                                height: targetChildStep.getContentOuterHeight(),
                                "line-height": targetChildStep.getContentOuterHeight()
                            }, 0)

                            // animate height and position of the options' container node
                            .to(this._optionsContainerNode, 0, { height: targetChildStep.getContentOuterHeight(), ease: "easeOutCirc" }, 0)
                            .fromTo(this._optionsContainerNode, this._transitionDuration,
                                { top: -this._optionsContainerNode.height() },
                                { top: 0, ease: "easeOutCirc" },
                                0)
                            .set(this._optionsContainerNode, { height: "auto" })
                        ;

                        tls.push(tl);
                    }

                    this._notifyStateChange(StepItem.state.SUCCESS);
                    // hide all notices when making a step successful
                    this.displayBrickNotices();
                    targetChildStep._getOpenTimelines(tls);
                }

                return this;
            },

            /**
             * Returns an array of child step nodes except for steps whose ids are passed in `except` param.
             * 
             * @method _getChildNodes
             * @private
             * @param  {Array} except an array of child step ids to not include in the result
             * @return {Array}        an array of child step nodes
             */
            _getChildNodes: function (except) {
                var childNodes = [];

                UtilDict.forEachEntry(this._childSteps,
                    function (childId, childItem) {
                        if (!except || except.indexOf(childItem.id) === -1) {
                            childNodes.push(childItem.node);
                        }
                    }
                );

                return childNodes;
            },

            /**
             * Emits a `CURRENT_STEP_CHANGE` event with a payload of id and level of the current step item.
             * This notifies the trunk of the tree and this step is now a current step. The trunk in turn notifies 
             * every other step that they are not current steps.
             *
             * @method _notifyCurrentStepChange
             * @private
             */
            _notifyCurrentStepChange: function () {
                this._emit(StepItem.event.CURRENT_STEP_CHANGE, { id: this.id, level: this.level });
            },

            /**
             * Emits a `STATE_CHANGE` event with a payload of id, level and state of the current step item.
             * Additionally sets state of all the content bricks to corresponding states.
             * 
             * @method _notifyStateChange
             * @private
             * @chainable
             * @param  {String} state state to set the step item to
             * @return {StepItem}       itself
             */
            _notifyStateChange: function (state) {
                var brickState;

                this._state = state;

                switch (state) {
                    case StepItem.state.SUCCESS:
                        brickState = Bricks.Brick.state.SUCCESS;
                        break;
                    case StepItem.state.ERROR:
                        brickState = Bricks.Brick.state.ERROR;
                        break;
                    default:
                        brickState = Bricks.Brick.state.DEFAULT;
                        break;
                }

                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    brick.setState(brickState);
                });

                this._emit(StepItem.event.STATE_CHANGE, { id: this.id, level: this.level, state: this._state });

                return this;
            },

            /**
             * A helper function to emit a supplied event with payload.
             * 
             * @private
             * @chainable
             * @param  {String} event   event name
             * @param  {Object} [payload] payload object
             * @return {StepItem}         itself
             */
            _emit: function (event, payload) {
                this.emit(event, payload);

                return this;
            },

            /**
             * Returns step data and data from all content bricks.
             * 
             * @return {Object} step data and brick data
             */
            getData: function () {
                var data = {
                    stepData: this._stepData,
                    bricksData: {}
                };

                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    lang.mixin(data.bricksData, brick.getData(true));
                });

                return data;
            },

            /**
             * Adds a given step item object as a child for this step item.
             * 
             * @method addChild
             * @chainable
             * @param {StepItem} stepItem a stepItem object to be added as a child.
             * @return {StepItem} itself
             */
            addChild: function (stepItem) {
                this._optionsNode.append(stepItem.node);
                this._childSteps[stepItem.id] = stepItem;
                stepItem._parent = this;

                return this;
            },

            /**
             * Clears this step by resetting its state to `DEFAULT`, clearing all content bricks, and hide all brick notices.
             * 
             * @method 
             * @param  {Array} brickIds [description]
             * @return {StepItem}          itself
             * @chainable
             */
            clearStep: function (brickIds) {
                var bricks = []; // bricks from whose notices should be hidden

                // clear this steps state
                this._notifyStateChange(StepItem.state.DEFAULT);

                if (Array.isArray(brickIds)) {
                    brickIds.forEach(function (brickId) {
                        this.contentBricks[brickId].clear();

                        bricks.push(this.contentBricks[brickId]);
                    });
                } else {
                    UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                        brick.clear();

                        bricks.push(brick);
                    });
                }

                // hide all notices when clearing the step
                this.displayBrickNotices();

                return this;
            },

            /**
             * Sets the step specified by the `level` and `stepId` to a specified state.
             * 
             * @method setState
             * @param {Number} level  level of the step to set the state on
             * @param {String} stepId id of the step to set the state on
             * @param {String} state  name of the state to set
             */
            setState: function (level, stepId, state) {
                var that = this;

                // if this step is the first step in the tree and so is the current step, set state class on its main node
                if (this.level === 1 && level === 1) {
                    this.node
                        .removeClass(ALL_STATES_CLASS)
                        .addClass(state);
                } else {
                    // if not, go over the children and if one corresponds to the current step, set state class on the options (children) container
                    UtilDict.forEachEntry(this._childSteps,
                        function (childId, childStep) {
                            if (childId === stepId && childStep.level === level) {
                                that._optionsContainerNode
                                    .removeClass(ALL_STATES_CLASS)
                                    .addClass(state);
                            }
                        }
                    );
                }
            },

            /**
             * Makes the step specified by the `level` and `stepId` a current step by setting a proper CSS class.
             * 
             * @method currentStep
             * @param  {Number} level  step level
             * @param  {String} stepId step id
             */
            currentStep: function (level, stepId) {
                var that = this;

                // if this step is the first step in the tree and so is the current step, set class on the main node of this step 
                if (this.level === 1 && level === 1) {
                    this.node.addClass(StepItem.currentStepClass);
                } else {
                    this.node.removeClass(StepItem.currentStepClass);
                    this._optionsContainerNode.removeClass(StepItem.currentStepClass);

                    // if not, go over the children and if one corresponds to the current step, set class on the options (children) container
                    UtilDict.forEachEntry(this._childSteps,
                        function (childId, childStep) {
                            if (childId === stepId && childStep.level === level) {
                                that._optionsContainerNode.addClass(StepItem.currentStepClass);
                            }
                        }
                    );
                }
            },

            /**
             * Checks if the step is valid. It's considered valid if all its content bricks are valid.
             *
             * @method isValid
             * @return {Boolean} true if completed; false, otherwise
             */
            isValid: function () {
                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    if (!brick.isValid()) {
                        return false;
                    }
                });

                return true;
            },

            /**
             * Checks if the step is completed. It's considered completed if its state is SUCCESS.
             *
             * @method isCompleted
             * @return {Boolean} true if completed; false, otherwise
             */
            isCompleted: function () {
                return this._state === StepItem.state.SUCCESS;
            },

            /**
             * Sets data to the content brick
             * 
             * @method setData
             * @param {Object} data a data object 
             * @param {Object} [data.bricksData] dictionary of data where keys are brick ids and values data to be passed to the corresponding bricks
             * @param {Object} [data.stepData] some data object to be saved in this step 
             * @return {StepItem} itself
             * @chainable
             */
            setData: function (data) {
                var that = this;

                if (data) {
                    if (data.bricksData) {
                        UtilDict.forEachEntry(data.bricksData, function (brickId, brickData) {
                            that.contentBricks[brickId].setData(brickData);
                        });
                    }

                    if (data.stepData) {
                        this._stepData = data.stepData;
                    }
                }
            },

            /**
             * Set Brick notices, mostly errors.
             * 
             * @method displayBrickNotices
             * @param  {Object} [data] a dictionary of objects containing Brick notices
             */
            displayBrickNotices: function (data) {
                var that = this,
                    bricks = [],
                    promise;

                if (data) {
                    UtilDict.forEachEntry(data, function (brickId, brickData) {
                        that.contentBricks[brickId].displayNotice(brickData);

                        bricks.push(that.contentBricks[brickId]);
                    });

                    // toggle notice 
                    this._toggleBrickNotices(bricks, data);
                } else {
                    UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                        bricks.push(brick);
                    });

                    // if no data provided, first hide all existing notices, then empty them
                    promise = this._toggleBrickNotices(bricks, data);

                    promise.then(function () {
                        bricks.forEach(function (brick) {
                            brick.displayNotice();
                        });
                    });
                }
            },

            /**
             * Toggles the visibility of notices for specified bricks.
             * 
             * @method _toggleBrickNotices
             * @private
             * @param  {Array} bricks an array of Brick items to toggle notices on
             * @param  {Boolean} show   a flag indicating whether to show or hide the notices
             * @return {Promise}        a promise that is resolved after animation is completed
             */
            _toggleBrickNotices: function (bricks, show) {
                var that = this,
                    notices,
                    contentHeight = this.getContentOuterHeight(),
                    heightChange = 0,
                    tl = new TimelineLite({ paused: true }),
                    def = new Deferred();

                tl.eventCallback("onComplete", function () {
                    def.resolve();
                });

                // filter out bricks that don't have any notices
                notices = bricks
                    .map(function (brick) { return brick.noticeNode; })
                    .filter(function (notice) { return notice.length > 0; })
                ;

                if (show) {
                    tl.set(notices, { height: 0, visibility: "visible", position: "relative" }, 0);
                }

                // add notice animation to the timeline
                notices.forEach(function (notice) {

                    heightChange += notice.height();

                    tl
                        .to(notice, that._transitionDuration / 2, { height: show ? notice.height() : 0, ease: "easeOutCirc" }, 0)
                    ;

                });

                if (!show) {
                    tl.set(notices, { clearProps: "all" });
                }

                heightChange = show ? 0 : -heightChange;

                // change the height of the parent's option background container to accommodate for notice height 
                if (this._parent) {
                    tl.to(this._parent._optionsBackgroundNode, this._transitionDuration / 2, {
                        height: contentHeight + heightChange,
                        "line-height": contentHeight + heightChange,
                        ease: "easeOutCirc"
                    }, 0);
                }

                tl.play();

                return def.promise;
            },

            /**
             * Retreats the current step item by collapsing its active children and resetting their states to default. After, active child step is set to null.
             * 
             * @method retreat
             * @return {StepItem} itself
             * @chainable
             */
            retreat: function () {
                var closeTimeline,
                    that = this;

                this._timeline
                    .seek("+=0", false)
                    .clear()
                ;

                closeTimeline = this._makeCloseTimeline(false, true);

                this._timeline
                    .add(closeTimeline)
                    .call(function () {
                        that._activeChildStep = null;
                    })
                ;

                this._timeline.play(0);

                return this;
            },

            /**
             * Advances the current step to the step with the provided id. The target id has to be a child step.
             * Additionally, the tree expands down if the target child has an active child as well, and so on, until no active child is present.
             * 
             * @method advance
             * @param  {String} targetChildStepId id of the new target step of advance too
             * @param  {Object} [targetChildData]   data to be passed to the target step as it opens
             * @return {StepItem}                   itself
             */
            advance: function (targetChildStepId, targetChildData) {
                var closeTimeline,
                    shiftTimeline,
                    openTimeline,
                    targetChildStep = this._childSteps[targetChildStepId],
                    skipFirst,

                    that = this;

                // cannot advance if the target is not specified
                if (!targetChildStep) {
                    return this;
                }

                // reset timeline to the start and clear all the other rubbish that might be running already
                this._timeline
                    .seek("+=0", false)
                    .clear()
                ;

                // if there is already an active child step, skip the first animation
                skipFirst = this._activeChildStep ? true : false;

                targetChildStep.setData(targetChildData);

                closeTimeline = this._makeCloseTimeline(skipFirst);
                shiftTimeline = this._makeShiftTimeline(targetChildStepId);
                openTimeline = this._makeOpenTimeline(targetChildStepId, skipFirst);

                this._timeline
                    .add(closeTimeline)
                    .add(shiftTimeline)
                    .add(openTimeline)
                    .call(function () {
                        // only when animation completes, set the active child to the target child
                        that._activeChildStep = targetChildStep;
                    })
                ;

                this._timeline.play(0);

                return this;
            },

            /**
             * Get position of the content node.
             * 
             * @method getContentPosition
             * @return {Object} jQuery position object of the content node
             */
            getContentPosition: function () {
                return this._contentNode.position();
            },

            /**
             * Get outer height of the content node
             * 
             * @method getContentOuterHeight
             * @return {Number} outer height of the content node
             */
            getContentOuterHeight: function () {
                return this._contentNode.outerHeight();
            }
        });

        lang.mixin(StepItem,
            {
                /**
                 * Specifies the current step CSS class name.
                 * 
                 * @property currentStepClass
                 * @static
                 * @type {String}
                 */
                currentStepClass: "current-step",

                /**
                 * A collection of possible StepItem states and their names.
                 * 
                 * @propery state
                 * @static
                 * @type {Object}
                 * @example
                 *     state: {
                 *           SUCCESS: "step-state-success",
                 *           ERROR: "step-state-error",
                 *           DEFAULT: "step-state-default",
                 *           LOADING: "step-state-loading"
                 *       }
                 * 
                 */
                state: {
                    SUCCESS: "step-state-success",
                    ERROR: "step-state-error",
                    DEFAULT: "step-state-default",
                    LOADING: "step-state-loading"
                },

                /**
                 * Event names published by the StepItem
                 *
                 * @property event
                 * @static
                 * @type Object
                 * @example
                 *      {
                 *          CURRENT_STEP_CHANGE: "stepItem/currentStepChange",
                 *          STATE_CHANGE: "stepItem/stateChange"
                 *      }
                 */
                event: {
                    /**
                    * Published whenever a StepItem becomes a current step. A current step has a distinct visual style.
                    *
                    * @event StepItem.event.CURRENT_STEP_CHANGE
                    * @param event {Object}
                    * @param event.level {Number} Level of the StepItem that became a current step
                    * @param event.id {String} Id of the StepItem that became a current step
                    */
                    CURRENT_STEP_CHANGE: "stepItem/currentStepChange",

                    /**
                    * Published whenever a StepItem changes its state. 
                    * 
                    * @event StepItem.event.CURRENT_STEP_CHANGE
                    * @param event {Object}
                    * @param event.level {Number} Level of the StepItem that became a current step
                    * @param event.id {String} Id of the StepItem that became a current step
                    * @param event.state {String} name of the state
                    */
                    STATE_CHANGE: "stepItem/stateChange"
                }
            }
        );

        // a string with all possible StepItem state CSS classes joined by " "; used to clear any CSS state class from the node
        ALL_STATES_CLASS =
            Object
                .getOwnPropertyNames(StepItem.state)
                .map(function (key) { return StepItem.state[key]; })
                .join(" ");

        return StepItem;
    });