/* global define */

/**
* @module Utils
*/

/**
* [Description]
*
* @class Checkbox
* @uses dojo/Evented
* @uses dojo/_base/declare
* @uses dojo/lang
*/

define(["dojo/Evented", "dojo/_base/declare", "dojo/_base/lang"],
    function (Evented, declare, lang) {
        "use strict";

        return declare([Evented], {
            /**
            * Wraps the specified checkbox to provide an alternative rendering of checkbox without compromising
            * its functionality. Handles synchronization of the checkbox's state with its new rendering.
            * Also adds highlight/unhighlight on focus/unfocus, update label when checked/unchecked
            *
            * @method constructor
            * @static
            * @param {jObject} nodes a jQuery object representing the checkbox
            * @param {String} checkedClass Name of the CSS class to be used when checked
            * @param {String} focusedClass Name of the CSS class to be used when focused
            * @param {object} labels An object containing labels' text { checked: "label when checked", unchecked: "label when unchecked" }
            * @param {Function} [fnc] Function to run on the label node when it's toggled
            * @return {CheckboxWrapper} A control objects allowing to toggle checkboxes supplying a state, and retrieve original checkbox nodes
            */
            constructor: function (node, options) {
                var that = this;

                // declare individual properties inside the constructor: http://dojotoolkit.org/reference-guide/1.9/dojo/_base/declare.html#id6
                lang.mixin(this,
                    {
                        node: null,

                        labelNode: null,

                        nodeIdAttr: "id",

                        cssClass: {
                            active: "active",
                            focus: "focused",
                            check: "checked"
                        },

                        label: {
                            check: "checked",
                            uncheck: "unchecked"
                        },

                        onChange: function () { },

                        state: null,
                        id: null,

                        agency: {
                            USER: "USER",
                            CODE: "CODE"
                        }
                    },
                    options,
                    {
                        node: node
                    }
                );

                this.node
                    .on("change", function () {
                        that._toggleLabel();

                        that._emit(that.agency.USER);
                    })
                    .on("focus", function () {
                        that.node.findInputLabel().addClass(that.cssClass.focus);
                    })
                    .on("focusout", function () {
                        that.node.findInputLabel().removeClass(that.cssClass.focus);
                    });

                this.id = this.node.data(this.nodeIdAttr);
                this.labelNode = this.node.findInputLabel();

                this._toggleLabel();
            },

            /*
            * Adds the "checked", "focused" or "active" CSS class to the label so it displays visually matches the changed state.
            * Updates the title attribute and text inside an invisible span housed inside the label.
            *
            * @method _toggleLabel
            * @private
            */
            _toggleLabel: function () {
                var newText;

                this.state = this.node.is(':checked');

                if (this.state) {
                    newText = String.format(this.label.check,
                        this.labelNode.data("label-name"));

                    this.labelNode
                        .addClass(this.cssClass.check)
                        .prop('title', newText)
                        .find("> span").text(newText);
                } else {
                    newText = String.format(this.label.uncheck,
                        this.labelNode.data("label-name"));

                    this.labelNode
                        .removeClass(this.cssClass.check)
                        .prop('title', newText)
                        .find("> span").text(newText);
                }

                this.onChange.call(this);
            },

            _emit: function (agency) {
                //console.log("Checkbox ->", this.id, "set by", agency, "to", this.state);

                this.emit("toggle", {
                    agency: agency,
                    checkbox: this,
                    id: "???"
                });
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
            /*setAll: function (state) {
                _toggleState(this, this.nodes, function () {
                    return state;
                }, this.checkedClass);

                return this;
            },*/

            /**
            * Toggles the checkboxes based on the return value of the given fcn.
            *
            * @method setState
            * @param {function} fcn A function to be run on each of the nodes to determine the state to be set
            * @return {object} Control object for chaining
            * @chainable
            */
            /*setState: function (fcn) {
                _toggleState(this, this.nodes, fcn);

                return this;
            },*/

            /**
            * Toggle the state of Checkbox.
            *
            * @method setState
            * @param {boolean} state Specifies the state of the checkbox: true, false
            * @return {object} Control object for chaining
            * @chainable
            * @for Checkbox
            */
            setState: function (state) {
                // change state only if it's different from the current one
                if (this.state !== state) {
                    this.node.prop('checked', state);
                    this._toggleLabel();

                    this._emit(this.agency.CODE);
                }

                return this;
            }
        });
    });