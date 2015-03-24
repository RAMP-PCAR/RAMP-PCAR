/* global define, tmpl, i18n, require, console, $ */

/**
* @module Tools
*/

/**
* BaseTool provides essential functionality for Tools including handling of the activate toggle, setting `busy` state, injecting output float into the page,
* and templating the output. It's not required to mixin BaseTool, but it's really helpful; and of course any of the BaseTool methods/properties can be overwritten
* after mixining it in.
*
* Call `initToggle` to initialize the tool.
* 
* ####Imports RAMP Modules:
* {{#crossLink "GlobalStorage"}}{{/crossLink}}  
* {{#crossLink "TmplHelper"}}{{/crossLink}}  
* {{#crossLink "PopupManager"}}{{/crossLink}}  
* {{#crossLink "Util"}}{{/crossLink}}
*
* ####Uses RAMP Templates:
* {{#crossLink "templates/tools_template.json"}}{{/crossLink}}
* 
* @class BaseTool
* @constructor
* @uses dojo/Evented
* @uses dojo/_base/lang
* @uses dojo/Deferred
*/

define([
// Dojo
        "dojo/Evented", "dojo/_base/lang", "dojo/Deferred",
// Text
        "dojo/text!./templates/tools_template.json",
// Ramp
        "ramp/globalStorage",
// Utils
        "utils/tmplHelper", "utils/popupManager", "utils/util"
],
    function (
// Dojo
        Evented, dojoLang, Deferred,
// Text
        tools_template_json,
// Ramp
        GlobalStorage,
// Utils
        TmplHelper, PopupManager, Util
    ) {
        "use strict";

        // mixin the Evented functions (on, emit) into the BaseTool
        return dojoLang.mixin(new Evented(),
            {
                /**
                 * Stored options passed to the BaseTool.
                 *
                 * @property options
                 * @type Object
                 * @default null
                 * @private
                 */
                options: null,

                /**
                 * Handle (popup handle) that triggers opening/closing of the tool.
                 *
                 * @property handle
                 * @type JObject
                 * @default null
                 *
                 */
                handle: null,

                /**
                 * Node (button) the handle is attached too.
                 * 
                 * @property node
                 * @type JObject
                 * @default null
                 */
                node: null,

                /**
                 * Node representing the tool output float container.
                 *
                 * @property outputFloat
                 * @type JObject
                 * @default templates/tools_template.json:base_tool_float
                 * @example
                 *      <div class='advanced-output-section-container'>
                 *          <div class='advanced-output-section'>
                 *              <section class='float-content'></section>
                 *              <button class='button button-none float-default-button' >
                 *                  <i class='fa fa-trash-o'></i><span class='on-right'>{%= o.clearMapButton %}</span>
                 *              </button>
                 *              <div class='clear'></div>
                 *          </div>
                 *      </div>
                 */
                outputFloat: null,

                /**
                 * Template string representing `working` label shown when the tool is in `busy` state.
                 *
                 * @property workingLabel
                 * @type String
                 * @default templates/tools_template.json:working_label
                 * @example     <span class='tool-tooltip'><i class='fa fa-cog fa-spin'></i>{%= o.workingLabel %}</span>
                 */
                workingLabel: null,

                /**
                 * Tooltip node that appears by the mouse cursor when tools is activated.
                 *
                 * @property tooltip
                 * @type JObject
                 * @default $("#mainMap.map > .tooltip")
                 *
                 */
                tooltip: null,

                /**
                 * Stringified and parsed templates
                 *
                 * @property template
                 * @type Object
                 * @default templates/tools_template.json
                 *
                 */
                templates: null,

                /**
                * Event names published by the BaseTool
                *
                * @property event
                * @type Object
                * @default null
                * @example
                *      {
                *          ACTIVATE: "basetool-activate",
                *          DEACTIVATE: "basetool-deactivate"
                *      }
                */
                event: {
                    /**
                    * Published whenever a Tool is activated.
                    *
                    * @event ACTIVATE
                    * @param event {Object}
                    * @param event.tool {BaseTool} Tool that was activated
                    */
                    ACTIVATE: "basetool-activate",

                    /**
                    * Published whenever a Tool is deactivated.
                    *
                    * @event DEACTIVATE
                    * @param event {Object}
                    * @param event.tool {BaseTool} Tool that was deactivated
                    */
                    DEACTIVATE: "basetool-deactivate"
                },

                ns: "tools/",

                /**
                 * Name of the tool so AdvancedToolbar can distinguish between them.
                 *
                 * @property name
                 * @type String
                 * @default BaseTool
                 */
                name: "BaseTool",

                /**
                 * Initializes the tool and sets up popup to handle activating/deactivating of the tool. Tools should call this function on `init`,
                 * unless they employ a different workflow and then need to handle all function activation/deactivation/working themselves.
                 *
                 * @method initToggle
                 * @param {JObject} selector a target selector that serves as a toggle for the tool
                 * @param {JObject} d a Deferred object to be resolved after tool initiates
                 * @param {Object} [options] Additional options
                 * @param {JObject} [options.target] Target where the tool's float should be appended to
                 * @param {String} [options.outputFloatTemplate] Template name to generate the float container with
                 * @param {Object} [options.outputFloatData] Data payload to be passed to the template engine when generate the float container
                 * @param {String} [options.workingLabelTemplate] Template name to generate the `busy` label
                 * @param {Object} [options.workingLabelData] Data payload to be passed to the template engine when generate the `busy` label
                 * @param {Function} [options.activate] an activate function to be called when the toggle is clicked
                 * @param {Function} [options.deactivate] a deactivate function to be called when the toggle is clicked
                 * @param {Function} [options.defaultAction] Function to be executed when the `float-default-button` is clicked
                 * @chainable
                 * @return this tool
                 */
                initToggle: function (selector, d, options) {
                    var that = this,
                        toolTemplate,
                        deferrList = [
                            new Deferred(),
                            new Deferred()
                        ];

                    // wait for translation and template to load
                    Util.afterAll(deferrList,
                        function () {
                            tmpl.cache = {};
                            // mixin base tools template with individual tool's template
                            tmpl.templates = that.templates = dojoLang.mixin(
                                JSON.parse(TmplHelper.stringifyTemplate(tools_template_json)),
                                JSON.parse(TmplHelper.stringifyTemplate(toolTemplate)));

                            // create tool button, outputfloat, and working label
                            this.node = $(tmpl(this.options.toolButtonTemplate, this.options.toolButtonData));
                            // creating the float to display output on
                            this.outputFloat = $(tmpl(this.options.outputFloatTemplate, this.options.outputFloatData));
                            this.workingLabel = tmpl(this.options.workingLabelTemplate, this.options.workingLabelData);

                            // initializing tools' toggle button
                            this.handle = PopupManager.registerPopup(this.node.find(selector), "click",
                                function (d) {
                                    that.emit(that.event.ACTIVATE, {
                                        tool: that
                                    });

                                    console.log(that.name, ": tool opens");

                                    that.options.activate.call(that);
                                    that.options.target.append(that.outputFloat);

                                    that.outputFloat.on("click", ".float-default-button", that.options.defaultAction);

                                    that.tooltip = $("#mainMap.map > .tooltip")
                                        .wrapInner("<span class='esri-tooltip'></span")
                                        .append(that.workingLabel);

                                    d.resolve();
                                }, {
                                    closeHandler: function (d) {
                                        that.emit(that.event.DEACTIVATE, {
                                            tool: that
                                        });

                                        console.log(that.name, ": tool closes");

                                        that.options.deactivate.call(that);
                                        that.outputFloat.detach();

                                        that.outputFloat.off("click", ".float-default-button", that.options.defaultAction);

                                        d.resolve();
                                    },

                                    activeClass: "button-pressed",
                                    useAria: false
                                }
                            );

                            d.resolve(this);
                        },
                        this);

                    // load tool's i18n namespace
                    that.ns += that.name;
                    i18n.loadNamespace(that.ns, function () {
                        console.log(that.name, ": translation is loaded");
                        deferrList[0].resolve();
                    });

                    // load toll's template
                    require(["dojo/text!tools/templates/" + that.name + ".json"], function (tt) {
                        console.log(that.name, ": template is loaded");
                        toolTemplate = tt;

                        deferrList[1].resolve();
                    });

                    // BaseTool default options
                    this.options = dojoLang.mixin(
                        {
                            target: $("#mainMap"),

                            outputFloatTemplate: "base_tool_float",
                            outputFloatData: {
                                clearMapButton: i18n.t("tools.basetool.clearmap")
                            },

                            workingLabelTemplate: "working_label",
                            workingLabelData: {
                                workingLabel: i18n.t("tools.basetool.working")
                            },

                            toolButtonTemplate: "base_tool_button",
                            toolButtonData: {
                                ns: that.ns
                            },

                            toolOutputTemplate: "base_tool_output",

                            activate: function () { console.log('activate action'); },
                            deactivate: function () { console.log('deactivate action'); },
                            defaultAction: function () { console.log('default action'); }
                        },
                        options);

                    return this;
                },

                /**
                 * Generates output to be injected into the tool's float given a template's name and data object.
                 *
                 * @method displayTemplateOutput
                 * @param {Object} templateData data to be put inside the specified template
                 * @param {String} [templateName] template name to be completed with provided data; if not supplied, "toolOutputTemplate" property of the options object will be used
                 * @chainable
                 * @return this tool
                 */
                displayTemplateOutput: function (templateData, templateName) {
                    var output;

                    templateName = templateName || this.options.toolOutputTemplate;

                    tmpl.cache = {};
                    tmpl.templates = this.templates;

                    output = tmpl(templateName, templateData);

                    this.displayOutput(output);

                    return this;
                },

                /**
                 * Injects given tool output into the tool's float.
                 *
                 * @method displayOutput
                 * @param {String | JObject} output String or node collection to be injected into the tool output float.
                 * @chainable
                 * @return this tool
                 */
                displayOutput: function (output) {
                    this.outputFloat.find(".float-content")
                        .empty()
                        .append(output);

                    return this;
                },

                /**
                * Sets the tool into a specified state; if the tool is `working`, a `working` label is placed beside the cursor and injected into the tool output float.
                *
                * @method working
                * @param {Boolean} state indicates the state of the tool: working, idle
                * @chainable
                * @return This tool
                */
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

                    return this;
                },

                /**
                * Activate the tool by triggering `open` method on the tool's popup handle.
                * @method activate
                * @chainable
                * @return This tool
                */
                activate: function () {
                    //console.log("base activate; nothing to see here;");
                    if (this.handle) {
                        this.handle.open();
                    }

                    return this;
                },

                /**
                * Deactivate the tool by triggering `close` method on the tool's popup handle.
                * @method deactivate
                * @chainable
                * @return This tool
                */
                deactivate: function () {
                    //console.log("base deactivate; nothing to see here;");
                    if (this.handle && this.handle.isOpen()) {
                        this.handle.close();
                    }

                    return this;
                }
            }
        );
    }
);