/* global define, tmpl */

/**
* @module Tools
*/

/**
* [Description]
*
*
*
* @class BaseTool
* @static
* @uses dojo/Evented
* @uses dojo/_base/lang
* @uses Checkbox
*/

define([
// Dojo
        "dojo/Evented", "dojo/_base/lang",
// Text
        "dojo/text!./templates/tools_template.json",
// Ramp
        "ramp/globalStorage",
// Utils
        "utils/tmplHelper", "utils/popupManager"
],
    function (
// Dojo
        Evented, dojoLang,
// Text
        tools_template_json,
// Ramp
        GlobalStorage,
// Utils
        TmplHelper, PopupManager
    ) {
        "use strict";

        return dojoLang.mixin(new Evented(),
            {
                options: null,
                handle: null,
                outputFloat: null,
                workingLabel: null,
                tooltip: null,
                templates: null,

                stringResources: GlobalStorage.config.stringResources,

                event: {
                    ACTIVATE: "basetool-activate",
                    DEACTIVATE: "basetool-deactivate"
                },

                initToggle: function (node, activate, deactivate, options) {
                    var that = this;

                    // BaseTool default options
                    this.options = dojoLang.mixin(
                        {
                            target: $("#mainMap"),
                            outputFloatTemplate: "base_tool_float",
                            outputFloatData: {
                                clearMapButton: this.stringResources.txtBaseToolClearMap
                            },
                            workingLabelTemplate: "working_label",
                            workingLabelData: {
                                workingLabel: this.stringResources.txtBaseToolWorking
                            },
                            defaultAction: function () { console.log('default action'); }
                        },
                        options);

                    // creating the float to display output on
                    tmpl.cache = {};
                    tmpl.templates = that.templates = JSON.parse(TmplHelper.stringifyTemplate(tools_template_json));
                    this.outputFloat = $(tmpl(this.options.outputFloatTemplate, this.options.outputFloatData));
                    this.workingLabel = tmpl(this.options.workingLabelTemplate, this.options.workingLabelData);

                    // initializing tools' toggle button
                    this.handle = PopupManager.registerPopup(node, "click",
                        function (d) {
                            that.emit(that.event.ACTIVATE, {
                                tool: that
                            });

                            console.log("open tool");

                            activate.call(that);
                            that.options.target.append(that.outputFloat);

                            that.outputFloat.on("click", ".float-default-button", that.options.defaultAction);

                            that.tooltip = $("#mainMap.map > .tooltip")
                                .wrapInner("<span class='esri-tooltip'></span")
                                .append(that.workingLabel);

                            d.resolve();
                        }, {
                            closeHandler: function (d) {
                                console.log("close tool");

                                deactivate.call(that);
                                that.outputFloat.detach();

                                that.outputFloat.off("click", ".float-default-button", that.options.defaultAction);

                                d.resolve();
                            },

                            activeClass: "button-pressed",
                            useAria: false
                        }
                    );
                },

                displayTemplateOutput: function (templateName, templateData) {
                    var output;

                    tmpl.cache = {};
                    tmpl.templates = this.templates;

                    output = tmpl(templateName, templateData);

                    this.displayOutput(output);
                },

                displayOutput: function (output) {
                    this.outputFloat.find(".float-content")
                        .empty()
                        .append(output);
                },

                working: function (state) {
                    if (state) {
                        this.tooltip.addClass("working");
                        this.outputFloat
                            .find(".working-placeholder")
                            .replaceWith(this.workingLabel);
                    } else {
                        this.tooltip.removeClass("working");
                        this.outputFloat
                            .find(".working-placeholder").empty();
                    }
                },

                /**
                * Activate the tool
                * @property activate
                * @type {Object}
                *
                */
                activate: function () {
                    console.log("base activate; nothing to see here;");
                    if (this.handle) {
                        this.handle.open();
                    }
                },

                deactivate: function () {
                    console.log("base deactivate; nothing to see here;");
                    if (this.handle) {
                        this.handle.close();
                    }
                }
            }
        );
    }
);