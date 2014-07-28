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
// Utils
        "utils/tmplHelper", "utils/popupManager"
],
    function (
// Dojo
        Evented, dojoLang,
// Text
        tools_template_json,
// Utils
        TmplHelper, PopupManager
    ) {
        "use strict";

        return dojoLang.mixin(new Evented(),
            {
                options: null,
                handle: null,
                outputFloat: null,
                tooltip: null,

                initToggle: function (node, activate, deactivate, options) {
                    var that = this;

                    // BaseTool default options
                    this.options = dojoLang.mixin(
                        {
                            target: $("#mainMap"),
                            outputFloatTemplate: "base_tool_float",
                            outputFloatPayload: {
                                clearMapButton: "Clear Map"
                            },
                            defaultAction: function () { console.log('default action'); }
                        },
                        options);

                    // creating the float to display output on
                    tmpl.cache = {};
                    tmpl.templates = JSON.parse(TmplHelper.stringifyTemplate(tools_template_json));
                    this.outputFloat = $(tmpl(this.options.outputFloatTemplate, this.options.outputFloatPayload));

                    // initializing tools' toggle button
                    this.handle = PopupManager.registerPopup(node, "click",
                        function (d) {
                            console.log("open tool");

                            activate.call(that);
                            that.options.target.append(that.outputFloat);

                            that.outputFloat.on("click", ".float-default-button", that.options.defaultAction);

                            that.tooltip = $("#mainMap.map > .tooltip")
                                .wrapInner("<span class='esri-tooltip'></span")
                                .append("<span class='tool-tooltip'><i class='fa fa-cog fa-spin'></i>Working...</span>");

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

                displayOutput: function (output) {
                    this.outputFloat.find(".float-content")
                        .empty()
                        .append(output);
                },

                working: function (state) {
                    if (state) {
                        this.tooltip.addClass("working");
                    } else {
                        this.tooltip.removeClass("working");
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