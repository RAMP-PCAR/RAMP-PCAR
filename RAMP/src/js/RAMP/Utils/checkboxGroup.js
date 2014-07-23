/* global define */

/**
* @module Utils
*/

/**
* [Description]
*
* @class CheckboxGroup
* @uses dojo/Evented
* @uses dojo/_base/declare
* @uses dojo/_base/lang
* @uses dojo/_base/array
* @uses Checkbox
*/

define(["dojo/Evented", "dojo/_base/declare", "dojo/_base/lang", "dojo/_base/array",

        "utils/checkbox"],
    function (Evented, declare, lang, dojoArray,
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
        /*function _toggleLabels(that, objs) {
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
        }*/

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
        /*function _toggleState(that, nodes, fcn) {
            nodes.each(function () {
                $(this).prop('checked', fcn($(this)));
            });

            _toggleLabels(that, nodes);
        }*/

        return declare([Evented], {
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
                    checkbox,
                    checkboxOptions;

                // declare individual properties inside the constructor: http://dojotoolkit.org/reference-guide/1.9/dojo/_base/declare.html#id6
                lang.mixin(this,
                    {
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

                        onChange: function () { },

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

                            onChange: function () { }
                        }
                    },
                    options,
                    {
                        nodes: nodes
                    }
                );

                checkboxOptions = {
                    nodeIdAttr: this.nodeIdAttr,
                    cssClass: this.cssClass,
                    label: this.label,
                    onChange: this.onChange
                };

                this.nodes.each(function (index, node) {
                    node = $(node);
                    checkbox = new Checkbox(node, checkboxOptions);
                    that.checkboxes.push(checkbox);

                    checkbox.on("toggle", function (evt) {
                        // re-emit individual checkbox's toggle event as groups;
                        //console.log("CheckboxGroup ->", evt.checkbox.id, "set by", evt.agency, "to", evt.checkbox.state);

                        that.emit("memberToggle", evt);

                        if (evt.agency === evt.checkbox.agency.USER) {
                            that._checkMaster();
                        }
                    });
                });

                if (this.master.node) {
                    this.master.checkbox = new Checkbox(
                        this.master.node,
                        lang.mixin(checkboxOptions, this.master)
                    );

                    this.master.checkbox.on("toggle", function (evt) {
                        // re-emit individual checkbox's toggle event as groups;
                        //console.log("CheckboxGroup Master ->", evt.checkbox.id, "set by", evt.agency, "to", evt.checkbox.state);
                        that.emit("masterToggle", evt);

                        if (evt.agency === evt.checkbox.agency.USER) {
                            that.setState(evt.checkbox.state);
                        }
                    });
                } else {
                    this.master = null;
                }
            },

            _checkMaster: function () {
                var allChecked = dojoArray.every(this.checkboxes, function (checkbox) {
                    //return checkbox.isChecked();
                    return checkbox.state;
                });

                if (this.master) {
                    this.master.checkbox.setState(allChecked);
                }
            },

            /**
             *
             * @param {Boolean} state
             * @param {String} [checkboxId]
             */
            setState: function (state, checkboxId) {
                var checkbox,
                    masterCheckboxId = this.master.checkbox ? this.master.checkbox.id : undefined;

                if (!checkboxId || masterCheckboxId === checkboxId) {
                    this.master.checkbox.setState(state);

                    this.checkboxes.forEach(function (checkbox) {
                        checkbox.setState(state);
                    });
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

                return this;
            }//,

            /*setState123: function (checkboxId, state) {
                var checkbox;
                for (var i = 0; i < this.checkboxes.length; i++) {
                    checkbox = this.checkboxes[i];
                    if (checkbox.id === checkboxId) {
                        break;
                    }
                }

                checkbox.setState(state);
            },*/

            /*_constructor: function (nodes, checkedClass, focusedClass, labels, fnc) {
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
            },*/

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
            /*_setState_: function (fcn) {
                _toggleState(this, this.nodes, fcn);

                return this;
            },*/

            /**
            * Returns original checkbox nodes.
            *
            * @method getNodes
            * @return {jObject} original checkbox nodes
            */
            /*getNodes: function () {
                return this.nodes;
            }*/
        });
    });