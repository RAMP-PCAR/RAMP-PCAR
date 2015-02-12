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
            MultiBrick,
            ChoiceBrick,
            SimpleInputBrick,
                
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
                        required: []
                    },
                    config,
                    {
                        id: id,
                        _listeners: {}
                    }
                );

                this.node = template(this.template, this);

            },

            _notify: function (eventName, data) {

                if (!this._listeners[eventName]) {
                    this._listeners[eventName] = [];
                }
                this._listeners[eventName].forEach(function (listener) {
                    listener.call(this, data);
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

        ButtonBrick = Brick.extend({
            initialize: function (id, config) {
                var that = this;

                lang.mixin(this,
                    {
                        template: "default_button_brick_template",
                        buttonClass: "btn-primary",
                        label: "Ok"
                    }
                );

                Brick.initialize.call(this, id, config);

                this.node.on("click", "button", function () {
                    that._notify("click", null);
                });
            },

            isValid: function () {
                return true;
            },

            getData: function (wrap) {
                var payload = {
                    selectedChoice: this.selectedChoice,
                    userSelected: this.userSelected
                };

                return Brick.getData.call(this, payload, wrap);
            }
        });

        MultiBrick = Brick.extend({
            initialize: function (id, config) {
                var that = this;

                lang.mixin(this,
                    {
                        template: "default_multi_brick_template",
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
            }/*,

            isValid: function () {
                return this.innerBricks.every(function (innerBrick) {
                    return innerBrick.isValid();
                });
            },

            getInnerBricks: function () {

            },

            getData: function (wrap) {
                var payload = {};

                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    lang.mixin(payload, brick.getData(true));
                });

                return Brick.getData.call(this, payload, wrap);
            }*/
        });

        ChoiceBrick = Brick.extend({
            initialize: function (id, config) {
                var that = this;

                lang.mixin(this,
                    {
                        template: "default_choice_brick_template"
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

                    this._notify("change", this.getData());
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
                        guid: UtilMisc.guid(),
                        label: config.header
                    }
                );

                Brick.initialize.call(this, id, config);

                lang.mixin(this,
                    {
                        inputValue: "",
                        userEntered: false
                    }
                );

                this.inputNode = this.node.find("input");

                this.inputNode.on("input", function (event) {
                    var value = $(event.target).val();
                    that.setInputValue(value, true);
                });
            },

            setInputValue: function (value, userEntered) {
                this.userEntered = userEntered ? true : false;
                this.inputValue = value;

                this.inputNode.val(value);

                console.log("SimpleInputBrick-" + this.id, ":", this.inputValue, "; userEntered:", this.userEntered);

                this._notify("change", this.getData());
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

        return {

            ButtonBrick: ButtonBrick,
            MultiBrick: MultiBrick,
            ChoiceBrick: ChoiceBrick,
            SimpleInputBrick: SimpleInputBrick
        };
    });