/* global define, console, $ */

/**
* @module 
*/

/**
*
*
* @class LayerGroup
* @constructor
* @uses dojo/Evented
* @uses dojo/_base/declare
* @uses dojo/_base/lang
* @uses dojo/_base/array
* @uses Checkbox
*
* @param {JArray} nodes a jQuery object representing the checkboxes to be grouped
* @param {Object} [options] Additional options
* @param {String} [options.nodeIdAttr] Name of the "data-*" attribute set on the checkbox node to be treated as the checkbox id. If no appropriate "data-*" attribute found,
* `nodeIdAttr` is used directly, failing that, regular `id` is used.
* @param {Object} [options.cssClass] `active`, `focus`, and `check` CSS class to be applied to the Checkbox correspondingly.
* @param {Object} [options.cssClass.active] CSS class to be set when the Checkbox is `active`.
* @param {Object} [options.cssClass.focus] CSS class to be set when the Checkbox is `focused`.
* @param {Object} [options.cssClass.check] CSS class to be set when the Checkbox is `checked`.
* @param {Object} [options.label] `check` and `uncheck` label texts to be applied to the Checkbox labels.
* @param {Object} [options.label.check] A text to be set as a label when the Checkbox is `checked`
* @param {Object} [options.label.uncheck] A text to be set as a label when the Checkbox is `unchecked`
* @param {Function} [options.onChnage] A function to be called when the state of the Checkbox changes.
* @param {Object} [options.master] Additional options applied to the master Checkbox.
* @param {Object} [options.master.node] An `input` node to serve as the master Checkbox for the group.
* @param {Object} [options.master.cssClass] `active`, `focus`, and `check` CSS class to be applied to the master Checkbox correspondingly.
* @param {Object} [options.master.cssClass.active] CSS class to be set when the Checkbox is `active`.
* @param {Object} [options.master.cssClass.focus] CSS class to be set when the master Checkbox is `focused`.
* @param {Object} [options.master.cssClass.check] CSS class to be set when the master Checkbox is `checked`.
* @param {Object} [options.master.label] `check` and `uncheck` label texts to be applied to the master Checkbox labels.
* @param {Object} [options.master.label.check] A text to be set as a label when the master Checkbox is `checked`
* @param {Object} [options.master.label.uncheck] A text to be set as a label when the master Checkbox is `unchecked`
* @param {Function} [options.master.onChnage] A function to be called when the state of the master Checkbox changes.
*
* @return {CheckboxGroup} A control objects allowing to toggle individual checkboxes in a group as well as the group as a whole.
*/

