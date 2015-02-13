/*global console, define, $, Base */

/**
* @module Utils
*/

/**
* Set of functions that deal with arrays.
*
* @class Bricks
* @static
* @uses dojo/_base/array
* @uses dojo/_base/lang
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
            SimpleInputBrick,
            FileInputBrick,

            templates = JSON.parse(TmplHelper.stringifyTemplate(bricks_template));

        console.log(UtilDict);

        function template(key, data) {
            /*jshint validthis: true */
            return $(TmplHelper.template.call(this, key, data, templates)); // -> No Strict violation!
        }

        Brick = Base.extend({
            initialize: function (id, config) {

                lang.mixin(this,
                    {
                        required: [],
                        baseTemplate: "default_base_template"
                    },
                    config,
                    {
                        id: id,
                        _listeners: {}
                    }
                );

                this.node = template(this.baseTemplate, this);

            },

            notify: function (eventName, data) {
                var that = this;

                if (!this._listeners[eventName]) {
                    this._listeners[eventName] = [];
                }
                this._listeners[eventName].forEach(function (listener) {
                    listener.call(that, data);
                });
            },

            on: function (eventName, listener) {
                if (!this._listeners[eventName]) {
                    this._listeners[eventName] = [];
                }
                this._listeners[eventName].push(listener);

                return this;
            },

            isValid: function () {
                return true;
            },

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

            disable: function (disable) {
                if (disable) {
                    this.node.find("button").attr("disabled", true);
                } else {
                    this.node.find("button").attr("disabled", false);
                }
            }
        });

        MultiBrick = Brick.extend({
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

                    that.multiContainer.append(contentBrick.node);
                });
            },

            isValid: function () {
                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    if (!brick.isValid()) {
                        return false;
                    }
                });

                return true;
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
                    that.notify("click", null);
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
            initialize: function (id, config) {
                var that = this,
                    okButtonId = "okButton",
                    cancelButtonId = "cancelButton",
                    newConfig;

                newConfig =
                    {
                        //template: "default_okcancelbutton_brick_template",
                        containerClass: "okcancelbutton-brick-container",
                        header: config.header,
                        content: [
                            {
                                id: okButtonId,
                                type: ButtonBrick,
                                config: {
                                    label: config.okLabel,
                                    containerClass: "ok-button-brick-container",
                                    buttonClass: "ok-btn " + config.okButtonClass
                                }
                            },
                            {
                                id: cancelButtonId,
                                type: ButtonBrick,
                                config: {
                                    label: config.cancelLabel,
                                    containerClass: "cancel-button-brick-container",
                                    buttonClass: "cancel-btn " + config.cancelButtonClass
                                }
                            }
                        ],
                        required: config.required || [] // make sure required is at least an empty array
                    };

                MultiBrick.initialize.call(this, id, newConfig);

                lang.mixin(this,
                    {
                        okButtonBrick: this.contentBricks[okButtonId],
                        cancelButtonBrick: this.contentBricks[cancelButtonId]
                    }
                );

                this.okButtonBrick.on("click", function () {
                    that.notify("okClick", null);
                    that.notify("click", null);
                });

                this.cancelButtonBrick.on("click", function () {
                    that.notify("cancelClick", null);
                    that.notify("click", null);
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

                    this.notify("change", this.getData());
                }
            },

            isUserSelected: function () {
                return this.userSelected;
            },

            isValid: function () {
                return this.selectedChoice !== "";
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

                this.inputNode.val(value);

                this.notify("change", this.getData());
            },

            isUserEntered: function () {
                return this.userEntered;
            },

            isValid: function () {
                return this.inputValue !== "";
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
                    var value = that.selectNode.val(),
                        text = that.selectNode.find("option:selected").text();

                    that.setDropDownValue(value, text, true);
                });

                if (this.options) {
                    this.setDropDownOptions(this.options);
                }
            },

            setDropDownValue: function (value, text, userSelected) {
                this.userSelected = userSelected ? true : false;
                this.dropDownValue = value;
                this.dropDownText = text;

                // to do set node if set manually

                this.notify("change", this.getData());
            },

            setDropDownOptions: function (options, append) {
                UtilMisc.setSelectOptions(this.selectNode, options, append);
            },

            isUserEntered: function () {
                return this.userSelected;
            },

            isValid: function () {
                return this.inputValue !== "";
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

        FileInputBrick = SimpleInputBrick.extend({
            initialize: function (id, config) {
                var that = this;

                lang.mixin(config,
                    {
                        template: "default_fileinput_brick_template",
                        containerClass: "fileinput-brick-container",
                        guid: UtilMisc.guid(),
                        label: config.header
                    }
                );

                SimpleInputBrick.initialize.call(this, id, config);

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
                    this.inputNode.val(this.fileValue.name);
                    this.userEntered = false;

                    this.notify("change", this.getData());
                } else {
                    UtilMisc.resetFormElement(this.fileNode);
                }
            },

            isUserSelected: function () {
                return this.userSelected;
            },

            isValid: function () {
                return SimpleInputBrick.isValid.call(this) || this.fileValue ? true : false;
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

            MultiBrick: MultiBrick,

            ButtonBrick: ButtonBrick,
            OkCancelButtonBrick: OkCancelButtonBrick,

            ChoiceBrick: ChoiceBrick,

            DropDownBrick: DropDownBrick,
            SimpleInputBrick: SimpleInputBrick,
            FileInputBrick: FileInputBrick
        };
    });