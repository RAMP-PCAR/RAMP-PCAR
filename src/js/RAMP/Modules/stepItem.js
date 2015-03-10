﻿/* global define, $, TimelineLite, console */

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
                        level: 0,

                        /**
                         * A node of the StepItem.
                         *
                         * @property node
                         * @type JObject
                         * @default null
                         */
                        node: null,

                        content: null,
                        contentBricks: {},

                        template: "default_step_template",

                        _contentNode: null,
                        _optionsContainerNode: null,
                        _optionsBackgroundNode: null,
                        _optionsNode: null,

                        _childSteps: {},
                        _activeChildStep: null,

                        _parent: null,

                        _stepData: {},

                        _state: StepItem.state.DEFAULT,

                        _timeline: new TimelineLite({ paused: true }),
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

                console.debug("-->", this._state);
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

            _doInternalCheck: function () {
                var that = this;

                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {

                    if (brick.required) {

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

            _getOpenTimelines: function (tls, targetChildStepId, skip) {
                var tl = new TimelineLite(),
                    targetChildStep = targetChildStepId ? this._childSteps[targetChildStepId] : this._activeChildStep,
                    otherChildNodes = this._getChildNodes([targetChildStepId]);

                if (targetChildStep) {

                    if (!skip) {

                        tl
                            // set options contaner node to visible, otherwise you can't get its size
                            .set(this._optionsContainerNode, { display: "block", top: -9999 }, 0)

                            // make sure options' node is on the left
                            .set(this._optionsNode, { left: 0 }, 0)

                            // hide children other than target
                            .set(otherChildNodes, { display: "none" }, 0)
                            .set(targetChildStep.node, { className: "+=active-option", display: "inline-block" }, 0)

                            // make the targe step current
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

            _notifyCurrentStepChange: function () {
                this._emit(StepItem.event.CURRENT_STEP_CHANGE, { id: this.id, level: this.level });
            },

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

            _emit: function (event, payload) {
                this.emit(event, payload);
            },

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

            addChild: function (stepItem) {
                this._optionsNode.append(stepItem.node);
                this._childSteps[stepItem.id] = stepItem;
                stepItem._parent = this;

                return this;
            },

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

            setState: function (level, stepId, state) {
                var that = this;

                if (this.level === 1 && level === 1) {
                    this.node
                        .removeClass(ALL_STATES_CLASS)
                        .addClass(state);
                } else {
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

            currentStep: function (level, stepId) {
                var that = this;

                if (this.level === 1 && level === 1) {
                    this.node.addClass(StepItem.currentStepClass);
                } else {
                    this.node.removeClass(StepItem.currentStepClass);
                    this._optionsContainerNode.removeClass(StepItem.currentStepClass);

                    UtilDict.forEachEntry(this._childSteps,
                        function (childId, childStep) {
                            if (childId === stepId && childStep.level === level) {
                                that._optionsContainerNode.addClass(StepItem.currentStepClass);
                            }
                        }
                    );
                }
            },

            isValid: function () {
                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    if (!brick.isValid()) {
                        return false;
                    }
                });

                return true;
            },

            isCompleted: function () {
                return this._state === StepItem.state.SUCCESS;
            },

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

            displayBrickNotices: function (data) {
                var that = this,
                    bricks = [];

                if (data) {
                    UtilDict.forEachEntry(data, function (brickId, brickData) {
                        that.contentBricks[brickId].displayNotice(brickData);

                        bricks.push(that.contentBricks[brickId]);
                    });                    
                } else {
                    UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                        brick.displayNotice();

                        bricks.push(brick);
                    });
                }

                this._toggleBrickNotices(bricks, data);
            },

            _toggleBrickNotices: function (bricks, show) {
                var that = this,
                    notices,
                    contentHeight = this.getContentOuterHeight(),
                    heightChange = 0,
                    tl = new TimelineLite({ paused: true });

                notices = bricks
                    .map(function (brick) { return brick.noticeNode; })
                    .filter(function (notice) { return notice.length > 0; })
                ;

                if (show) {
                    tl.set(notices, { height: 0, visibility: "visible", position: "relative" }, 0);
                } 

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

                if (this._parent) {
                    tl.to(this._parent._optionsBackgroundNode, this._transitionDuration / 2, {
                        height: contentHeight + heightChange,
                        "line-height": contentHeight + heightChange,
                        ease: "easeOutCirc"
                    }, 0);
                }

                tl.play();
            },

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

                this._timeline
                    .seek("+=0", false)
                    .clear()
                ;

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
                        that._activeChildStep = targetChildStep;
                    })
                ;

                this._timeline.play(0);

                return this;
            },

            getContentPosition: function () {
                return this._contentNode.position();
            },

            getContentOuterHeight: function () {
                return this._contentNode.outerHeight();
            }
        });

        lang.mixin(StepItem,
            {
                currentStepClass: "current-step",

                state: {
                    SUCCESS: "step-state-success",
                    ERROR: "step-state-error",
                    DEFAULT: "step-state-default",
                    LOADING: "step-state-loading"
                },

                /**
                 * Event names published by the StepItem
                 *
                 * @private
                 * @property event
                 * @type Object
                 * @default null
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
                    * @event CURRENT_STEP_CHANGE
                    * @param event {Object}
                    * @param event.level {Number} Level of the StepItem that became a current step
                    * @param event.id {String} Id of the StepItem that became a current step
                    */
                    CURRENT_STEP_CHANGE: "stepItem/currentStepChange",

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