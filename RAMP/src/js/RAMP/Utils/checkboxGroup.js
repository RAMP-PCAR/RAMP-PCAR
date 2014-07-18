/* global define */

/**
* @module Utils
*/

/**
* [Description]
*
* @class CheckboxGroup
* @uses dojo/_base/declare
* @ueses dojo/_base/lang
* @ueses dojo/on
* @uses Checkbox
*/

define(["dojo/_base/declare", "dojo/_base/lang", "dojo/on",

        "utils/checkbox"],
    function (declare, lang, on,
            Checkbox) {
        "use strict";

        /*
        * Goes through an array of checkboxes and if any are selected, add the "checked" css class to
        * the label so it displays visually matches the changed state
        *
        * @method _toggleLabels
        * @private
        * @param {Object} objs An array of checkboxes to toggle
        */
        function _toggleLabels(that, objs) {
            var label;

            objs.each(function (i, obj) {
                var node = $(obj),
                    newText;
                label = node.findInputLabel();
                if (node.is(':checked')) {
                    newText = String.format(that.labels.checked,
                        label.data("label-name"));
                    label
                        .addClass(that.checkedClass)
                        .prop('title', newText)
                        .find("> span").text(newText);
                } else {
                    newText = String.format(that.labels.unchecked,
                        label.data("label-name"));
                    label
                        .removeClass(that.checkedClass)
                        .prop('title', newText)
                        .find("> span").text(newText);
                }
                if (that.fnc) {
                    that.fnc.call(this, label.parent(), null, "update");
                }
            });
        }

        /*
        * Goes through an array of checkboxes and toggles their checked state value based
        * on the return value of the given function
        *
        * @private
        * @method _toggleState
        * @param {Object} nodes An Array of checkboxes
        * @param {Function} fcn A function that takes a checkbox node as input and returns
        * true if the checkbox should be checked, and false if the checkbox should be unchecked.
        *
        */
        function _toggleState(that, nodes, fcn) {
            nodes.each(function () {
                $(this).prop('checked', fcn($(this)));
            });

            _toggleLabels(that, nodes);
        }

        var checkboxGroupAttrTemplate = {
            masterCheckbox: null,
            onChange: null
        };

        return declare(null, {
            nodes: [],

            nodeIdAttr: "id",

            checkboxes: [],

            cssClass: {
                active: "active",
                focus: "focused",
                check: "checked"
            },

            label: {
                check: "checked",
                uncheck: "unchecked"
            },

            onChange: null,

            master: {
                node: null,
                checkbox: null,

                cssClass: {
                    active: "active",
                    focus: "focused",
                    check: "checked"
                },

                label: {
                    check: "checked",
                    uncheck: "unchecked"
                },

                onChange: null
            },

            /**
            * Wraps the specified checkbox to provide an alternative rendering of checkbox without compromising
            * its functionality. Handles synchronization of the checkbox's state with its new rendering.
            * Also adds highlight/unhighlight on focus/unfocus, update label when checked/unchecked
            *
            * @method styleCheckboxes
            * @static
            * @param {jObject} nodes a jQuery object representing the checkbox
            * @param {String} checkedClass Name of the CSS class to be used when checked
            * @param {String} focusedClass Name of the CSS class to be used when focused
            * @param {object} labels An object containing labels' text { checked: "label when checked", unchecked: "label when unchecked" }
            * @param {Function} [fnc] Function to run on the label node when it's toggled
            * @return {CheckboxWrapper} A control objects allowing to toggle checkboxes supplying a state, and retrieve original checkbox nodes
            */
            constructor: function (nodes, options) {
                var that = this,
                    checkbox;

                lang.mixin(this, options);
                this.nodes = nodes;

                nodes.each(function (index, node) {
                    checkbox = new Checkbox(node, cssClass, label, onChange);
                    this.checkboxes.push(checkbox);

                    on(checkbox, "toggle", function (evt) {
                        that._checkMaster();
                    });
                });

                if (this.master.node) {
                    this.master.checkbox = new Checkbox(
                        this.master.node,
                        this.master.cssClass,
                        this.master.label);

                    on(this.master.checkbox, "toggle", function (evt) {
                        that.setState(evt.state);
                    });
                } else {
                    this.master = null;
                }
            },

            _checkMaster: function () {
                var allChecked = dojoArray.every(this.checkboxes, function (checkbox) {
                    return checkbox.isChecked();
                });

                if (this.master) {
                    this.master.checkbox.setState(allChecked);
                }
            },

            /**
             *
             * @param {Boolean} [checkboxId]
             */
            setState: function (state, checkboxId) {
                var checkbox;

                if (!checkboxId) {
                    if (this.master) {
                        this.master.checkbox.setState(state);

                        this.checkboxes.forEach(function (checkbox) {
                            checkbox.setState(state);
                        });
                    }
                } else {
                    for (var i = 0; i < this.checkboxes.length; i++) {
                        checkbox = this.checkboxes[i];
                        if (checkbox.id === checkboxId) {
                            break;
                        }
                    }

                    checkbox.setState(state);

                    this._checkMaster();
                }
            },

            setState123: function (checkboxId, state) {
                var checkbox;
                for (var i = 0; i < this.checkboxes.length; i++) {
                    checkbox = this.checkboxes[i];
                    if (checkbox.id === checkboxId) {
                        break;
                    }
                }

                checkbox.setState(state);
            },

            _constructor: function (nodes, checkedClass, focusedClass, labels, fnc) {
                this.checkedClass = checkedClass;
                this.nodes = nodes;
                this.labels = labels;
                this.fnc = fnc;

                var that = this;

                nodes
                    .on("change", function () {
                        _toggleLabels(that, $(this));
                    })
                    .on("focus", function () {
                        $(this).findInputLabel().addClass(focusedClass);
                    })
                    .on("focusout", function () {
                        $(this).findInputLabel().removeClass(focusedClass);
                    });

                _toggleLabels(that, nodes);
            },

            /**
            * Toggle the state of checkboxes.
            *
            * @method setAll
            * @param {boolean} state Specifies the state of the checkbox: true, false
            * @return {object} Control object for chaining
            * @chainable
            * @for CheckboxWrapper
            */
            setAll: function (state) {
                _toggleState(this, this.nodes, function () {
                    return state;
                }, this.checkedClass);

                return this;
            },

            /**
            * Toggles the checkboxes based on the return value of the given fcn.
            *
            * @method setState
            * @param {function} fcn A function to be run on each of the nodes to determine the state to be set
            * @return {object} Control object for chaining
            * @chainable
            */
            _setState_: function (fcn) {
                _toggleState(this, this.nodes, fcn);

                return this;
            },

            /**
            * Returns original checkbox nodes.
            *
            * @method getNodes
            * @return {jObject} original checkbox nodes
            */
            getNodes: function () {
                return this.nodes;
            }
        });
    });