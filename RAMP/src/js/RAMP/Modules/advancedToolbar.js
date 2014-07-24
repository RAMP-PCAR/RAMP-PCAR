/*global define, $, TimelineLite */

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
        "dojo/_base/lang", "dojo/topic",
// Ramp
        "ramp/eventManager", "ramp/map", "ramp/globalStorage",
// Tools
        "tools/measureTool", "tools/bufferTool", "tools/populationTool",
// Util
        "utils/util", "utils/popupManager"
],

    function (
    // Dojo
        dojoLang, topic,
    // Ramp
        EventManager, RampMap, globalStorage,
    // Tools
        MeasureTool, BufferTool, PopulationTool,
    // Util
        UtilMisc, popupManager) {
        "use strict";

        var advancedPopup,
            advancedToggle,
            advancedSectionContainer,
            advancedSection,

            cssButtonPressedClass = "button-pressed",

            map,

            ui = {
                /**
                * Initiates additional UI components of the widget, setting listeners and other stuff.
                *
                * @method ui.init
                * @private
                */
                init: function () {
                    advancedToggle = $("#advanced-toggle");
                    advancedSectionContainer = $("#advanced-toolbar"); //$("#advanced-section-container");
                    var advancedToolbarList = $("#advanced-toolbar-list"),
                        panelToggle = $("#panel-toggle");

                    advancedSection = $("#advanced-section");

                    toggleAdvancedToolbar();

                    var transitionDuration = 0.4,

                     advancedToolbarTimeLine = new TimelineLite({
                         paused: true,
                         onComplete: function () {
                         },
                         onReverseComplete: function () {
                         }
                     });

                    advancedToolbarTimeLine
                        .set(advancedSectionContainer, { display: "block" }, 0)
                        .fromTo(advancedToolbarList, transitionDuration, { top: -32 }, { top: 0 }, 0)
                        .to(panelToggle, transitionDuration, { top: "+=32" }, 0);

                    advancedPopup = popupManager.registerPopup(advancedToggle, "click",
                        function (d) {
                            topic.publish(EventManager.Advanced.ADVANCED_PANEL_CHANGED, {
                                visible: true
                            });
                            topic.publish(EventManager.GUI.TOOLBAR_SECTION_OPEN, { id: "help-section" });

                            // close this panel if any other panel is opened
                            UtilMisc.subscribeOnce(EventManager.GUI.TOOLBAR_SECTION_OPEN, dojoLang.hitch(this,
                                function () {
                                    if (this.isOpen()) {
                                        this.close();
                                    }
                                })
                            );

                            advancedToolbarTimeLine.eventCallback("onComplete", d.resolve, [], this);
                            advancedToolbarTimeLine.play();

                            //d.resolve();

                            /*advancedSectionContainer.slideDown("fast", function () {
                                d.resolve();
                            });*/
                        },
                        {
                            activeClass: cssButtonPressedClass,
                            target: advancedSectionContainer,
                            closeHandler: function (d) {
                                topic.publish(EventManager.Advanced.ADVANCED_PANEL_CHANGED, {
                                    visible: false
                                });
                                topic.publish(EventManager.GUI.TOOLBAR_SECTION_CLOSE, { id: "help-section" });

                                advancedToolbarTimeLine.eventCallback("onReverseComplete", d.resolve, [], this);
                                advancedToolbarTimeLine.reverse();

                                //d.resolve();

                                /*advancedSectionContainer.slideUp("fast", function () {
                                    d.resolve();
                                });*/
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
            // Set whether each item should be visible.
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
        }

        // Hide advanced popup after clicking on any of the tools.

        $('#at-population-toggle').click(function () {
            PopulationTool.activate();
            $('#advanced-info-box').hide();
            advancedPopup.close();
        });

        $('#at-measure-toggle').click(function () {
            MeasureTool.activate();
            $('#advanced-info-box').hide();
            advancedPopup.close();
        });

        $('#at-buffer-toggle').click(function () {
            BufferTool.activate();
            $('#population-info').hide();
            $('#measurement-info').hide();
            $('#buffer-info').show();
            $('#advanced-info-box').show();
            advancedPopup.close();
        });

        // Clear info box and drawn polygons off the map when clear map button is clicked.
        $('#clear-map-button').click(function () {
            $('#advanced-info-box').hide();
            map.graphics.clear();
        });

        return {
            init: function () {
                ui.init();
            }
        };
    });