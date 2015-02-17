/* global define, $, TimelineLite, console */

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
            //ALL_STATES_CLASS,

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
                        _contentBricks: {},

                        template: "default_step_template",

                        _contentNode: null,
                        _optionsContainerNode: null,
                        _optionsBackgroundNode: null,
                        _optionsNode: null,

                        _childSteps: {},
                        _activeChildStep: null,

                        state: "",

                        _timeline: new TimelineLite({ paused: true }),
                        _transitionDuration: 0.4
                    },
                    config
                );

                this.node = $(TmplHelper.template(this.template, config, templates));

                this._contentNode = this.node.find("> .step-content");
                this._optionsContainerNode = this.node.find("> .step-options-container");
                this._optionsBackgroundNode = this._optionsContainerNode.find("> .options-bg");
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
                this._contentBricks[contentBrick.id] = contentBrick;

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
                                    that.emit(o.expose.as, data);
                                }
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

                UtilDict.forEachEntry(this._contentBricks, function (key, brick) {
                    flag = brick.required.every(function (req) {
                        return that._contentBricks[req].isValid();
                    });

                    // disable or enable a brick based on sum validity of its dependencies
                    brick.disable(!flag);
                });
            },

            getData: function () {
                var data = {};

                UtilDict.forEachEntry(this._contentBricks, function (key, brick) {
                    lang.mixin(data, brick.getData(true));
                });

                return data;
            },

            addChild: function (stepItem) {
                this._optionsNode.append(stepItem.node);
                this._childSteps[stepItem.id] = stepItem;

                return this;
            },

            retreat: function () {
                var closeTimeline,
                    that = this;

                this._timeline

                    .seek("+=0", false)
                    .clear()
                ;

                closeTimeline = this.makeCloseTimeline();

                this._timeline
                    .add(closeTimeline)
                    .call(function () {
                        that._activeChildStep = null;
                    })
                ;

                this._timeline.play(0);

                return this;
            },

            advance: function (targetChildStepId) {
                var closeTimeline,
                    shiftTimeline,
                    openTimeline,
                    targetChildStep = this._childSteps[targetChildStepId],
                    skipFirst,

                    that = this;

                this._timeline
                    .seek("+=0", false)
                    .clear()
                ;

                skipFirst = this._activeChildStep ? true : false;

                closeTimeline = this.makeCloseTimeline(skipFirst);
                shiftTimeline = this.makeShiftTimeline(targetChildStepId);
                openTimeline = this.makeOpenTimeline(targetChildStepId, skipFirst);

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

            makeCloseTimeline: function (skipFirst) {
                var closeTimeline = new TimelineLite(),
                    closeStagger,
                    closeTimelines = [];

                this.getCloseTimelines(closeTimelines, skipFirst);
                closeTimelines = closeTimelines.reverse();

                if (closeTimelines.length > 0) {
                    closeStagger = this._transitionDuration / 2 / closeTimelines.length;
                    closeTimeline.add(closeTimelines, "+=0", "start", closeStagger);
                }

                return closeTimeline;
            },

            getCloseTimelines: function (tls, skip) {
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

                    this._activeChildStep.getCloseTimelines(tls);
                }

                return this;
            },

            makeShiftTimeline: function (targetChildStepId) {
                var shiftTimeline = new TimelineLite(),
                    targetChildStep = this._childSteps[targetChildStepId],
                    allChildNodes = this.getChildNodes(),
                    otherChildNodes = this.getChildNodes([targetChildStepId]);

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
                    ;
                }

                return shiftTimeline;
            },

            makeOpenTimeline: function (targetChildStepId, skipFirst) {
                var openTimeline = new TimelineLite(),
                    openStagger,
                    openTimelines = [];

                this.getOpenTimelines(openTimelines, targetChildStepId, skipFirst);

                if (openTimelines.length > 0) {
                    openStagger = this._transitionDuration / 2 / openTimelines.length;
                    openTimeline.add(openTimelines, "+=0", "start", openStagger);
                }

                return openTimeline;
            },

            getOpenTimelines: function (tls, targetChildStepId, skip) {
                var tl = new TimelineLite(),
                    targetChildStep = targetChildStepId ? this._childSteps[targetChildStepId] : this._activeChildStep,
                    otherChildNodes = this.getChildNodes([targetChildStepId]);

                if (targetChildStep) {

                    if (!skip) {

                        tl
                            .set(this._optionsContainerNode, { display: "block", top: -9999 }, 0)

                            // make sure options' node is on the left
                            .set(this._optionsNode, { left: 0 }, 0)

                            // hide children other than target
                            .set(otherChildNodes, { display: "none" }, 0)
                            .set(targetChildStep.node, { className: "+=active-option", display: "inline-block" }, 0)

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

                    targetChildStep.getOpenTimelines(tls);
                }

                return this;
            },

            getContentPosition: function () {
                return this._contentNode.position();
            },

            getContentOuterHeight: function () {
                return this._contentNode.outerHeight();
            },

            getChildNodes: function (except) {
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
                this._emit("currentStepChange", { id: this.id, level: this.level });
            },

            _emit: function (event, payload) {
                this.emit(event, payload);
            },

            currentStep: function (level, stepId) {
                var that = this;

                if (this.level === 1 && level === 1) {
                    this.node.addClass("current-step");
                } else {
                    this.node.removeClass("current-step");
                    this._optionsContainerNode.removeClass("current-step");

                    UtilDict.forEachEntry(this._childSteps,
                        function (childId, childStep) {
                            if (childId === stepId && childStep.level === level) {
                                that._optionsContainerNode.addClass("current-step");
                            }
                        }
                    );
                }
            }
        });

        return StepItem;
    });