/* global define */

/**
* @module Utils
*/

/**
* Wraps the specified checkbox input nodes to provide an alternative rendering of checkbox without compromising
* its functionality. Handles synchronization of the checkbox's state with its new rendering.
* Also adds highlight/unhighlight on focus/unfocus, update label when checked/unchecked
*
* ####Imports RAMP Modules:
* {{#crossLink 'Util'}}{{/crossLink}}
*
* @class Checkbox
* @constructor
* @uses dojo/Evented
* @uses dojo/_base/declare
* @uses dojo/lang
*
* @param {jObject} node a jQuery object representing the input checkbox node to be wrapped
* @param {Object} [options] Additional options
* @param {String} [options.nodeIdAttr] Name of the 'data-*' attribute set on the checkbox node to be treated as
* the checkbox id. If no appropriate 'data-*' attribute found, `nodeIdAttr` is used directly, failing that, regular
* `id` is used.
* @param {Object} [options.cssClass] `active`, `focus`, and `check` CSS class to be applied to the Checkbox
* correspondingly.
* @param {Object} [options.cssClass.active] CSS class to be set when the Checkbox is `active`.
* @param {Object} [options.cssClass.focus] CSS class to be set when the Checkbox is `focused`.
* @param {Object} [options.cssClass.check] CSS class to be set when the Checkbox is `checked`.
* @param {Object} [options.label] `check` and `uncheck` label texts to be applied to the Checkbox labels.
* @param {Object} [options.label.check] A text to be set as a label when the Checkbox is `checked`
* @param {Object} [options.label.uncheck] A text to be set as a label when the Checkbox is `unchecked`
* @param {Function} [options.onChnage] A function to be called when the state of the Checkbox changes.
*
* @return {Checkbox} A control objects allowing to toggle checkbox.
*/

