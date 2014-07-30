/*global define, $, TimelineLite, TweenLite, require */

/**
* Tools module. Contains tools accessible through Advanced Toolbar.
*
* Contains the advanced tools as a popup.
*
* @module Tools
* @main Tools
*/

/**
* AdvancedToolbar class.
*
* @class AdvancedToolbar
* @static
* @uses dojo/_base/lang
* @uses dojo/topic
* @uses ramp/eventManager
* @uses ramp/map
* @uses ramp/globalStorage
* @uses PopupManager
*/

define([
// Dojo
        "dojo/_base/lang", "dojo/topic",
// Ramp
        "ramp/eventManager", "ramp/map", "ramp/globalStorage",
// Util
        "utils/util", "utils/dictionary", "utils/popupManager"
],

    function (
    // Dojo
        dojoLang, topic,
    // Ramp
        EventManager, RampMap, globalStorage,
    // Util
        UtilMisc, UtilDict, PopupManager) {
        "use strict";

        var advancedToggle,
            advancedSectionContainer,

            cssButtonPressedClass = "button-pressed",

            transitionDuration = 0.4,

            map,

            tools = {},

            ui = {
                /**
                * Initiates additional UI components of the widget, setting listeners and other stuff.
                *
                * @method ui.init
                * @private
                */
                init: function () {
                    var viewport = $(".viewport"),
                        advancedToolbarList = viewport.find("#advanced-toolbar-list"),
                        subPanelContainer,
                        panelToggle = viewport.find("#panel-toggle"),

                        advancedToolbarTimeLine = new TimelineLite({
                            paused: true,
                            onComplete: function () { },
                            onReverseComplete: function () { }
                        });

                    advancedToggle = viewport.find("#advanced-toggle");
                    advancedSectionContainer = viewport.find("#advanced-toolbar");

                    advancedToolbarTimeLine
                        .set(advancedSectionContainer, { display: "block" }, 0)
                        .set(viewport, { className: "+=advanced-toolbar-mode" }, 0)
                        .fromTo(advancedToolbarList, transitionDuration, { top: -32 }, { top: 0, ease: "easeOutCirc" }, 0)
                        .to(panelToggle, transitionDuration, { top: "+=32", ease: "easeOutCirc" }, 0);

                    PopupManager.registerPopup(advancedToggle, "click",
                        function (d) {
                            topic.publish(EventManager.GUI.TOOLBAR_SECTION_OPEN, { id: "advanced-toolbar" });

                            // close this panel if any other panel is opened
                            UtilMisc.subscribeOnce(EventManager.GUI.TOOLBAR_SECTION_OPEN, dojoLang.hitch(this,
                                function (evt) {
                                    if (evt.id !== "advanced-toolbar" && this.isOpen()) {
                                        this.close();
                                    }
                                })
                            );

                            // perform transitions
                            subPanelContainer = viewport.find(".sub-panel-container");
                            TweenLite.fromTo(subPanelContainer, transitionDuration,
                                    { "margin-top": 0 },
                                    { "margin-top": 32, ease: "easeOutCirc" });

                            advancedToolbarTimeLine.eventCallback("onComplete", d.resolve, [], this);
                            advancedToolbarTimeLine.play();
                        },
                        {
                            activeClass: cssButtonPressedClass,
                            setClassBefore: true,
                            target: advancedSectionContainer,
                            closeHandler: function (d) {
                                topic.publish(EventManager.GUI.TOOLBAR_SECTION_CLOSE, { id: "advanced-toolbar" });

                                // deactivate all the tools
                                deactivateAll();

                                // perform transitions
                                subPanelContainer = viewport.find(".sub-panel-container");
                                TweenLite.fromTo(subPanelContainer, transitionDuration,
                                    { "margin-top": 32 },
                                    { "margin-top": 0, ease: "easeInCirc" });

                                advancedToolbarTimeLine.eventCallback("onReverseComplete", d.resolve, [], this);
                                advancedToolbarTimeLine.reverse();
                            }
                        }
                    );

                    map = RampMap.getMap();
                }
            };

        /**
        * Deactivates all the tools. Used when closing the Advanced toolbar or when another tool is being activated.
        *
        * @method deactivateAll
        * @param {Tool} except A tool module that should not be deactivated.
        * @private
        */
        function deactivateAll(except) {
            // deactivate all the tools except "except" tool
            UtilDict.forEachEntry(tools, function (name, tool) {
                if (!except || except.name !== name) {
                    tool.deactivate();
                }
            });
        }

        return {
            init: function () {
                ui.init();

                // load only enabled tools
                UtilDict.forEachEntry(globalStorage.config.advancedToolbar.tools,
                    function (key, value) {
                        if (value.enabled) {
                            require(["tools/" + value.name], function (module) {
                                module
                                    .init(value.selector)
                                    .on(module.event.ACTIVATE, function () {
                                        console.log("Tool", module.name, "activated");
                                        deactivateAll(module);
                                    });

                                tools[value.name] = module;
                            });
                        }
                    }
                );
            }
        };
    });