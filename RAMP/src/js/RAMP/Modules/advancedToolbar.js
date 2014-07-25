/*global define, $, TimelineLite, TweenLite, require */

/**
* AdvancedToolbar submodule.
*
* Contains the advanced tools as a popup.
*
* @module RAMP
* @submodule AdvancedToolbar
* @main AdvancedToolbar
*/

/**
* AdvancedToolbar class.
*
* @class AdvancedToolbar
* @static
* @uses dojo/topic
* @uses ramp/eventManager
* @uses ramp/map
* @uses ramp/globalStorage
* @uses PopupManager
*/

define([
// Dojo
        "dojo/_base/lang", "dojo/topic", "dojo/dom-construct", //"require",
// Ramp
        "ramp/eventManager", "ramp/map", "ramp/globalStorage",
// Tools
        //"tools/measureTool", "tools/bufferTool",// "tools/populationTool",
// Util
        "utils/util", "utils/dictionary", "utils/popupManager"
],

    function (
    // Dojo
        dojoLang, topic, domConstruct, //require,
    // Ramp
        EventManager, RampMap, globalStorage,
    // Tools
        //MeasureTool, BufferTool,// PopulationTool,
    // Util
        UtilMisc, UtilDict, popupManager) {
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
                            onComplete: function () {
                            },
                            onReverseComplete: function () {
                            }
                        });

                    advancedToggle = viewport.find("#advanced-toggle");
                    advancedSectionContainer = viewport.find("#advanced-toolbar"); //$("#advanced-section-container");

                    toggleAdvancedToolbar();

                    advancedToolbarTimeLine
                        .set(advancedSectionContainer, { display: "block" }, 0)
                        .set(viewport, { className: "+=advanced-toolbar-mode" }, 0)
                        .fromTo(advancedToolbarList, transitionDuration, { top: -32 }, { top: 0, ease: "easeOutCirc" }, 0)
                        .to(panelToggle, transitionDuration, { top: "+=32", ease: "easeOutCirc" }, 0);

                    popupManager.registerPopup(advancedToggle, "click",
                        function (d) {
                            topic.publish(EventManager.GUI.TOOLBAR_SECTION_OPEN, { id: "advanced-toolbar" });
                            // close this panel if any other panel is opened
                            UtilMisc.subscribeOnce(EventManager.GUI.TOOLBAR_SECTION_OPEN, dojoLang.hitch(this,
                                function () {
                                    if (this.isOpen()) {
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
                            target: advancedSectionContainer,
                            closeHandler: function (d) {
                                topic.publish(EventManager.GUI.TOOLBAR_SECTION_CLOSE, { id: "advanced-toolbar" });

                                // deactivate all the tools
                                UtilDict.forEachEntry(tools, function (name, tool) {
                                    tool.deactivate();
                                });

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
        * Shows the advanced toolbar and its tools based off config settings.
        *
        * @method toggleAdvancedToolbar
        * @private
        */
        function toggleAdvancedToolbar() {
            /*    // Set whether each item should be visible.
                var advancedToolbarIsEnabled = true || globalStorage.config.advancedToolbar.advancedToolbarIsEnabled,
                    populationToolIsEnabled = true || globalStorage.config.advancedToolbar.populationToolIsEnabled,
                    measureToolIsEnabled = true || globalStorage.config.advancedToolbar.measureToolIsEnabled,
                    bufferToolIsEnabled = true || globalStorage.config.advancedToolbar.bufferToolIsEnabled;

                // Show each item as indicated by variables.
                if (advancedToolbarIsEnabled) {
                    advancedToggle.show();
                } else {
                    return;
                }
                if (populationToolIsEnabled) {
                    $('#population-tool').css("display", "inline-block");
                }
                if (measureToolIsEnabled) {
                    $('#measure-tool').css("display", "inline-block");
                }
                if (bufferToolIsEnabled) {
                    $('#buffer-tool').css("display", "inline-block");
                }
                */
        }

        // Hide advanced popup after clicking on any of the tools.

        /*$('#at-population-toggle').click(function () {
            PopulationTools.activate();
            $('#advanced-info-box').hide();
        });

        $('#at-measure-toggle').click(function () {
            MeasureTool.activate();
            $('#advanced-info-box').hide();
        });

        $('#at-buffer-toggle').click(function () {
            BufferTool.activate();
            $('#population-info').hide();
            $('#measurement-info').hide();
            $('#buffer-info').show();
            $('#advanced-info-box').show();
        });

        // Clear info box and drawn polygons off the map when clear map button is clicked.
        $('#clear-map-button').click(function () {
            $('#advanced-info-box').hide();
            map.graphics.clear();
        });

        */

        return {
            init: function () {
                ui.init();

                //HACK
                globalStorage.config.advancedToolbar = {};
                globalStorage.config.advancedToolbar.tools = {
                    /*measure: {
                        name: "measureTool",
                        enabled: true
                    },*/
                    population: {
                        name: "populationTool",
                        enabled: true
                    }/*,
                    buffer: {
                        name: "bufferTool",
                        enabled: true
                    }*/
                };
                //HACK

                // load only enabled tools
                UtilDict.forEachEntry(globalStorage.config.advancedToolbar.tools,
                    function (key, value) {
                        if (value.enabled) {
                            require(["tools/" + value.name], function (module) {
                                module.on("toggle", function (evt) {
                                    console.log(evt);
                                });

                                module.init();

                                tools[value.name] = module;
                            });
                        }
                    }
                );
            }
        };
    });