define(['dojo/Evented', 'dojo/_base/declare', 'dojo/_base/lang', 'utils/util'],
    function (Evented, declare, lang, Util) {
        'use strict';

        var Checkbox;

        Checkbox = declare([Evented], {
            constructor: function (node, options) {
                // declare individual properties inside the constructor:
                // http://dojotoolkit.org/reference-guide/1.9/dojo/_base/declare.html#id6
                lang.mixin(this,
                    {
                        /**
                         * Node of the input checkbox originally supplied to the Checkbox.
                         *
                         * @property node
                         * @type JObject
                         * @default null
                         */
                        node: null,

                        /**
                         * Node of the input checkbox label.
                         *
                         * @property labelNode
                         * @type JObject
                         * @default null
                         * @private
                         */
                        labelNode: null,

                        /**
                         * Name of the 'data-*' attribute set on the checkbox node to be treated as the checkbox id.
                         *
                         * @property nodeIdAttr
                         * @type String
                         * @default 'id'
                         */
                        nodeIdAttr: 'id',

                        /**
                         * `active`, `focus`, and `check` CSS class to be applied to the Checkbox correspondingly.
                         *
                         * @property cssClass
                         * @type {Object}
                         * @default
                         * @example
                         *      cssClass: {
                         *          active: 'active',
                         *          focus: 'focused',
                         *          check: 'checked'
                         *      }
                         */
                        cssClass: {
                            active: 'active',
                            focus: 'focused',
                            check: 'checked'
                        },

                        /**
                         * `check` and `uncheck` label texts to be applied to the Checkbox labels.
                         *
                         * @property label
                         * @type {Object}
                         * @default
                         * @example
                         *      label: {
                         *          check: 'check',
                         *          uncheck: 'unchecked'
                         *      }
                         */
                        label: {
                            check: 'checked',
                            uncheck: 'unchecked'
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
                         * State of the Checkbox: true | false or INVALID
                         *
                         * @property state
                         * @type Boolean | String
                         * @default null
                         */
                        state: null,

                        /**
                         * Id of the Checkbox as specified by `nodeIdAttr`.
                         *
                         * @property id
                         * @type String
                         * @default null
                         */
                        id: null
                    },
                    options,
                    {
                        node: node
                    }
                );

                this._initListeners();

                this.id = this.node.data(this.nodeIdAttr) || this.node.attr(this.nodeIdAttr) || this.node.id;

                // TODO: refactor/fix; fintInputLabel doesn't work for checkbox bricks
                this.labelNode = this.node.findInputLabel();

                this._toggleLabel();
            },

            _initListeners: function () {
                var that = this;

                this.node
                    .on('change', function () {
                        that._toggleLabel();

                        that._emit(Checkbox.agency.USER);
                    })
                    .on('focus', function () {
                        that.node.findInputLabel().addClass(that.cssClass.focus);
                    })
                    .on('focusout', function () {
                        that.node.findInputLabel().removeClass(that.cssClass.focus);
                    });
            },

            /*
            * Adds the 'checked', 'focused' or 'active' CSS class to the label so it displays visually
            * matches the changed state.
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
                        this.labelNode.data('label-name'));

                    this.labelNode
                        .addClass(this.cssClass.check)
                        .prop('title', newText)
                        .find('> span').text(newText);
                } else {
                    newText = String.format(this.label.uncheck,
                        this.labelNode.data('label-name'));

                    this.labelNode
                        .removeClass(this.cssClass.check)
                        .prop('title', newText)
                        .find('> span').text(newText);
                }

                this.onChange.call(this);
            },

            /**
             * Emits a `TOGGLE` event when the checkbox's state is changed.
             *
             * @method _emit
             * @private
             * @param {String} agency Specified the agency that toggled the Checkbox.
             *
             */
            _emit: function (agency) {
                //console.log('Checkbox ->', this.id, 'set by', agency, 'to', this.state);

                this.emit(Checkbox.event.TOGGLE, {
                    agency: agency,
                    checkbox: this
                });
            },

            /**
            * Toggle the state of Checkbox.
            *
            * @method setState
            * @param {Boolean} state Specifies the state of the checkbox: true, false
            * @return {Checkbox} Control object for chaining
            * @chainable
            */
            setState: function (state) {
                this.validate();

                if (this.state !== Checkbox.state.INVALID) {
                    // change state only if it's different from the current one
                    if (this.state !== state) {
                        this.node.prop('checked', state);
                        this._toggleLabel();

                        this._emit(Checkbox.agency.CODE);
                    }
                }

                return this;
            },

            /**
            * Validates that the checkbox node is in fact in dom. If not, set checkbox's state to 'checkbox-invalid'
            * to prevent any interactions.
            *
            * @method validate
            * @return {Checkbox} Control object for chaining
            * @chainable
            */
            validate: function () {
                if (!this.node || !Util.containsInDom(this.node[0])) {
                    this.state = Checkbox.state.INVALID;
                } else if (this.state === Checkbox.state.INVALID) {
                    this.reset();
                }

                return this;
            },

            reset: function () {
                this.node.removeClass('tooltipstered')
                ;
                this._toggleLabel();
            }
        });

        lang.mixin(Checkbox,
            {
                state: {
                    INVALID: 'checkbox-invalid'
                },

                /**
                * An object specifying possible agencies that can affect the Checkbox.
                *
                * @property agency
                * @type Object
                * @private
                * @default
                * @example
                *      agency: {
                *           USER: 'USER',
                *           CODE: 'CODE'
                *       }
                */
                agency: {
                    USER: 'USER',
                    CODE: 'CODE'
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
                 *          TOGGLE: 'checkbox/toggle'
                 *      }
                 */
                event: {
                    /**
                    * Published whenever a Checkbox get toggled.
                    *
                    * @event TOGGLE
                    * @param event {Object}
                    * @param event.checkbox {Checkbox} Checkbox object that has been toggled
                    * @param event.agency {String} Agency that toggled the Checkbox
                    */
                    TOGGLE: 'checkbox/toggle'
                }
            }
        );

        return Checkbox;
    });