define(["dojo/Evented", "dojo/_base/declare", "dojo/_base/lang", "dojo/_base/array",
        "ramp/layerItem"],
    function (Evented, declare, lang, dojoArray,
            Checkbox) {
        "use strict";

        return declare([Evented], {
            constructor: function (nodes, options) {
                var that = this,
                    checkbox,
                    checkboxOptions;

                // declare individual properties inside the constructor: http://dojotoolkit.org/reference-guide/1.9/dojo/_base/declare.html#id6
                lang.mixin(this,
                    {
                        /**
                         * Nodes of the checkbox nodes originally supplied to the CheckboxGroup.
                         *
                         * @property nodes
                         * @type JArray
                         * @default []
                         */
                        nodes: [],

                        /**
                         * Name of the "data-*" attribute set on the checkbox node to be treated as the checkbox id.
                         *
                         * @property nodeIdAttr
                         * @type String
                         * @default "id"
                         */
                        nodeIdAttr: "id",

                        /**
                         * An array of the Checkbox object belonging to the body of the group.
                         *
                         * @property nodes
                         * @type Array
                         * @default []
                         */
                        checkboxes: [],

                        /**
                         * `active`, `focus`, and `check` CSS class to be applied to the Checkbox correspondingly.
                         *
                         * @property cssClass
                         * @type {Object}
                         * @default
                         * @example
                         *      cssClass: {
                         *          active: "active",
                         *          focus: "focused",
                         *          check: "checked"
                         *      }
                         */
                        cssClass: {
                            active: "active",
                            focus: "focused",
                            check: "checked"
                        },

                        /**
                         * `check` and `uncheck` label texts to be applied to the Checkbox labels.
                         *
                         * @property label
                         * @type {Object}
                         * @default
                         * @example
                         *      label: {
                         *          check: "check",
                         *          uncheck: "unchecked"
                         *      }
                         */
                        label: {
                            check: "checked",
                            uncheck: "unchecked"
                        },

                        /**
                         * A function to be called when the state of the Checkbox changes.
                         *
                         * @property onChnage
                         * @type Function
                         * @default
                         * @example     function () { }
                         */
                        onChange: function () { },

                        /**
                         * Options for the master Checkbox.
                         *
                         * @property master
                         * @type Object
                         * @default
                         * @example
                         *      master: {
                         *          node: null,
                         *          checkbox: null,
                         *          nodeIdAttr: null,
                         *
                         *          cssClass: {
                         *              active: "active",
                         *              focus: "focused",
                         *              check: "checked"
                         *          },
                         *
                         *          label: {
                         *              check: "checked",
                         *              uncheck: "unchecked"
                         *          },
                         *
                         *          onChange: function () { }
                         *      }
                         *
                         */
                        master: {
                            node: null,
                            checkbox: null,
                            nodeIdAttr: null,

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
                        },

                        /**
                        * Event names published by the Checkbox
                        *
                        * @private
                        * @property event
                        * @type Object
                        * @default null
                        * @example
                        *      {
                        *          MEMBER_TOGGLE: "checkbox/toggled",
                        *          MASTER_TOGGLE: "checkbox/toggled"
                        *      }
                        */
                        event: {
                            /**
                            * This event is not published by CheckboxGroup. __Ignore this.__
                            *
                            * @event TOGGLE
                            * @private
                            */

                            /**
                            * Published whenever a Checkbox get toggled.
                            *
                            * @event MEMBER_TOGGLE
                            * @param event {Object}
                            * @param event.checkbox {Checkbox} Checkbox object that has been toggled
                            * @param event.agency {String} Agency that toggled the Checkbox
                            */
                            MEMBER_TOGGLE: "checkbox/member-toggle",

                            /**
                            * Published whenever the master Checkbox get toggled.
                            *
                            * @event MASTER_TOGGLE
                            * @param event {Object}
                            * @param event.checkbox {Checkbox} master Checkbox object that has been toggled
                            * @param event.agency {String} Agency that toggled the Checkbox
                            */
                            MASTER_TOGGLE: "checkbox/master-toggle"
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

                // Create individual Checkboxes
                this.nodes.each(function (index, node) {
                    node = $(node);
                    checkbox = new Checkbox(node, checkboxOptions);
                    that.checkboxes.push(checkbox);

                    checkbox.on(checkbox.event.TOGGLE, function (evt) {
                        // re-emit individual checkbox's toggle event as groups;
                        //console.log("CheckboxGroup ->", evt.checkbox.id, "set by", evt.agency, "to", evt.checkbox.state);

                        that.emit(that.event.MEMBER_TOGGLE, evt);

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

                    this.master.checkbox.on(this.master.checkbox.event.TOGGLE, function (evt) {
                        // re-emit individual checkbox's toggle event as groups;
                        console.log("CheckboxGroup Master ->", evt.checkbox.id, "set by", evt.agency, "to", evt.checkbox.state);

                        that.emit(that.event.MASTER_TOGGLE, evt);

                        if (evt.agency === evt.checkbox.agency.USER) {
                            that.setState(evt.checkbox.state);
                        }
                    });
                } else {
                    this.master = null;
                }
            },

            /**
             * Synchronizes the state of the master Checkbox with the state of the group.
             * All group members checked -> master checked
             * Any of the group members unchecked -> master unchecked
             *
             * @method _checkMaster
             * @private
             */
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
            * Toggles the state of the specified Checkbox. If checkboxId is not supplied, toggles the whole group.
            *
            * @method setState
            * @param {Boolean} state Specifies the state of the checkbox: true, false
            * @param {String} [checkboxId] Specifies the checkbox to toggle.
            * @return CheckboxGroup
            * @chainable
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
            },

            /**
            * Toggle all the checkboxes based on the return value of the given function.
            *
            * @param {Function} fcn a function that takes a checkbox as an argument and returns
            * true if the given checkbox should be toggled on, false if it should be toggled off
            * @method setEachState
            * @chainable
            */
            setEachState: function (fcn) {
                this.checkboxes.forEach(function (checkbox) {
                    checkbox.setState(fcn(checkbox));
                });
                this._checkMaster();
                return this;
            }
        });
    });