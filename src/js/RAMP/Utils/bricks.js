/*global console, define, $, jscolor, RColor, Base */

/** 
* Bricks is a static collection of form controls rolled into prototypical objects with extra functions available. The main purpose is to use them in the choice tree for adding datasets but they can be reused anywhere where form controls are required.
* @module Utils
* @submodule Bricks
*/

/**
* Bricks is a static collection of form controls rolled into prototypical objects with extra functions available. The main purpose is to use them in the choice tree for adding datasets but they can be reused anywhere where form controls are required.
*
* 
* ####Imports RAMP Modules:
* {{#crossLink "Util"}}{{/crossLink}}  
* {{#crossLink "TmplHelper"}}{{/crossLink}}  
* {{#crossLink "Array"}}{{/crossLink}}  
* {{#crossLink "Dictionary"}}{{/crossLink}}  
*  
* ####Uses RAMP Templates:
* {{#crossLink "templates/bricks_template.json"}}{{/crossLink}}
* 
* 
* @class Bricks
* @static
* @uses dojo/_base/lang
* 
*/
define([
    /* Dojo */
    "dojo/_base/lang",

    /* Text */
    "dojo/text!./templates/bricks_template.json",

    /* Util */
    "utils/util", "utils/tmplHelper", "utils/array", "utils/dictionary"
],
    function (lang,

        bricks_template,

        UtilMisc, TmplHelper, UtilArray, UtilDict) {
        "use strict";

        var Brick,

            ButtonBrick,
            OkCancelButtonBrick,

            MultiBrick,

            ChoiceBrick,

            DropDownBrick,
            ColorPickerBrick,
            SimpleInputBrick,
            FileInputBrick,

            templates = JSON.parse(TmplHelper.stringifyTemplate(bricks_template));

        /**
         * Generates a template node based on the name of the template and the data to be passed to the template engine. The set of brick templates is suppled to the {{#crossLink "TmplHelper"}}{{/crossLink}}   module.
         * 
         * @method template
         * @private
         * @param {String} key template name
         * @param {Object} data any data that should be passed to the template engine
         * @return {jObject} a generated template nodes
         */
        function template(key, data) {
            /*jshint validthis: true */
            return $(TmplHelper.template.call(this, key, data, templates)); // -> No Strict violation!
        }

        /**
        * The basic Brick prototype with no special functions. A base from all other Bricks.
        * To instanciate, call {{#crossLink "Brick/new:method"}}{{/crossLink}} on the Brick prototype.
        * 
        * ####Imports RAMP Modules:
        * {{#crossLink "Util"}}{{/crossLink}}  
        * {{#crossLink "TmplHelper"}}{{/crossLink}}  
        * {{#crossLink "Array"}}{{/crossLink}}  
        * {{#crossLink "Dictionary"}}{{/crossLink}}  
        *  
        * ####Uses RAMP Templates:
        * {{#crossLink "templates/bricks_template.json"}}{{/crossLink}}
        * 
        * 
        * @class Brick
        * @constructor
        * @for Bricks
        * @static
        * @uses dojo/_base/lang
        * 
        */
        Brick = Base.extend({
            /**
             * Initializes the Brick by generating a specified template and setting defaults.
             * 
             * @method new
             * @param  {String} id     specified id of the Brick
             * @param  {Object} config a configuration object for the Brick
             * @param  {String} [config.header] a Brick header
             * @param  {String} [config.instructions] a configuration object for the Brick
             * @param  {Array|Object} [config.required] collection of rules specifying what external conditions must be valid for the Brick to be enabled
             * @param  {Array} [config.freezeStates] a set of rules specifying states Brick should be frozen
             * @param  {String} [config.baseTemplate] a base template name to be used
             * @param  {String} [config.noticeTemplate] a notice tempalte name to be used
             * 
             * @retun Brick
             * @chainable
             * @for Brick
             */
            
            /**
             * A Brick header.
             *
             * @property header
             * @private
             * @type {String}
             * @default ""
             */
            
            /**
             * An instructional text to be displayed.
             *
             * @property instructions
             * @private
             * @type {String}
             * @default ""
             */

            /**
             * A collection of rules specifying what external conditions must be valid for the Brick to be enabled.
             * This is not used directly by the Brick itself, but instead by the external object manipulating a collection of Bricks.
             * Two types of rules possible: "all" and "any". Any additional properties needed can be specified.
             * 
             * @property required
             * @type {Array}
             * @default null
             * @example
             *
             *      [
             *           {
             *               type: "all",
             *               check: ["serviceType", "serviceURL"]
             *           }
             *      ]
             */
            
            /**
             * A set of rules specifying states Brick should be frozen.
             *
             * @property freezeStates
             * @private
             * @type {Array}
             * @default []
             * @example
             *
             *      [
             *           Bricks.Brick.state.SUCCESS,
             *           Bricks.Brick.state.ERROR
             *       ],
             */
            
            /**
             * A default base template name.
             *
             * @property baseTemplate
             * @private
             * @type {String}
             * @default "default_base_template"
             */
            
            /**
             * A default notice template name.
             *
             * @property noticeTemplate
             * @private
             * @type {String}
             * @default "default_brick_notice"
             */                 

            /**
             * Indicates if the Brick is frozen and cannot be interacted with.
             *
             * @property _isFrozen
             * @private
             * @type {Boolean}
             * @default false
             */

            /**
             * A collection of listeners to be notified of specified Brick events.
             *
             * @property _listeners
             * @private
             * @type {Object}
             * @default {}
             */

            /**
             * A dictionary of possible Brick events.
             *
             * @property event
             * @type {Object}
             * @example
             *      event: {
             *          CHANGE: "brick/change"
             *      }
             * 
             */
            event: {
                CHANGE: "brick/change"
            },

            /**
             * A dictionary of Brick events.
             *
             * @property state
             * @type {Object}
             * @example
             *     state: {
             *       SUCCESS: "brick/success",
             *       ERROR: "brick/error",
             *       DEFAULT: "brick/default"
             *      }
             */
            state: {
                SUCCESS: "brick/success",
                ERROR: "brick/error",
                DEFAULT: "brick/default"
            },

            /**
             * Initializes the Brick by generatin a specified template and setting defaults.
             * 
             * @method initialize
             * @param  {String} id     specified id of the Brick
             * @param  {Object} config a configuration object for the Brick
             * @private
             */
            initialize: function (id, config) {

                lang.mixin(this,
                    {
                        required: null,
                        freezeStates: [],
                        baseTemplate: "default_base_template",
                        noticeTemplate: "default_brick_notice"
                    },
                    config,
                    {
                        id: id,
                        _isFrozen: false,
                        _listeners: {}
                    }
                );

                this.node = template(this.baseTemplate, this);

                lang.mixin(this,
                    {
                        noticeNode: this.node.find(".brick-notice-placeholder")
                    }
                );

                if (this.required) {
                    if (Array.isArray(this.required)) {
                        this.required.forEach(function (req) {
                            req.type = req.type ? req.type : "all";
                        });
                    } else {
                        this.required.type = this.required.type ? this.required.type : "all";
                    }
                }

            },

            /**
             * Notifies a listener of a Brick event. 
             *
             * @method notify
             * @private
             * @param  {String} eventName an eventName that should be reported
             * @param  {Ojbect} data      a payload object to be passed along with the @event
             * @return {Brick}           itself
             * @chainable
             */
            notify: function (eventName, data) {
                var that = this;

                if (!this._listeners[eventName]) {
                    this._listeners[eventName] = [];
                }
                this._listeners[eventName].forEach(function (listener) {
                    listener.call(that, data);
                });

                return this;
            },

            /**
             * Sets a listener on the Brick for a speicifed eventName.
             *
             * @method on
             * @param  {String} eventName an eventName to listen for
             * @param  {Function} listener  a callback function to be called
             * @return {Brick}           itself
             * @chainable
             */
            on: function (eventName, listener) {
                if (!this._listeners[eventName]) {
                    this._listeners[eventName] = [];
                }
                this._listeners[eventName].push(listener);

                return this;
            },

            /**
             * Sets the state of the Brick. Checks if the state being set is a freezing state and freezes/unfreezes the Brick.
             *
             * @method setState
             * @param {String} state a name of the state to set 
             * @return {Brick}           itself
             * @chainable
             */
            setState: function (state) {
                if (this.freezeStates.indexOf(state) !== -1) {
                    this.freeze(true);
                } else {
                    this.freeze(false);
                }

                return this;
            },

            /**
             * Display a (error) notice on the brick.
             *
             * @method displayNotice
             * @param  {Object} notice object with notice data to be passed to the template
             * @param  {String} [noticeTemplate] notice template name
             * @return {Brick}           itself
             * @chainable
             */
            displayNotice: function (notice, noticeTemplate) {
                noticeTemplate = noticeTemplate || this.noticeTemplate;

                if (notice) {
                    this.noticeNode
                        .empty()
                        .append(
                            template(noticeTemplate, notice)
                        );
                } else {
                    this.noticeNode.empty();
                }

                return this;
            },

            /**
             * Clears the Brick. This is an empty function. Bricks inheriting from this should override and provide their specific implementations.
             *
             * @method clear
             * @return {Brick}           itself
             * @chainable
             */
            clear: function () {
                this.noticeNode.empty();

                return this;
            },

            /**
             * Checks if the brick is valid. This is an empty function. Bricks inheriting from this should override and provide their specific implementations.
             *
             * @method isValid
             * @return {Boolean}           true if valid; false if not
             */
            isValid: function () {
                return true;
            },

            /**
             * Sets Brick's data. This is an empty function. Bricks inheriting from this should override and provide their specific implementations.
             *
             * @method setData
             * @return {Brick}           itself
             * @chainable
             */
            setData: function () {
                return this;
            },

            /**
             * Returns Brick's data. Bricks inheriting from this should override and provide their one implementation and then call parent's getData method.
             *
             * @method getData
             * @param  {Object} [payload] data to be returned
             * @param  {Boolean} [wrap]    indicates of the payload should be wrapped with a Brick's id; useful when collection information from several Bricks at once. 
             * @return {Object}         Brick's data
             */
            getData: function (payload, wrap) {
                var result = {};

                payload = payload || {};

                if (wrap) {
                    result[this.id] = payload;
                } else {
                    result = payload;
                }

                return result;
            },

            freeze: function (freeze) {
                this._isFrozen = freeze;
                this.disable(freeze, true);
            },

            /**
             * Disables or reenables the Brick.
             * 
             * @method disable
             * @param  {Boolean} disable true to disable; false to enable
             * @param  {Boolean} force   if true, disables the brick even if it's frozen
             * @chainable
             * @return {Brick} itself
             * @for Brick
             */
            disable: function (disable, force) {
                if (!this._isFrozen || force) {
                    if (disable) {
                        this.node
                            .find("button, input, select")
                            .attr("disabled", true);
                    } else {
                        this.node
                            .find("button, input, select")
                            .attr("disabled", false);
                    }
                }

                return this;
            }
        });
    
        /**
        * The basic Brick prototype with no special functions. A base from all other Bricks.
        * To instanciate, call {{#crossLink "Brick/new:method"}}{{/crossLink}} on the MultiBrick prototype.
        *
        * 
        * ####Imports RAMP Modules:
        * {{#crossLink "Util"}}{{/crossLink}}  
        * {{#crossLink "TmplHelper"}}{{/crossLink}}  
        * {{#crossLink "Array"}}{{/crossLink}}  
        * {{#crossLink "Dictionary"}}{{/crossLink}}  
        *  
        * ####Uses RAMP Templates:
        * {{#crossLink "templates/bricks_template.json"}}{{/crossLink}}
        * 
        * 
        * @class MultiBrick
        * @for Bricks
        * @static
        * @uses dojo/_base/lang
        * @uses Brick
        * 
        */
        MultiBrick = Brick.extend({
            /**
             * Initializes the MutliBrick by generating a specified template and setting defaults.
             * 
             * @method new
             * @param  {String} id     specified id of the MultiBrick
             * @param  {Object} config a configuration object for the MultiBrick
             * @retun MultiBrick
             * @chainable
             * @for MultiBrick
             */

            initialize: function (id, config) {
                var that = this;

                lang.mixin(this,
                    {
                        template: "default_multi_brick_template",
                        containerClass: "multi-brick-container",
                        content: []
                    }
                );

                Brick.initialize.call(this, id, config);

                lang.mixin(this,
                    {
                        multiContainer: this.node.find(".multi-container"),
                        contentBricks: {}
                    }
                );

                this.content.forEach(function (contentItem) {
                    var contentBrick = contentItem.type.new(contentItem.id, contentItem.config);

                    that.contentBricks[contentBrick.id] = contentBrick;

                    if (that.header) {
                        contentBrick.node = $(
                            contentBrick.node
                                .prop('outerHTML').replace("<h3", "<h4").replace("</h3>", "</h4>")
                            )
                        ;
                    }

                    that.multiContainer.append(contentBrick.node);
                });
            },

            setState: function (state) {
                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    brick.setState(state);
                });

                return this;
            },

            clear: function () {
                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    brick.clear();
                });

                return this;
            },

            isValid: function () {
                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    if (!brick.isValid()) {
                        return false;
                    }
                });

                return true;
            },

            setData: function (data) {
                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    brick.setData(data);
                });

                return this;
            },

            getData: function (wrap) {
                var payload = {};

                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    lang.mixin(payload, brick.getData(true));
                });

                return Brick.getData.call(this, payload, wrap);
            }
        });

        ButtonBrick = Brick.extend({
            event: lang.mixin({}, Brick.event,
                {
                    CLICK: "buttonBrick/click"
                }
            ),

            initialize: function (id, config) {
                var that = this;

                lang.mixin(this,
                    {
                        template: "default_button_brick_template",
                        containerClass: "button-brick-container",
                        buttonClass: "btn-primary",
                        label: "Ok"
                    }
                );

                Brick.initialize.call(this, id, config);

                this.node.on("click", "button", function () {
                    that.notify(that.event.CLICK, null);
                });
            },

            isValid: function () {
                return true;
            },

            getData: function (wrap) {
                var payload = {};

                return Brick.getData.call(this, payload, wrap);
            }
        });

        OkCancelButtonBrick = MultiBrick.extend({
            event: lang.mixin({},
                MultiBrick.event,
                ButtonBrick.event,
                {
                    OK_CLICK: "okCancelButtonBrick/okClick",
                    CANCEL_CLICK: "okCancelButtonBrick/cancelClick"
                }
            ),

            okButtonId: "okButton",
            cancelButtonId: "cancelButton",

            initialize: function (id, config) {
                var that = this,
                    newConfig;

                newConfig =
                    {
                        //template: "default_okcancelbutton_brick_template",
                        containerClass: "okcancelbutton-brick-container",
                        header: config.header,
                        content: [
                            {
                                id: this.okButtonId,
                                type: ButtonBrick,
                                config: {
                                    label: config.okLabel,
                                    containerClass: "ok-button-brick-container",
                                    buttonClass: "ok-btn " + (config.okButtonClass || "btn-sm btn-primary"),
                                    freezeStates: config.okFreezeStates || []
                                }
                            },
                            {
                                id: this.cancelButtonId,
                                type: ButtonBrick,
                                config: {
                                    label: config.cancelLabel,
                                    containerClass: "cancel-button-brick-container",
                                    buttonClass: "cancel-btn " + (config.cancelButtonClass || "btn-sm button-none"),
                                    freezeStates: config.cancelFreezeStates || []
                                }
                            }
                        ],
                        required: config.required
                    };

                if (config.reverseOrder) {
                    newConfig.content.reverse();
                }

                MultiBrick.initialize.call(this, id, newConfig);

                lang.mixin(this,
                    {
                        okButtonBrick: this.contentBricks[this.okButtonId],
                        cancelButtonBrick: this.contentBricks[this.cancelButtonId]
                    }
                );

                this.okButtonBrick.on(this.event.CLICK, function () {
                    that.notify(that.event.OK_CLICK, null);
                    that.notify(that.event.CLICK, null);
                });

                this.cancelButtonBrick.on(this.event.CLICK, function () {
                    that.notify(that.event.CANCEL_CLICK, null);
                    that.notify(that.event.CLICK, null);
                });
            },

            isValid: function () {

                return MultiBrick.isValid.call(this);
            },

            getData: function (wrap) {

                return MultiBrick.getData.call(this, wrap);
            }
        });

        ChoiceBrick = Brick.extend({
            initialize: function (id, config) {
                var that = this;

                lang.mixin(this,
                    {
                        template: "default_choice_brick_template",
                        containerClass: "choice-brick-container"
                    }
                );

                Brick.initialize.call(this, id, config);

                lang.mixin(this,
                    {
                        selectedChoice: "",
                        userSelected: false
                    }
                );

                this.choiceButtons = this.node.find(".btn-choice");

                this.node.on("click", ".btn-choice:not(.button-pressed)", function (event) {
                    var choiceKey = $(event.currentTarget).data("key");
                    that.setChoice(choiceKey, true);
                });
            },

            setChoice: function (choiceKey, userSelected) {
                // only set choice if it differs from the current one
                if (choiceKey !== this.selectedChoice || (userSelected ? true : false) !== this.userSelected) {

                    this.userSelected = userSelected ? true : false;
                    this.selectedChoice = choiceKey;

                    this.choiceButtons
                        .removeClass("button-pressed")
                        .filter("[data-key='" + choiceKey + "']")
                        .addClass("button-pressed");

                    console.log("ChoiceBrick-" + this.id, ":", this.selectedChoice, "; userSelected:", this.userSelected);

                    this.notify(this.event.CHANGE, this.getData());
                }
            },

            isUserSelected: function () {
                return this.userSelected;
            },

            clear: function () {
                this.setChoice("", false);

                Brick.clear.call(this);
            },

            isValid: function () {
                return this.selectedChoice !== "";
            },

            setData: function (data) {
                this.setChoice(data.selectedChoice, data.userSelected);

                Brick.setData.call(data);
            },

            getData: function (wrap) {
                var payload = {
                    selectedChoice: this.selectedChoice,
                    userSelected: this.userSelected
                };

                return Brick.getData.call(this, payload, wrap);
            }
        });

        SimpleInputBrick = Brick.extend({
            initialize: function (id, config) {
                var that = this;

                lang.mixin(this,
                    {
                        template: "default_simpleinput_brick_template",
                        containerClass: "simpleinput-brick-container",
                        guid: UtilMisc.guid(),
                        label: config.header
                    }
                );

                Brick.initialize.call(this, id, config);

                lang.mixin(this,
                    {
                        inputValue: "",
                        userEntered: false,
                        formGroup: this.node.find(".form-group"),
                        inputNode: this.node.find("input[type='text']#" + this.guid)
                    }
                );

                this.inputNode.on("input", function (event) {
                    var value = $(event.target).val();
                    that.setInputValue(value, true);
                });
            },

            setInputValue: function (value, userEntered) {
                this.userEntered = userEntered ? true : false;
                this.inputValue = value;

                if (!userEntered) {
                    this.inputNode.val(value);
                }

                this.notify(this.event.CHANGE, this.getData());
            },

            isUserEntered: function () {
                return this.userEntered;
            },

            setState: function (state) {

                switch (state) {
                    case this.state.SUCCESS:
                        this.formGroup.addClass("has-feedback has-success");
                        break;

                    case this.state.ERROR:
                        this.formGroup.addClass("has-feedback has-error");
                        break;

                    case this.state.DEFAULT:
                        this.formGroup.removeClass("has-feedback has-success has-error");
                        break;

                    default:
                        break;
                }

                Brick.setState.call(this, state);

                return this;
            },

            clear: function () {
                this.setInputValue("", false);

                Brick.clear.call(this);
            },

            isValid: function () {
                return this.inputValue !== "";
            },

            setData: function (data) {
                this.setInputValue(data.inputValue, data.userEntered);

                Brick.setData.call(data);
            },

            getData: function (wrap) {
                var payload = {
                    inputValue: this.inputValue,
                    userEntered: this.userEntered
                };

                return Brick.getData.call(this, payload, wrap);
            }
        });

        DropDownBrick = Brick.extend({
            initialize: function (id, config) {
                var that = this;

                lang.mixin(this,
                    {
                        template: "default_dropdown_brick_template",
                        containerClass: "dropdown-brick-container",
                        guid: UtilMisc.guid(),
                        label: config.header
                    }
                );

                Brick.initialize.call(this, id, config);

                lang.mixin(this,
                    {
                        dropDownValue: "",
                        dropDownText: "",
                        userSelected: false,
                        selectNode: this.node.find("select#" + this.guid)
                    }
                );

                this.selectNode.on("input", function () {
                    var option = that.selectNode.find("option:selected");

                    that.setDropDownValue(option, true);
                });

                if (this.options) {
                    this.setDropDownOptions(this.options);
                }
            },

            selectOption: function (selectedOption, userSelected) {
                var option = this.selectNode.find("option[value='" + selectedOption + "']");

                this.selectNode.val(selectedOption);
                this.setDropDownValue(option, userSelected);
            },

            // internal should not be called from outsite
            setDropDownValue: function (option, userSelected) {
                var value = option.val(),
                    text = option.find("option:selected").text();

                this.userSelected = userSelected ? true : false;
                this.dropDownValue = value;
                this.dropDownText = text;

                this.notify(this.event.CHANGE, this.getData());
            },

            setDropDownOptions: function (options, append) {
                UtilMisc.setSelectOptions(this.selectNode, options, append);
            },

            isUserEntered: function () {
                return this.userSelected;
            },

            clear: function () {
                this.selectOption("");

                Brick.clear.call(this);
            },

            isValid: function () {
                return this.inputValue !== "";
            },

            setData: function (data) {

                if (data.options) {
                    this.setDropDownOptions(data.options, data.append);
                }

                if (data.selectedOption) {
                    this.selectOption(data.selectedOption, data.userSelected);
                }

                Brick.setData.call(data);
            },

            getData: function (wrap) {
                var payload = {
                    dropDownValue: this.dropDownValue,
                    dropDownText: this.dropDownText,
                    userSelected: this.userSelected
                };

                return Brick.getData.call(this, payload, wrap);
            }
        });

        ColorPickerBrick = SimpleInputBrick.extend({
            initialize: function (id, config) {
                var that = this,
                    newConfig = {};

                // mixin defaults with the given config
                lang.mixin(newConfig,
                    {
                        template: "default_colorpicker_brick_template",
                        containerClass: "colorpicker-brick-container",
                        guid: UtilMisc.guid(),
                        label: config.header,

                        pickerPosition: "top"
                    },
                    config
                );

                SimpleInputBrick.initialize.call(this, id, newConfig);

                lang.mixin(this,
                    {
                        picker: null,
                        pickerSwatch: this.node.find("#" + this.guid + "pickerSwatch")
                    }
                );

                this.picker = new jscolor.color(this.inputNode[0], {
                    pickerPosition: "top",
                    styleElement: this.pickerSwatch[0], //this.guid + "pickerSwatch",
                    onImmediateChange: function () {
                        that.notify(that.event.CHANGE, that.getData());
                    }
                });

                this.picker.fromString((new RColor()).get(true).slice(1));

                this.pickerSwatch.on("click", function () {
                    that.picker.showPicker();
                });

            },

            setInputValue: function () {
                // chill
            },/*

            isValid: function () {
                // Todo: if allowing color picker to start empty, need to check it's validity; otherwise, it's always valid
            }*/

            /*setData: function (data) {
                //TODO: allow to set colors programmatically
                //this.setInputValue(data.value, ?data.userEntered?);

                return this;
            },*/

            getData: function (wrap) {
                var payload = {
                    hex: this.picker.toString(),
                    rgb: this.picker.rgb,
                    hsv: this.picker.hsv
                };

                return Brick.getData.call(this, payload, wrap);
            }
        });

        FileInputBrick = SimpleInputBrick.extend({
            initialize: function (id, config) {
                var that = this,
                    newConfig = {};

                // mixin defaults with the given config
                lang.mixin(newConfig,
                    {
                        template: "default_fileinput_brick_template",
                        containerClass: "fileinput-brick-container",
                        guid: UtilMisc.guid(),
                        label: config.header
                    },
                    config
                );

                SimpleInputBrick.initialize.call(this, id, newConfig);

                lang.mixin(this,
                    {
                        fileValue: null,
                        userSelected: false,
                        browseFilesContainer: this.node.find(".browse-files"),
                        fileNode: this.node.find("input[type='file']#" + this.guid + "realBrowse"),
                        filePseudoNode: this.node.find("#" + this.guid + "pseudoBrowse")
                    }
                );

                UtilMisc.styleBrowseFilesButton(this.browseFilesContainer);

                this.fileNode.on("change", function (event) {
                    var file = event.target.files[0];

                    that.setFileValue(file, true);
                });
            },

            setInputValue: function (value, userEntered) {
                this.setFileValue(null, false);

                SimpleInputBrick.setInputValue.call(this, value, userEntered);
            },

            setFileValue: function (value, userSelected) {
                this.userSelected = userSelected ? true : false;
                this.fileValue = value;
                this.filePseudoNode.toggleClass("selected", this.fileValue ? true : false);

                if (this.fileValue) {
                    SimpleInputBrick.setInputValue.call(this, this.fileValue.name, false);

                    this.notify(this.event.CHANGE, this.getData());
                } else {
                    UtilMisc.resetFormElement(this.fileNode);
                }
            },

            isUserSelected: function () {
                return this.userSelected;
            },

            clear: function () {
                this.setInputValue("", false);

                Brick.clear.call(this);
            },

            isValid: function () {
                return SimpleInputBrick.isValid.call(this) || this.fileValue ? true : false;
            },

            setData: function (data) {
                if (data.fileValue) {
                    this.setFileValue(data.fileValue, data.userSelected);
                } else if (data.inputValue) {
                    this.setInputValue(data.inputValue, data.userEntered);
                }

                SimpleInputBrick.setData.call(data);
            },

            getData: function (wrap) {
                var payload = SimpleInputBrick.getData.call(this);

                lang.mixin(payload,
                    {
                        fileValue: this.fileValue,
                        userSelected: this.userSelected
                    }
                );

                return Brick.getData.call(this, payload, wrap);
            }
        });

        return {

            /**
             * The basic Brick prototype with no special functions. A base from all other Bricks.
             *
             * @for Bricks
             * @property Brick
             * @type Brick
             */
            Brick: Brick,

            /**
             * The MultiBrick prototype. Used as a container for multiple independent Bricks if they are required to be displayed side by side.
             *
             * @property MultiBrick
             * @type MultiBrick
             */
            MultiBrick: MultiBrick,

            /**
             * The ButtonBrick prototype. A simple Brick with a button template.
             *
             * @property ButtonBrick
             * @type ButtonBrick
             */
            ButtonBrick: ButtonBrick,
            /**
             * The OkCancelButtonBrick prototype. A MultiBrick with two ButtonBricks displayed side by side and styled as OK and Cancel buttons.
             *
             * @property OkCancelButtonBrick
             * @type OkCancelButtonBrick
             */
            OkCancelButtonBrick: OkCancelButtonBrick,

            /**
             * The ChoiceBrick prototype. Provides a user the ability to choose a single item among several.
             *
             * @property ChoiceBrick
             * @type ChoiceBrick
             */
            ChoiceBrick: ChoiceBrick,

            /**
             * The DropDownBrick prototype. Provides a dropdown control to choose an item from.
             *
             * @property DropDownBrick
             * @type DropDownBrick
             */
            DropDownBrick: DropDownBrick,
            /**
             * The ColorPickerBrick prototype. Provides a control to select a color.
             *
             * @property ColorPickerBrick
             * @type ColorPickerBrick
             */
            ColorPickerBrick: ColorPickerBrick,
            /**
             * The SimpleInputBrick prototype. Provides a control for a simple text input. Can be potentially extended to serve more specific purposes.
             *
             * @property SimpleInputBrick
             * @type SimpleInputBrick
             */
            SimpleInputBrick: SimpleInputBrick,
            /**
             * The FileInputBrick prototype extends SimpleInputBrick. Provides a control to either select a local file or enter its URL.
             *
             * @property FileInputBrick
             * @type FileInputBrick
             */
            FileInputBrick: FileInputBrick
        };
    });