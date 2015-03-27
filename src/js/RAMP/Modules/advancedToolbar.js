/*global define, $, TimelineLite, require, tmpl, console, RAMP */

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
* ####Imports RAMP Modules:
* {{#crossLink "EventManager"}}{{/crossLink}}  
* {{#crossLink "Map"}}{{/crossLink}}  
* {{#crossLink "GlobalStorage"}}{{/crossLink}}  
* {{#crossLink "Util"}}{{/crossLink}}  
* {{#crossLink "Dictionary"}}{{/crossLink}}  
* {{#crossLink "TmplHelper"}}{{/crossLink}}  
* {{#crossLink "PopupManager"}}{{/crossLink}}  
* 
* ####Uses RAMP Templates:
* {{#crossLink "templates/advanced_toolbar_template.json"}}{{/crossLink}}
* 
* @class AdvancedToolbar
* @static
* @uses dojo/_base/lang
* @uses dojo/_base/array
* @uses dojo/topic
* @uses dojo/Deferred
*/

define([
    // Dojo
            "dojo/_base/lang", "dojo/_base/array", "dojo/topic", "dojo/Deferred",
    // Ramp
            "ramp/eventManager", "ramp/map", "ramp/globalStorage",
    // Util
            "utils/util", "utils/dictionary", "utils/popupManager",
            "utils/tmplHelper",
    // Text
            "dojo/text!./templates/advanced_toolbar_template.json"
],
    function (
    // Dojo
        dojoLang, dojoArray, topic, Deferred,
    // Ramp
        EventManager, RampMap, globalStorage,
    // Util
        UtilMisc, UtilDict, PopupManager, TmplHelper,
    // Text
        advanced_toolbar_template_json
    ) {
        "use strict";

        var map,

            tools = [
                // name,
                // selector,
                // enabled,
                // module
            ],

            ui = (function () {

                var advancedToggle,
                    advancedSectionContainer,
                    advancedToolbarList,

                    cssButtonPressedClass = "button-pressed",

                    transitionDuration = 0.4,
                    subPanelMarginDelta = 32,

                    viewport = $(".viewport"),
                    panelToggle = viewport.find("#panel-toggle"),

                    advancedToolbarTimeline = new TimelineLite({ paused: true }),
                    subpanelTimeLine = new TimelineLite();

                /**
                 * Runs the open/close animation of the toolbar additionally managing the animation of adjusting the height of the details panel to accommodate the expanded toolbar.
                 * 
                 * @method toggleToolbar
                 * @param {Deferred} d a deferred to be resolved upon completion of the animation
                 * @param {Boolean} doOpen if true - the toolbar show open; if false - the toolbar should close
                 * @private
                 */
                function toggleToolbar(d, doOpen) {
                    var subPanelContainer = viewport.find(".sub-panel-container");

                    // clear and recreate tween to capture newly created subpanels
                    subpanelTimeLine
                        .clear()
                        .fromTo(subPanelContainer, transitionDuration,
                                { "margin-top": 0, paused: true },
                                { "margin-top": subPanelMarginDelta, ease: "easeOutCirc" }, 0)
                        .seek(advancedToolbarTimeline.time());

                    if (!doOpen) {
                        advancedToolbarTimeline.eventCallback("onReverseComplete", function () {
                            d.resolve();
                            viewport.removeClass("advanced-toolbar-mode");
                        });
                        advancedToolbarTimeline.reverse();
                    } else {
                        viewport.addClass("advanced-toolbar-mode");
                        advancedToolbarTimeline.eventCallback("onComplete", function () {
                            d.resolve();
                        });
                        advancedToolbarTimeline.play();
                    }
                }

                return {
                    /**
                    * Initiates additional UI components of the widget, setting listeners and other stuff.
                    *
                    * @method ui.init
                    * @private
                    */
                    init: function () {
                        advancedToggle = viewport.find("#advanced-toggle");
                        advancedSectionContainer = viewport.find("#advanced-toolbar");

                        // create html code for advancedToolbar
                        tmpl.cache = {};
                        tmpl.templates = JSON.parse(TmplHelper.stringifyTemplate(advanced_toolbar_template_json));
                        advancedSectionContainer.append(tmpl("at_main"));
                        advancedToolbarList = advancedSectionContainer.find("#advanced-toolbar-list");

                        // create a timeline to animate toggling of the advanced toolbar
                        advancedToolbarTimeline
                            .set(advancedSectionContainer, { display: "block" })
                            .fromTo(advancedToolbarList, transitionDuration, { top: -subPanelMarginDelta }, { top: 0, ease: "easeOutCirc" }, 0)
                            .to(panelToggle, transitionDuration, { top: "+=" + subPanelMarginDelta, ease: "easeOutCirc" }, 0)

                            .add(subpanelTimeLine, 0);

                        // register the popup for the advanced toolbar
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

                                toggleToolbar(d, true);
                            },
                            {
                                activeClass: cssButtonPressedClass,
                                setClassBefore: true,
                                target: advancedSectionContainer,
                                closeHandler: function (d) {
                                    topic.publish(EventManager.GUI.TOOLBAR_SECTION_CLOSE, { id: "advanced-toolbar" });

                                    deactivateAll(); // deactivate all the tools
                                    toggleToolbar(d, false);
                                }
                            }
                        );

                        map = RampMap.getMap();
                    },

                    addTool: function (tool) {
                        advancedToolbarList.append(tool.module.node);
                    }
                };
            }());

        /**
        * Deactivates all the tools. Used when closing the Advanced toolbar or when another tool is being activated.
        *
        * @method deactivateAll
        * @param {Tool} except A tool module that should not be deactivated.
        * @private
        */
        function deactivateAll(except) {
            // deactivate all the tools except "except" tool
            tools.forEach(function (tool) {
                if ((!except || except.name !== tool.name) && tool.module) {
                    tool.module.deactivate();
                }
            });
        }

        return {
            init: function () {
                var toolsRequire;

                ui.init();

                tools = RAMP.config.advancedToolbar.tools;
                toolsRequire = tools
                    .filter(function (tool) { return tool.enabled; })
                    .map(function (tool) {
                        return "tools/" + tool.name;
                    });

                // load all the tools in one go
                console.log("toolbar : loading tools", toolsRequire);
                require(toolsRequire, function () {
                    var deferredList = [],
                        deferred,
                        args = Array.prototype.slice.call(arguments);

                    args.forEach(function () {
                        deferredList.push(new Deferred());
                    });

                    UtilMisc.afterAll(deferredList, function () {
                        // insert tool buttons into the toolbar
                        tools.forEach(ui.addTool);
                    });

                    args.forEach(function (arg, index) {
                        deferred = new Deferred();

                        deferred.then(function (module) {
                            tools[index].module = module;
                            deferredList[index].resolve();
                        });

                        arg
                            .init(tools[index].selector, deferred)
                            .on(arg.event.ACTIVATE, function () {
                                console.log(arg.name, ": is activated");
                                deactivateAll(arg);
                            });
                    });

                    console.log(args);
                });
            }
        };
    });