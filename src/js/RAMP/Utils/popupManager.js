/*global define, window, $, document */

/**
* Utility module containint useful static classes.
*
* @module Utils
*/

/**
* A static class to simplify the creation of UI popups, where a popup is a section of the page hidden and shown in
* response to some user or system action. This class takes care of assigning aria-* attributes and keeping them updated.
*
* @class PopupManager
* @static
* @uses dojo/Deferred
* @uses dojo/_base/lang
* @uses Util
*/
define(["dojo/Deferred", "dojo/_base/lang", "utils/util"],
    function (Deferred, lang, UtilMisc) {
        "use strict";

        /**
        * A class holding properties of the popup.
        *
        * @class PopupBaseSettings
        * @for PopupBase
        */
        var popupBaseAttrTemplate = {
            /**
             * The name of the event or events separated by a comma to trigger the closing of the popup.
             *
             * @property reverseEvent
             * @type {String}
             * @default null
             * @for PopupBaseSettings
             */
            reverseEvent: null,

            /**
            * The initially supplied handle to the PopupManager; a {{#crossLink "jQuery"}}{{/crossLink}} to listen to events on.
            *
            * @property handle
            * @type {JQuery}
            * @default null
            * @for PopupBaseSettings
            */
            handle: null,

            /**
            * The initially supplied handle selector to be used in conjunction with handle when listening to events. Useful if the real handle doesn't exist yet.
            *
            * @property handleSelector
            * @type {String}
            * @default null
            */
            handleSelector: null,

            /**
            * The initially supplied target node of the popup.
            *
            * @property target
            * @type {JQuery}
            * @default null
            */
            target: null,

            /**
            * The initially supplied target selector to be used in conjunction with target. Useful when the target of the popup doesn't exist yet.
            *
            * @property targetSelector
            * @type {String}
            * @default null
            */
            targetSelector: null,

            targetContainerSelector: null,

            /**
            * The function to execute when the popup opens.
            *
            * @property openHandler
            * @type {Function}
            * @default null
            */
            openHandler: null,

            /**
            * The function to execute when the popup closes. If the function is not supplied, `openHandler` is used instead.
            *
            * @property closeHandler
            * @type {Function}
            * @default null
            */
            closeHandler: null,

            /**
            * The delay before closing the popup; used with "hoverIntent" event type.
            *
            * @property timeout
            * @type {Number}
            * @default 0
            */
            timeout: 0,

            /**
            * The CSS class to be applied to the handle of the popup when the popup opens.
            *
            * @property activeClass
            * @type {String}
            * @default random guid
            */
            activeClass: null,

            /**
            * Indicates whether activeClass should be applied before openHandler function completes or after.
            *
            * @property setClassBefore
            * @type {String}
            * @default null
            */
            setClassBefore: false,

            /**
            * Indicates whether to apply aria-* attributes to DOM nodes.
            *
            * @property useAria
            * @type {Boolean}
            * @default true
            */
            useAria: true,

            /**
            * Indicates whether focus should be reset to the handle of the popup when the popup is closed by the internal close button if present.
            *
            * @property resetFocusOnClose
            * @type {Boolean}
            * @default false
            */
            resetFocusOnClose: false
        },

        /**
        * An abstract representation of the popup definition that potentially references many Popup instances. Handle and target properties might use selectors.
        *
        * @class PopupBase
        * @for PopupManager
        */
            popupBaseTemplate = {
                /**
                * Properties object of the PopupBase.
                *
                * @property  _attr
                * @private
                * @type {PopupBaseSettings}
                * @for PopupBase
                */
                _attr: null,

                /**
                * Finds and returns actual DOM nodes of popup handles, one or more. Used selector
                *
                * @method _getActualHandle
                * @private
                * @param {JQuery} [selector] A {{#crossLink "jQuery"}}{{/crossLink}} of the actual handle.
                * @return result An array of one or more jQuery objects that works as popup handles
                */
                _getActualHandle: function (selector) {
                    var result;

                    if (selector) {
                        result = $(selector);
                    } else if (this._attr.handle) {
                        result = this._attr.handleSelector ? this._attr.handle.find(this._attr.handleSelector) : this._attr.handle;
                    }

                    return result;
                },

                /**
                * Finds and returns an array of {{#crossLink "Popup"}}{{/crossLink}} objects, one or more, identified in the PopupBase.
                *
                * @method _spawnPopups
                * @private
                * @param {JQuery} [selector] A {{#crossLink "jQuery"}}{{/crossLink}} of the actual handle.
                * @return popups An array of one or more {{#crossLink "Popup"}}{{/crossLink}} objects
                */
                _spawnPopups: function (selector) {
                    var popups = [],
                        actualHandle = this._getActualHandle(selector),
                        actualTarget;

                    actualHandle.each(lang.hitch(this,
                        function (i, ah) {
                            ah = $(ah);

                            if (this._attr.target) {
                                actualTarget = this._attr.targetSelector ? this._attr.target.find(this._attr.targetSelector) : this._attr.target;
                            } else if (this._attr.targetContainerSelector && this._attr.targetSelector) {
                                actualTarget = ah.parents(this._attr.targetContainerSelector).find(this._attr.targetSelector);
                            } else {
                                // if the target cannot be found, a handle its returned
                                actualTarget = this._attr.targetSelector ? ah.find(this._attr.targetSelector) : ah;
                            }

                            if (actualTarget.length > 0) {
                                popups.push(
                                    lang.mixin(Object.create(popupTempate), {
                                        openHandler: this._attr.openHandler,
                                        closeHandler: this._attr.closeHandler || this._attr.openHandler,

                                        activeClass: this._attr.activeClass,
                                        setClassBefore: this._attr.setClassBefore,
                                        useAria: this._attr.useAria,
                                        resetFocusOnClose: this._attr.resetFocusOnClose,

                                        handle: actualHandle,
                                        target: actualTarget
                                    })
                                );
                            }
                        }));

                    return popups;
                },

                /**
                * Checks if any of the popups described by this PopupBase is closed.
                *
                * @method isOpen
                * @param {JQuery} [selector] A {{#crossLink "jQuery"}}{{/crossLink}} of the actual handle.
                * @return result True if any of the described popup are open; false otherwise
                */
                isOpen: function (selector) {
                    var result = true;

                    this._spawnPopups(selector).forEach(function (p) {
                        if (!p.isOpen()) {
                            result = false;
                        }
                    });

                    return result;
                },

                /**
                * Opens all the popups described by this PopupBase instance.
                *
                * @method open
                * @param {JQuery} [selector] A {{#crossLink "jQuery"}}{{/crossLink}} of the actual handle.
                */
                open: function (selector) {
                    this._spawnPopups(selector).forEach(function (p) {
                        p.open();
                    });
                },

                /**
                * Closes all the popups described by this PopupBase instance.
                *
                * @method close
                * @param {JQuery} [selector] A {{#crossLink "jQuery"}}{{/crossLink}} of the actual handle.
                */
                close: function (selector) {
                    this._spawnPopups(selector).forEach(function (p) {
                        p.close();
                    });
                },

                /**
                * Toggles all the popups described by this PopupBase instance.
                *
                * @method toggle
                * @param {JQuery} [selector] A {{#crossLink "jQuery"}}{{/crossLink}} of the actual handle. Generally, selector is not needed if popup manages only one handle/target pair.
                * @param {Boolean} [state] Indicates if the popup should be toggled on or off. true - open; false - close;
                */
                toggle: function (selector, state) {
                    this._spawnPopups(selector).forEach(function (p) {
                        p.toggle(state);
                    });
                },

                /**
                * Sets the appropriate aria-* attributes to the popup nodes according to the supplied `visible` parameter or with the internal state of the popup.
                *
                * @method setTargetAttr
                * @param {Boolean} [visible] Indicating the internal state of the popup
                */
                setTargetAttr: function (visible) {
                    this._spawnPopups().forEach(function (p) {
                        p.setTargetAttr(visible);
                    });
                }
            },

        /**
        * A concrete instance of popup referencing actual DOM nodes as its handle and target.
        *
        * @class Popup
        * @for PopupManager
        */
            popupTempate = {
                /**
                * Indicates if the Popup target is being animated.
                *
                * @property _isAnimating
                * @type {Boolean}
                * @for Popup
                * @private
                */
                _isAnimating: false,

                /**
                * The function to execute when the popup opens.
                *
                * @property openHandler
                * @type {Function}
                * @default null
                */
                openHandler: null,

                /**
                * The function to execute when the popup closes.
                *
                * @property closeHandler
                * @type {Function}
                * @default null
                */
                closeHandler: null,

                /**
                * The CSS class to be applied to the handle of the popup when the popup opens.
                *
                * @property activeClass
                * @type {String}
                * @default null
                */
                activeClass: null,

                /**
                * Indicates whether activeClass should be applied before openHandler function completes or after.
                *
                * @property setClassBefore
                * @type {String}
                * @default null
                */
                setClassBefore: null,

                /**
                * Indicates whether to apply aria-* attributes to DOM nodes.
                *
                * @property useAria
                * @type {Boolean}
                * @default true
                */
                useAria: null,

                /**
                * An actual {{#crossLink "jQuery"}}{{/crossLink}} of the handle's DOM node.
                *
                * @property handle
                * @type {JQuery}
                * @default null
                */
                handle: null,

                /**
                * An actual {{#crossLink "jQuery"}}{{/crossLink}} of the targets's DOM node.
                *
                * @property target
                * @type {JQuery}
                * @default null
                */
                target: null,

                /**
                * Checks if this Popup is open.
                *
                * @method isOpen
                * @return {Boolean} True if open, false otherwise
                */
                isOpen: function () {
                    return this.handle.hasClass(this.activeClass);
                },

                /**
                * Opens this Popup.
                *
                * @method open
                */
                open: function () {
                    this._performAction(
                        this.openHandler,

                        function () {
                            this.handle.addClass(this.activeClass);
                        },

                        function () {
                            this.setTargetAttr(true);
                        }
                    );
                },

                /**
                * Closes this Popup.
                *
                * @method close
                */
                close: function () {
                    this._performAction(
                        this.closeHandler,

                        function () {
                            this.handle.removeClass(this.activeClass);
                        },

                        function () {
                            this.setTargetAttr(false);
                        }
                    );
                },

                /**
                * Toggles this Popup.
                *
                * @method toggle
                * @param {Boolean} [state] Indicates if the popup should be toggled on or off. true - open; false - close;
                */
                toggle: function (state) {
                    state = UtilMisc.isUndefined(state) ? this.isOpen() : !state;
                    if (state) {
                        this.close();
                    } else {
                        this.open();
                    }
                },

                /**
                * Performs actions like closing and opening on this Popup.
                *
                * @method _performAction
                * @private
                * @param {Function} action Open or close action on this Popup
                * @param {Function} cssAction Function setting style properties on this Popup
                * @param {Function} callback The callback to be executed
                */
                _performAction: function (action, cssAction, callback) {
                    if ($.isFunction(action) && !this._isAnimating) {
                        var deferred = new Deferred();

                        deferred.then(lang.hitch(this,
                            function () {
                                this._isAnimating = false;

                                if (!this.setClassBefore) {
                                    cssAction.call(this);
                                }

                                callback.call(this);
                            }));

                        this._isAnimating = true;

                        if (this.setClassBefore) {
                            cssAction.call(this);
                        }

                        action.call(this, deferred);
                    }
                },

                /**
                * Sets the appropriate aria-* attributes to this popup nodes according to the supplied `visible` parameter or with the internal state of the popup.
                *
                * @method setTargetAttr
                * @param {Boolean} [visible] Indicating the internal state of the popup
                */
                setTargetAttr: function (visible) {
                    if (visible !== true && visible !== false) {
                        visible = this.isOpen();
                    }

                    if (this.useAria) {
                        this.handle.attr("aria-pressed", visible);

                        // if handle and target are the same object, do not set aria attributes on target
                        if (this.handle[0] !== this.target[0]) {
                            this.target.attr({
                                "aria-expanded": visible,
                                "aria-hidden": !visible
                            });
                        }                       
                    }
                }
            };

        /**
        * Create a new PopupBase object from the settings provided.
        *
        * @method newPopup
        * @private
        * @param {PopupBaseSettings} popupAttr Popup settings
        * @return popup
        * @for PopupManager
        */
        function newPopup(popupAttr) {
            var popup = Object.create(popupBaseTemplate, {
                _attr: {
                    value: popupAttr
                }
            });

            popup._spawnPopups().forEach(function (p) {
                if (p.useAria) {
                    p.handle.attr("aria-pressed", false);

                    // if handle and target are the same object, do not set aria attributes on target
                    if (p.handle[0] !== p.target[0]) {
                        p.handle.attr("aria-haspopup", true);
                    }

                    p.setTargetAttr();
                }

                p.target.find(".button-close").on("click",
                    function () {
                        p.close();

                        // reset the focus to the popup's handle when the popup's internal close button is clicked
                        if (p.resetFocusOnClose) {
                            p.handle.focus();
                        }
                    });
            });

            return popup;
        }

        return {
            /**
            * Register a PopupBase definition. By a popup here we mean a section of the page that reacts to the user's action on this or different section of the page.
            * Can be used to register popups with already existing page nodes, or, using handle and target selectors with the nodes that will be created later.
            *
            * ####Example
            *     popupManager.registerPopup(panelToggle, "click",
            *         openPanel,
            *             {
            *                 activeClass: cssExpandedClass,
            *                 closeHandler: closePanel
            *             }
            *         );
            * Here we register a popup on the `panelToggle` node which will trigger `openPanel` function when the user clicks to open the popup and `closePanel` to close it;
            * `cssExpandedClass` will be set on the `panelToggle` node when the popup is opened.
            *
            *      popupManager.registerPopup(sectionNode, "hover, focus",
            *           openFunction,
            *           {
            *               handleSelector: "tr",
            *
            *               targetSelector: ".record-controls",
            *
            *               closeHandler: closeFunction,
            *
            *               activeClass: "background-light",
            *               useAria: false
            *           }
            *       );
            * Here we define a set of virtual popups on the `sectionNode` node that would be triggered when the user hovers over or sets focus to any `tr` child node of `sectionNode`.
            * Then the `openFunction` will be executed with `this.handle` pointing to the actual handle node which trigged the popup and  `this.target` pointing to the actual target node
            * corresponding to a node or nodes found with the `targetSelector` inside the actual handle node.
            *
            * @method registerPopup
            * @static
            * @param {jQuery} handle A {{#crossLink "jQuery"}}{{/crossLink}} handle to listen to events on
            * @param {String} event The name of the event or events separated by a comma to trigger the popup. There are several predefined event names to register hover popups:
            * - `hoverIntent` uses the hoverIntent jQuery plugin to determine when the user intends to hover over something
            * - `hover` is a combination of two events - `mouseleave` and `mouseenter` and unlike `hoverIntent` it is triggered immediatelly
            * - `focus` is a combination of two events - `focusin` and `focusout`
            * You can subscribe to a combination of event shortcuts like `focus,hover`
            *
            * Additionally, almost any other {{#crossLink "jQuery"}}{{/crossLink}} event can be specified like `click` or `keypress`.
            * @param {Function} openHandler The function to run when the popup opens
            * @param {PopupBaseSettings} [settings] additional setting to define the popup
            * @return {PopupBase} Returns a PopupBase with the specified conditions
            */
            registerPopup: function (handle, event, openHandler, settings) {
                var popup,
                    popupAttr;

                // splitting event names
                event = event.split(",").map(function (a) {
                    return a.trim();
                });

                // mixing default and user-provided settings
                popupAttr = lang.mixin(Object.create(popupBaseAttrTemplate),
                    {
                        activeClass: UtilMisc.guid()
                    },
                    settings,
                    {
                        handle: handle,
                        openHandler: openHandler
                    }
                );

                popup = newPopup(popupAttr);

                // iterating over event array
                event.forEach(function (e) {
                    switch (e) {
                        // hover intent uses a jQuery plugin: http://cherne.net/brian/resources/jquery.hoverIntent.html
                        // this plugin is loaded by WET, and sometimes it might not be loaded fast enough, so we use executeOnLoad to wait for the plugin to load
                        case "hoverIntent":
                            var timeoutHandle,
                                open = function (event) {
                                    window.clearTimeout(timeoutHandle);
                                    popup.open(event.currentTarget);
                                },
                                close = function (event) {
                                    var t = event ? event.currentTarget : null;
                                    popup.close(t);
                                };

                            UtilMisc.executeOnLoad($(document), "hoverIntent", function () {
                                popup._attr.handle
                                    .hoverIntent({
                                        over: open,
                                        out: close,
                                        selector: popup._attr.handleSelector,
                                        timeout: popup._attr.timeout
                                    })
                                    .on("click focusin", popup._attr.handleSelector, open)
                                    .on("focusout", popup._attr.handleSelector, function () {
                                        timeoutHandle = window.setTimeout(close, popup._attr.timeout);
                                    });
                            });

                            break;

                        case "hover":
                            popup._attr.handle
                                .on("mouseenter", popup._attr.handleSelector,
                                    function (event) {
                                        popup.open(event.currentTarget);
                                    })
                                .on("mouseleave", popup._attr.handleSelector,
                                    function (event) {
                                        popup.close(event.currentTarget);
                                    });
                            break;

                        case "focus":
                            popup._attr.handle
                                .on("focusin", popup._attr.handleSelector,
                                    function (event) {
                                        popup.open(event.currentTarget);
                                    })
                                .on("focusout", popup._attr.handleSelector,
                                    function (event) {
                                        popup.close(event.currentTarget);
                                    });

                            break;

                        default:
                            if (popup._attr.reverseEvent) {
                                handle
                                    .on(e, popup._attr.handleSelector, function (event) {
                                        popup.open(event.currentTarget);
                                    })
                                    .on(popup._attr.reverseEvent, popup._attr.handleSelector, function (event) {
                                        popup.close(event.currentTarget);
                                    });
                            } else {
                                handle.on(e, popup._attr.handleSelector, function (event) {
                                    popup.toggle(event.currentTarget);
                                });
                            }

                            break;
                    }
                });

                return popup;
            }
        };
    });