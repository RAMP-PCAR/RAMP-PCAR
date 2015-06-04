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
* @class BricksChoiceBrick
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
            CheckboxBrick,
            CheckboxfsBrick,
            ToggleBrick,
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
        * To instantiate, call {{#crossLink "Brick/new:method"}}{{/crossLink}} on the Brick prototype.
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
             * A Brick header.
             *
             * @property header
             * @for Brick
             * @private
             * @type {String}
             * @default ""
             */

            /**
             * A CSS class of the Brick container node.
             *
             * @property containerClass
             * @private
             * @type {String}
             * @default ""
             */

            /**
             * Any other custom CSS class to be added to the Brick container node.
             *
             * @property customContainerClass
             * @private
             * @type {String}
             * @default ""
             */

            /**
             * A name of the specific Brick template.
             *
             * @property template
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
             * Specifies if the brick is enabled from creation. If false, the Brick is disabled after initialization.
             * 
             * @property isEnabled
             * @type {Boolean}
             * @default true
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
                /**
                * Published whenever a Brick undergoes some change.
                *
                * @event Bricks.Brick.event.CHANGE
                * @param data {Object} anything, usually result of calling getData() on the Brick
                */
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
             * Initializes the Brick by generating a specified template and setting defaults.
             * 
             * @method new
             * @param  {String} id     specified id of the Brick
             * @param  {Object} config a configuration object for the Brick
             * @param  {String} [config.header] a Brick header
             * @param  {String} [config.instructions] a configuration object for the Brick
             * @param  {Array|Object} [config.required] collection of rules specifying what external conditions must be valid for the Brick to be enabled
             * @param  {Boolean} [config.isEnabled] specifies if the brick is disabled from the start
             * @param  {Array} [config.freezeStates] a set of rules specifying states Brick should be frozen
             * @param  {String} [config.baseTemplate] a base template name to be used
             * @param  {String} [config.noticeTemplate] a notice template name to be used
             * @param  {String} [config.containerClass] a CSS class of the specific brick container
             * @param  {String} [config.customContainerClass] any other optional CSS class to be added to the brick container
             * @param  {String} [config.template] a name of the specific Brick template
             * @retun Brick
             * @chainable
             * 
             */
            initialize: function (id, config) {

                lang.mixin(this,
                    {
                        required: null,
                        isEnabled: true,
                        freezeStates: [],
                        baseTemplate: "default_base_template",
                        noticeTemplate: "default_brick_notice",
                        guid: UtilMisc.guid()
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

                // disable the brick if Computer demands it
                if (this.isEnabled === false) {
                    this.disable(true);
                }
            },

            /**
             * Notifies a listener of a Brick event. 
             *
             * @method notify
             * @private
             * @param  {String} eventName an eventName that should be reported
             * @param  {Object} data      a payload object to be passed along with the @event
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
             * Sets a listener on the Brick for a specified eventName.
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
                this.freeze(this.freezeStates.indexOf(state) !== -1);

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
             * Disables or re-enables the Brick.
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
                            // make the buttons appear and act as if they are disabled but still able to receive focus
                            // it's needed so keyboard focus wouldn't fly away to the beginning of the page if the button is suddenly disabled
                            .find("button")
                            .addClass("disabled")
                            .attr("aria-disabled", true)
                            .end()
                            .find("input, select")
                            .attr("disabled", true);
                    } else {
                        this.node
                            .find("button")
                            .removeClass("disabled")
                            .attr("aria-disabled", false)
                            .end()
                            .find("input, select")
                            .attr("disabled", false);
                    }
                }

                return this;
            }
        });

        /**
        * The MultiBrick prototype. Used as a container for multiple independent Bricks if they are required to be displayed side by side.
        * To instantiate, call {{#crossLink "MultiBrick/new:method"}}{{/crossLink}} on the MultiBrick prototype.
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
        * @extends Brick
        * 
        */
        MultiBrick = Brick.extend({
            /**
             * A CSS class of the MultiBrick container node.
             *
             * @property containerClass
             * @for MultiBrick
             * @private
             * @type {String}
             * @default "multi-brick-container"
             */

            /**
             * A name of the default MultiBrick template.
             *
             * @property template
             * @private
             * @type {String}
             * @default "default_multi_brick_template"
             */

            /**
            * A collection of Brick objects to be displayed side by side in the MultiBrick.
            *
            * @property content
            * @private
            * @type {Array}
            * @default []
            */

            /**
             * A MultiBrick container node.
             *
             * @property multiContainer
             * @private
             * @type {Object}
             */

            /**
             * A dictionary of the initialized content Brick objects for easy lookup. 
             *
             * @property contentBricks
             * @private
             * @type {Object}
             */

            /**
             * Initializes the MutliBrick by generating a specified template and setting defaults.
             * 
             * @method new
             * @param  {String} id     specified id of the MultiBrick
             * @param  {Object} config a configuration object for the MultiBrick
             * @param  {String} [config.content] a collection of bricks to be displayed in the MultiBrick
             * @param  {String} [config.header] a Brick header
             * @param  {String} [config.instructions] a configuration object for the Brick
             * @param  {Array|Object} [config.required] collection of rules specifying what external conditions must be valid for the Brick to be enabled
             * @param  {Boolean} [config.isEnabled] specifies if the brick is disabled from the start
             * @param  {Array} [config.freezeStates] a set of rules specifying states Brick should be frozen
             * @param  {String} [config.baseTemplate] a base template name to be used
             * @param  {String} [config.noticeTemplate] a notice template name to be used
             * @param  {String} [config.containerClass] a CSS class of the specific brick container
             * @param  {String} [config.customContainerClass] any other optional CSS class to be added to the brick container
             * @param  {String} [config.template] a name of the specific Brick template
             * @retun MultiBrick
             * @chainable
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

                // loop through the content and create Bricks and append them to the MultiBrick container
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

            /**
             * Sets the state of the MultiBrick by setting states of the individual bricks inside the MultiBrick using their specific setState methods.
             *
             * @method setState
             * @param {String} state a name of the state to set 
             * @return {MultiBrick}           itself
             * @chainable
             */
            setState: function (state) {
                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    brick.setState(state);
                });

                return this;
            },

            /**
             * Clears the MultiBrick by clearing of the individual bricks inside the MultiBrick using their specific clear methods.
             *
             * @method clear
             * @return {MultiBrick}           itself
             * @chainable
             */
            clear: function () {
                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    brick.clear();
                });

                return this;
            },

            /**
             * Checks if the MultiBrick is valid. It's valid only if all individual bricks inside it are valid.
             *
             * @method isValid
             * @return {Boolean}           true if valid; false if not
             */
            isValid: function () {
                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    if (!brick.isValid()) {
                        return false;
                    }
                });

                return true;
            },

            /**
             * Sets MultiBrick's data by setting data to the individual bricks inside it. Uses their own specific setData functions.
             *              *
             * @method setData
             * @param {Object} data
             * @return {MultiBrick}           itself
             * @chainable
             */
            setData: function (data) {
                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    brick.setData(data);
                });

                return this;
            },

            /**
             * Returns MultiBrick's data by mixing together data of the individual bricks inside using their specific getData methods and then passing it to the Brick's getData method for potential wrapping.
             *
             * @method getData
             * @for MultiBrick
             * @param  {Boolean} [wrap]    indicates of the payload should be wrapped with a Brick's id; useful when collection information from several Bricks at once. 
             * @return {Object}         MultiBrick's data
             */
            getData: function (wrap) {
                var payload = {};

                UtilDict.forEachEntry(this.contentBricks, function (key, brick) {
                    lang.mixin(payload, brick.getData(true));
                });

                return Brick.getData.call(this, payload, wrap);
            }
        });

        /**
        * ButtonBrick is just a Brick with a button inside it. The button can be styled and can be assigned an onClick event. 
        * To instantiate, call {{#crossLink "ButtonBrick/new:method"}}{{/crossLink}} on the ButtonBrick prototype.
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
        * @class ButtonBrick
        * @for Bricks
        * @static
        * @uses dojo/_base/lang
        * @extends Brick
        * 
        */
        ButtonBrick = Brick.extend({

            /**
             * A dictionary of possible ButtonBrick events. Add a CLICK event to the default Brick events.
             *
             * @property event
             * @for ButtonBrick
             * @type {Object}
             * @example
             *      event: {
             *          CHANGE: "brick/change",
             *          CLICK: "buttonBrick/click"
             *      }
             * 
             */
            event: lang.mixin({}, Brick.event,
                {
                    /**
                    * Published whenever a ButtonBrick is clicked.
                    *
                    * @event Bricks.ButtonBrick.event.CLICK
                    * @param data {Object} anything, usually result of calling getData() on the Brick
                    */
                    CLICK: "buttonBrick/click"
                }
            ),

            /**
             * A CSS class of the MultiBrick container node.
             *
             * @property containerClass
             * @private
             * @type {String}
             * @default "button-brick-container"
             */

            /**
             * A name of the default ButtonBrick template.
             *
             * @property template
             * @private
             * @type {String}
             * @default "default_button_brick_template"
             */

            /**
             * A CSS class of the button.
             *
             * @property buttonClass
             * @private
             * @type {String}
             * @default "btn-primary"
             */

            /**
             * A button label.
             *
             * @property label
             * @private
             * @type {String}
             * @default "Ok"
             */

            /**
             * Initializes the ButtonBrick by generating a specified template and setting defaults. Also sets a click listener on the template button.
             * ButtonBrick is a simple button in the Brick container.
             * 
             * @method new
             * @param  {String} id     specified id of the Brick
             * @param  {Object} config a configuration object for the Brick
             * @param  {String} [config.header] a Brick header
             * @param  {String} [config.instructions] a configuration object for the Brick
             * @param  {Array|Object} [config.required] collection of rules specifying what external conditions must be valid for the Brick to be enabled
             * @param  {Boolean} [config.isEnabled] specifies if the brick is disabled from the start
             * @param  {Array} [config.freezeStates] a set of rules specifying states Brick should be frozen
             * @param  {String} [config.baseTemplate] a base template name to be used
             * @param  {String} [config.noticeTemplate] a notice template name to be used
             * @param  {String} [config.customContainerClass] any other optional CSS class to be added to the brick container
             * @param  {String} [config.containerClass] a CSS class of the specific brick container
             * @param  {String} [config.template] a name of the specific Brick template
             * @param  {String} [config.buttonClass] a CSS class of the button in the ButtonBrick
             * @param  {String} [config.label] a button label
             * @chainable
             * @return {ButtonBrick}
             */
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

                this.node.on("click", "button:not(.disabled)", function () {
                    that.notify(that.event.CLICK, null);
                });
            },

            /**
             * Returns true. ButtonBrick is always valid
             *
             * @method isValid
             * @return {Boolean}           true
             */
            isValid: function () {
                return true;
            },

            /**
             * Returns ButtonBrick's data. Pretty useless function when you think of it. Just returns the data of the Brick prototype which is empty.
             *
             * @method getData
             * @for ButtonBrick
             * @param  {Boolean} [wrap]    indicates of the payload should be wrapped with a Brick's id; useful when collection information from several Bricks at once. 
             * @return {Object}         ButtonBrick's data
             */
            getData: function (wrap) {
                var payload = {};

                return Brick.getData.call(this, payload, wrap);
            }
        });

        // TODO: create another checkboxBrick that uses Formstone Checkbox but regular one, not toggle.
        /**
        * CheckboxBrick is just a Brick with a checkbox inside it. The checkbox can be styled through its checkbox-container. 
        * To instantiate, call {{#crossLink "CheckboxBrick/new:method"}}{{/crossLink}} on the CheckboxBrick prototype.
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
        * @class CheckboxBrick
        * @for Bricks
        * @static
        * @uses dojo/_base/lang
        * @extends Brick
        * 
        */
        CheckboxBrick = Brick.extend({

            /**
             * A CSS class of the CheckboxBrick container node.
             *
             * @property containerClass
             * @private
             * @type {String}
             * @default "checkbox-brick-container"
             */

            /**
             * A name of the default CheckboxBrick template.
             *
             * @property template
             * @private
             * @type {String}
             * @default "default_checkbox_brick_template"
             */

            /**
             * A checkbox value.
             *
             * @property value
             * @private
             * @type {String}
             * @default "on"
             */

            /**
             * A checkbox label.
             *
             * @property label
             * @private
             * @type {String}
             * @default "Ok"
             */

            /**
            * A checkbox on label.
            *
            * @property onLabel
            * @private
            * @type {String}
            * @default "on"
            */

            /**
            * A checkbox off label.
            *
            * @property offLabel
            * @private
            * @type {String}
            * @default "off"
            */

            /**
             * Initializes the CheckboxBrick by generating a specified template and setting defaults. Also sets a click listener on the template input checkbox.
             * CheckboxBrick is a simple button in the Brick container.
             * 
             * If the `header` is provided, the Brick display it as a header element while hiding checkbox label and displaying on/off labels beside the checkbox depending on the state.
             * If the `header` is no provided, Brick's label is displayed beside the checkbox.
             * 
             * Provide header if the checkbox is a standalone feature or you have lots of space; omit header if the checkbox is a part of a group of checkboxes or you want to conserve space. 
             * 
             * @method new
             * @param  {String} id     specified id of the Brick
             * @param  {Object} config a configuration object for the Brick
             * @param  {String} [config.header] a Brick header
             * @param  {String} [config.instructions] a configuration object for the Brick
             * @param  {Array|Object} [config.required] collection of rules specifying what external conditions must be valid for the Brick to be enabled
             * @param  {Boolean} [config.isEnabled] specifies if the brick is disabled from the start
             * @param  {Array} [config.freezeStates] a set of rules specifying states Brick should be frozen
             * @param  {String} [config.baseTemplate] a base template name to be used
             * @param  {String} [config.noticeTemplate] a notice template name to be used
             * @param  {String} [config.containerClass] a CSS class of the specific brick container
             * @param  {String} [config.customContainerClass] any other optional CSS class to be added to the brick container
             * @param  {String} [config.template] a name of the specific Brick template
             * @param  {String} [config.value] a checkbox value
             * @param  {String} [config.label] a checkbox label
             * @param  {String} [config.onLabel] a checkbox on label
             * @param  {String} [config.offLabel] a checkbox off label
             * @chainable
             * @return {CheckboxBrick}
             */
            initialize: function (id, config) {
                var that = this;

                lang.mixin(this,
                    {
                        template: "default_checkbox_brick_template",
                        containerClass: "checkbox-brick-container",
                        label: config.header,
                        checked: false,
                        onLabel: 'on',
                        offLabel: 'off',
                        value: 'on'
                    }
                );

                Brick.initialize.call(this, id, config);

                lang.mixin(this,
                    {
                        userChecked: false,
                        inputNode: this.node.find("input[type='checkbox']#" + this.guid)
                    }
                );

                this.inputNode.on("change", function () {
                    var value = that.inputNode.is(':checked');
                    that.setChecked(value, true);
                });
            },

            /**
             * Returns true. CheckboxBrick is always valid
             *
             * @method isValid
             * @return {Boolean}           true
             */
            isValid: function () {
                return true;
            },

            /**
             * Check or uncheck the checkbox.
             * 
             * @method setChecked
             * @param {Boolean} value    true - checked; or false - unchecked
             * @param {Boolean} userChecked boolean value indicating if the user is the source of the value
             * @return {CheckboxBrick}           itself
             * @chainable
             */
            setChecked: function (value, userChecked) {
                this.userChecked = userChecked ? true : false;
                this.checked = value;

                // if user checked it, the checkbox is already changed;
                // if not, need to set property
                if (!userChecked) {
                    this.inputNode.prop('checked', this.checked ? 'checked' : '');
                }

                this.node.toggleClass('checkbox-checked', this.checked);

                // fire change event
                this.notify(this.event.CHANGE, this.getData());

                return this;
            },

            /**
             * Clears the Brick by unchecking it.
             *
             * @method clear
             * @return {CheckboxBrick}           itself
             * @chainable
             */
            clear: function () {
                this.setChecked(false, false);

                Brick.clear.call(this);

                return this;
            },

            /**
             * Checks if the checkbox was checked by the user or not.
             * 
             * @method isUserEntered
             * @return {Boolean} true if the user checked the checkbox; false, otherwise
             */
            isUserEntered: function () {
                return this.userChecked;
            },

            /**
             * Sets CheckboxBrick's data. First calls setChecked and calls set data on the Brick prototype.
             *
             * @method setData
             * @param {Object} data a wrapper object for the data to be set.  
             * @return {CheckboxBrick}           itself
             * @chainable
             */
            setData: function (data) {
                this.setChecked(data.inputValue, data.userChecked);

                Brick.setData.call(data);

                return this;
            },

            /**
             * Returns CheckboxBrick's data. Returns whether it's checked or unchecked.
             *
             * @method getData
             * @for CheckboxBrick
             * @param  {Boolean} [wrap]    indicates of the payload should be wrapped with a Brick's id; useful when collection information from several Bricks at once. 
             * @return {Object}         CheckboxBrick's data
             */
            getData: function (wrap) {
                var payload = {
                    checked: this.checked
                };

                return Brick.getData.call(this, payload, wrap);
            }
        });

        /**
        * CheckboxfsBrick is just a Brick with a checkbox inside it that is styles as a Formstone Checkbox. The CheckboxFS can be further styled through its checkbox-container. 
        * To instantiate, call {{#crossLink "CheckboxfsBrick/new:method"}}{{/crossLink}} on the CheckboxfsBrick prototype.
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
        * @class CheckboxfsBrick
        * @for Bricks
        * @static
        * @uses dojo/_base/lang
        * @extends CheckboxBrick
        * 
        */
        CheckboxfsBrick = CheckboxBrick.extend({

            /**
             * A container CSS class of the Brick.
             *
             * @property containerClass
             * @private
             * @type {String}
             * @default "checkbox-brick-container formstone-checkbox"
             */

            /**
             * Initializes the CheckboxfsBrick by generating a specified template and setting defaults. Also sets a change listener on the template input checkbox.
             * CheckboxfsBrick is a simple checkbox styles with a Formstone lib in the Brick container.
             * 
             * @method new
             * @param  {String} id     specified id of the Brick
             * @param  {Object} config a configuration object for the Brick
             * @param  {String} [config.header] a Brick header
             * @param  {String} [config.instructions] a configuration object for the Brick
             * @param  {Array|Object} [config.required] collection of rules specifying what external conditions must be valid for the Brick to be enabled
             * @param  {Boolean} [config.isEnabled] specifies if the brick is disabled from the start
             * @param  {Array} [config.freezeStates] a set of rules specifying states Brick should be frozen
             * @param  {String} [config.baseTemplate] a base template name to be used
             * @param  {String} [config.noticeTemplate] a notice template name to be used
             * @param  {String} [config.containerClass] a CSS class of the specific brick container
             * @param  {String} [config.customContainerClass] any other optional CSS class to be added to the brick container
             * @param  {String} [config.template] a name of the specific Brick template
             * @param  {String} [config.value] a checkbox value
             * @param  {String} [config.label] a checkbox label
             * @param  {String} [config.onLabel] a checkbox on label
             * @param  {String} [config.offLabel] a checkbox off label
             * @chainable
             * @return {CheckboxfsBrick}
             */
            initialize: function (id, config) {
                //var that = this;
                var newConfig = {};

                lang.mixin(newConfig,
                    {
                        containerClass: "checkbox-brick-container formstone-brick"
                    },
                    config
                );

                CheckboxBrick.initialize.call(this, id, newConfig);

                // CheckboxfsBrick uses Formstone checkbox component to create CheckboxFSs.
                this.inputNode.checkbox();

                // move the on/off labels out of the CheckboxFS if there is a brick header
                /*if (this.header) {
                    this.node
                        .find('.fs-checkbox.fs-checkbox-CheckboxFS')
                        .prepend(
                            this.node.find('.fs-checkbox-state')
                        )
                    ;
                }*/
            }
        });

        /**
        * ToggleBrick is just a Brick with a checkbox inside it that is styles as a toggle. The toggle can be further styled through its checkbox-container. 
        * To instantiate, call {{#crossLink "ToggleBrick/new:method"}}{{/crossLink}} on the ToggleBrick prototype.
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
        * @class ToggleBrick
        * @for Bricks
        * @static
        * @uses dojo/_base/lang
        * @extends CheckboxBrick
        * 
        */
        ToggleBrick = CheckboxBrick.extend({

            /**
             * A CSS class of the ToggleBrick container node.
             *
             * @property containerClass
             * @private
             * @type {String}
             * @default "toggle-brick-container"
             */

            /**
             * A name of the default ToggleBrick template.
             *
             * @property template
             * @private
             * @type {String}
             * @default "default_toggle_brick_template"
             */

            /**
             * A toggle value.
             *
             * @property value
             * @private
             * @type {String}
             * @default "on"
             */

            /**
             * A toggle label.
             *
             * @property label
             * @private
             * @type {String}
             * @default "Ok"
             */

            /**
             * Initializes the ToggleBrick by generating a specified template and setting defaults. Also sets a change listener on the template input checkbox.
             * ToggleBrick is a simple toggle in the Brick container.
             * 
             * @method new
             * @param  {String} id     specified id of the Brick
             * @param  {Object} config a configuration object for the Brick
             * @param  {String} [config.header] a Brick header
             * @param  {String} [config.instructions] a configuration object for the Brick
             * @param  {Array|Object} [config.required] collection of rules specifying what external conditions must be valid for the Brick to be enabled
             * @param  {Boolean} [config.isEnabled] specifies if the brick is disabled from the start
             * @param  {Array} [config.freezeStates] a set of rules specifying states Brick should be frozen
             * @param  {String} [config.baseTemplate] a base template name to be used
             * @param  {String} [config.noticeTemplate] a notice template name to be used
             * @param  {String} [config.containerClass] a CSS class of the specific brick container
             * @param  {String} [config.customContainerClass] any other optional CSS class to be added to the brick container
             * @param  {String} [config.template] a name of the specific Brick template
             * @param  {String} [config.value] a checkbox value
             * @param  {String} [config.label] a checkbox label
             * @param  {String} [config.onLabel] a checkbox on label
             * @param  {String} [config.offLabel] a checkbox off label
             * * @chainable
             * @return {ToggleBrick}
             */
            initialize: function (id, config) {
                //var that = this;
                var newConfig = {};

                lang.mixin(newConfig,
                    {
                        template: "default_toggle_brick_template",
                        containerClass: "toggle-brick-container"
                    },
                    config
                );

                CheckboxBrick.initialize.call(this, id, newConfig);

                // ToggleBrick uses Formstone checkbox component to create toggles.
                this.inputNode.checkbox({
                    toggle: true,
                    labels: {
                        on: this.onLabel,
                        off: this.offLabel
                    }
                });

                // move the on/off labels out of the toggle if there is a brick header
                if (this.header) {
                    this.node
                        .find('.fs-checkbox.fs-checkbox-toggle')
                        .prepend(
                            this.node.find('.fs-checkbox-state')
                        )
                    ;
                }
            }
        });

        /**
        * The OkCancelButtonBrick prototype. A MultiBrick with two ButtonBricks displayed side by side and styled as OK and Cancel buttons.
        * To instantiate, call {{#crossLink "OkCancelButtonBrick/new:method"}}{{/crossLink}} on the OkCancelButtonBrick prototype.
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
        * @class OkCancelButtonBrick
        * @for Bricks
        * @static
        * @uses dojo/_base/lang
        * @extends MultiBrick
        */
        OkCancelButtonBrick = MultiBrick.extend({

            /**
             * A dictionary of possible OkCancelButtonBrick events. Adds a OK_CLICK and CANCEL_CLICK events to the default ButtonBrick events.
             *
             * @property event
             * @for OkCancelButtonBrick
             * @type {Object}
             * @example
             *      event: {
             *          CHANGE: "brick/change",
             *          CLICK: "buttonBrick/click",
             *          OK_CLICK: "okCancelButtonBrick/okClick",
             *          CANCEL_CLICK: "okCancelButtonBrick/cancelClick"
             *      }
             * 
             */
            event: lang.mixin({},
                MultiBrick.event,
                ButtonBrick.event,
                {
                    /**
                    * Published whenever an OK button of the OkCancelButtonBrick is clicked.
                    *
                    * @event Bricks.OkCancelButtonBrick.event.OK_CLICK
                    * @param data {Object} anything, usually result of calling getData() on the Brick
                    */
                    OK_CLICK: "okCancelButtonBrick/okClick",
                    /**
                    * Published whenever an Cancel button of the OkCancelButtonBrick is clicked
                    *
                    * @event Bricks.OkCancelButtonBrick.event.CANCEL_CLICK
                    * @param data {Object} anything, usually result of calling getData() on the Brick
                    */
                    CANCEL_CLICK: "okCancelButtonBrick/cancelClick"
                }
            ),

            /**
             * A CSS class of the OkCancelButtonBrick container node.
             *
             * @property containerClass
             * @private
             * @type {String}
             * @default "okcancelbutton-brick-container"
             */

            /**
             * Default id of the OK button of the Brick, cannot be changed.
             *
             * @property okButtonId
             * @private
             * @type {String}
             * @default "okButton"
             */

            /**
             * Default id of the cancel button of the Brick, cannot be changed.
             *
             * @property cancelButtonId
             * @private
             * @type {String}
             * @default "cancelButton"
             */

            /**
             * Default id of the cancel button of the Brick, cannot be changed.
             *
             * @property cancelButtonId
             * @private
             * @type {String}
             * @default "cancelButton"
             */

            /**
             * Reverses the default visual order of OK, Cancel button to Cancel, OK.
             *
             * @property reverseOrder
             * @private
             * @type {Boolean}
             * @default "false"
             */

            okButtonId: "okButton",
            cancelButtonId: "cancelButton",

            /**
             * Initializes the OkCancelButtonBrick by generating a specified template and setting defaults. Also sets a click listener on the template button.
             * OkCancelButtonBrick is a brick with two preset buttons: OK and Cancel.
             * Button container classes are predefined as "ok-button-brick-container" and "cancel-button-brick-container"
             * 
             * @method new
             * @for OkCancelButtonBrick
             * @param  {String} id     specified id of the Brick
             * @param  {Object} config a configuration object for the Brick
             * @param  {String} [config.header] a Brick header
             * @param  {String} [config.instructions] a configuration object for the Brick
             * @param  {Array|Object} [config.required] collection of rules specifying what external conditions must be valid for the Brick to be enabled
             * @param  {Boolean} [config.isEnabled] specifies if the brick is disabled from the start
             * @param  {Array} [config.freezeStates] a set of rules specifying states Brick should be frozen
             * @param  {String} [config.baseTemplate] a base template name to be used
             * @param  {String} [config.noticeTemplate] a notice template name to be used
             * @param  {String} [config.containerClass] a CSS class of the specific brick container
             * @param  {String} [config.customContainerClass] any other optional CSS class to be added to the brick container
             * @param  {String} [config.template] a name of the specific Brick template
             * @param  {String} [config.buttonClass] a CSS class of the button in the OkCancelButtonBrick
             * @param  {String} [config.okLabel] an OK button label
             * @param  {String} [config.cancelLabel] a Cancel button label
             * @param  {String} [config.okButtonClass] an OK button CSS class
             * @param  {String} [config.cancelButtonClass] a Cancel button CSS class
             * @param  {String} [config.okFreezeStates] an OK button freeze states
             * @param  {String} [config.cancelFreezeStates] a Cancel button freeze states
             * @param  {String} [config.reverseOrder] reverses the default visual order of OK, Cancel button to Cancel, OK.
             * @chainable
             * @return {OkCancelButtonBrick}
             */
            initialize: function (id, config) {
                var that = this,
                    newConfig;

                // generating a MultiBrick config with two buttons
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

                // setting event listeners on individual ButtonBricks, not button nodes directly
                this.okButtonBrick.on(this.event.CLICK, function () {
                    that.notify(that.event.OK_CLICK, null);
                    that.notify(that.event.CLICK, null);
                });

                this.cancelButtonBrick.on(this.event.CLICK, function () {
                    that.notify(that.event.CANCEL_CLICK, null);
                    that.notify(that.event.CLICK, null);
                });
            }
        });

        /**
        * The ChoiceBrick prototype. Provides a user the ability to choose a single item among several.
        * To instantiate, call {{#crossLink "ChoiceBrick/new:method"}}{{/crossLink}} on the ChoiceBrick prototype.
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
        * @class ChoiceBrick
        * @for Bricks
        * @static
        * @uses dojo/_base/lang
        * @extends Brick
        */
        ChoiceBrick = Brick.extend({

            /**
             * A CSS class of the MultiBrick container node.
             *
             * @property containerClass
             * @private
             * @for ChoiceBrick
             * @type {String}
             * @default "choice-brick-container"
             */

            /**
             * A name of the default ButtonBrick template.
             *
             * @property template
             * @private
             * @type {String}
             * @default "default_choice_brick_template"
             */

            /**
             * Indicates which choice is currently selected
             *
             * @property selectedChoice
             * @private
             * @type {String}
             * @default null
             */

            /**
             * Indicates if the user made the selection or it was made programmatically
             *
             * @property userSelected
             * @private
             * @type {Boolean}
             * @default false
             */

            /**
             * A collection of choices that will be offered to the user. At least two choices are required for this Brick to have any use at all.
             *
             * @property choices
             * @private
             * @type {Array}
             * @example
             *     [
             *         {
             *             key: "ie9",
             *             value: "IE9"
             *         },
             *         {
             *             key: "chrome",
             *             value: "Chrome"
             *         }
             *     ]
             */

            /**
             * Preselects the specified option among available choices.
             *
             * @property preselect
             * @private
             * @type {String}
             * @default ''
             */

            /**
             * Initializes the ChoiceBrick by generating a specified template and setting defaults. Also sets a click listener on the template button.
             * The ChoiceBrick prototype. Provides a user the ability to choose a single item among several.
             * 
             * @method new
             * @param  {String} id     specified id of the Brick
             * @param  {Object} config a configuration object for the Brick
             * @param  {String} [config.header] a Brick header
             * @param  {String} [config.instructions] a configuration object for the Brick
             * @param  {Array|Object} [config.required] collection of rules specifying what external conditions must be valid for the Brick to be enabled
             * @param  {Boolean} [config.isEnabled] specifies if the brick is disabled from the start
             * @param  {Array} [config.freezeStates] a set of rules specifying states Brick should be frozen
             * @param  {String} [config.baseTemplate] a base template name to be used
             * @param  {String} [config.noticeTemplate] a notice template name to be used
             * @param  {String} [config.containerClass] a CSS class of the specific brick container
             * @param  {String} [config.customContainerClass] any other optional CSS class to be added to the brick container
             * @param  {String} [config.template] a name of the specific Brick template
             * @param  {Array} [config.choices] a set of choices that will be presented to the user
             * @param  {String} [config.preselect] a name of an option to preselect
             * @chainable
             * @return {ChoiceBrick}
             */
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

                if (this.preselect) {
                    this.setChoice(this.preselect, false);
                }
            },

            /**
             * Sets the choice of the ChoiceBrick.
             * 
             * @method setChoice
             * @param {String} choiceKey    string value of the choice to be selected
             * @param {Boolean} userSelected boolean value indicating if the user is the source of the selection
             * @return {ChoiceBrick}           itself
             * @chainable
             */
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

                return this;
            },

            /**
             * Checks if the option was selected by the user or not.
             * 
             * @method isUserSelected
             * @return {Boolean} true if the option was selected by the user; false, otherwise
             * @return {ChoiceBrick}           itself
             * @chainable
             */
            isUserSelected: function () {
                return this.userSelected;
            },

            /**
             * Clears the ChoiceBrick by reseting selectedChoice to an empty string and userSelected to false.
             *
             * @method clear
             * @return {ChoiceBrick}           itself
             * @chainable
             */
            clear: function () {
                this.setChoice("", false);

                Brick.clear.call(this);

                return this;
            },

            /**
             * Checks if the brick is valid. The ChoiceBrick is considered valid if selectedChoice is not an empty String.
             *
             * @method isValid
             * @return {Boolean}           true if valid; false if not
             */
            isValid: function () {
                return this.selectedChoice !== "";
            },

            /**
             * Sets ChoiceBrick's data. First calls setChoice and calls set data on the Brick prototype.
             *
             * @method setData
             * @param {Object} data a wrapper object for the data to be set.  
             * @return {ChoiceBrick}           itself
             * @chainable
             */
            setData: function (data) {
                this.setChoice(data.selectedChoice, data.userSelected);

                Brick.setData.call(data);

                return this;
            },

            /**
             * Returns ChoiceBrick's data.
             * 
             * @method getData
             * @for ChoiceBrick
             * @param  {Boolean} [wrap]    indicates of the payload should be wrapped with a Brick's id; useful when collection information from several Bricks at once. 
             * @return {Object}  A wrapper object around two properties: selectedChoice and userSelected
             */
            getData: function (wrap) {
                var payload = {
                    selectedChoice: this.selectedChoice,
                    userSelected: this.userSelected
                };

                return Brick.getData.call(this, payload, wrap);
            }
        });

        /**
        * The SimpleInputBrick prototype. Provides a control for a simple text input. Can be potentially extended to serve more specific purposes.
        * To instantiate, call {{#crossLink "SimpleInputBrick/new:method"}}{{/crossLink}} on the SimpleInputBrick prototype.
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
        * @class SimpleInputBrick
        * @for Bricks
        * @static
        * @uses dojo/_base/lang
        * @extends Brick
        */
        SimpleInputBrick = Brick.extend({
            /**
             * A CSS class of the SimpleInputBrick container node.
             *
             * @property containerClass
             * @private
             * @for SimpleInputBrick
             * @type {String}
             * @default "simpleinput-brick-container"
             */

            /**
             * A name of the default SimpleInputBrick template.
             *
             * @property template
             * @private
             * @type {String}
             * @default "default_simpleinput_brick_template"
             */

            /**
            * An input field label. Invisible. Defaults to the Brick's header.
            *
            * @property label
            * @private
            * @type {String}
            * @default ""
            */

            /**
             * A placeholder to be displayed inside the input field.
             *
             * @property placeholder
             * @private
             * @type {String}
             * @default ""
             */

            /**
             * A string that is currently entered in the input field
             *
             * @property inputValue
             * @private
             * @type {String}
             * @default ""
             */

            /**
             * Indicates if the user entered text into the input field or it was entered programmatically
             *
             * @property userEntered
             * @private
             * @type {Boolean}
             * @default false
             */

            /**
             * Initializes the SimpleInputBrick by generating a specified template and setting defaults.
             * This Brick fires a CHANGE event on every change inside the input field.
             * 
             * @method new
             * @param  {String} id     specified id of the Brick
             * @param  {Object} config a configuration object for the Brick
             * @param  {String} [config.header] a Brick header
             * @param  {String} [config.instructions] a configuration object for the Brick
             * @param  {Array|Object} [config.required] collection of rules specifying what external conditions must be valid for the Brick to be enabled
             * @param  {Boolean} [config.isEnabled] specifies if the brick is disabled from the start
             * @param  {Array} [config.freezeStates] a set of rules specifying states Brick should be frozen
             * @param  {String} [config.baseTemplate] a base template name to be used
             * @param  {String} [config.noticeTemplate] a notice template name to be used
             * @param  {String} [config.containerClass] a CSS class of the specific brick container
             * @param  {String} [config.customContainerClass] any other optional CSS class to be added to the brick container
             * @param  {String} [config.template] a name of the specific Brick template
             * @param  {String} [config.label] an input field label. Invisible. Defaults to the Brick's header
             * @param  {String} [config.placeholder] a placeholder to be displayed inside the input field
             * @retun SimpleInputBrick
             * @chainable
             * 
             */
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

                // setting a listener on the input field
                this.inputNode.on("input", function (event) {
                    var value = $(event.target).val();
                    that.setInputValue(value, true);
                });
            },

            /**
             * Sets the current value of the input field.
             * 
             * @method setInputValue
             * @param {String} value    string value to be entered into the input field
             * @param {Boolean} userEntered boolean value indicating if the user is the source of the string value
             * @return {SimpleInputBrick}           itself
             * @chainable
             */
            setInputValue: function (value, userEntered) {
                this.userEntered = userEntered ? true : false;
                this.inputValue = value;

                // if user entered it, the text is already in the field;
                // if not, need to populate the field
                if (!userEntered) {
                    this.inputNode.val(value);
                }

                // fire change event
                this.notify(this.event.CHANGE, this.getData());

                return this;
            },

            /**
             * Checks if the input value was entered by the user or not.
             * 
             * @method isUserEntered
             * @return {Boolean} true if the input value was entered by the user; false, otherwise
             */
            isUserEntered: function () {
                return this.userEntered;
            },

            /**
             * Sets the state of the Brick. Depending on the state, update the visual styles of the input field.
             * Then call the Brick prototype setState function.
             * 
             * @method setState
             * @param {String} state a name of the state to set 
             * @return {SimpleInputBrick}           itself
             * @chainable
             */
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

            /**
             * Clears the Brick by setting inputValue to "" and userEntered to false.
             *
             * @method clear
             * @return {SimpleInputBrick}           itself
             * @chainable
             */
            clear: function () {
                this.setInputValue("", false);

                Brick.clear.call(this);

                return this;
            },

            /**
             * Checks if the SimpleInputBrick is valid. It's considered valid if the input value is not an empty String.
             *
             * @method isValid
             * @return {Boolean}           true if valid; false if not
             */
            isValid: function () {
                return this.inputValue !== "";
            },

            /**
             * Sets SimpleInputBrick's data. First calls setInputValue and calls set data on the Brick prototype.
             *
             * @method setData
             * @param {Object} data a wrapper object for the data to be set.  
             * @return {SimpleInputBrick}           itself
             * @chainable
             */
            setData: function (data) {
                this.setInputValue(data.inputValue, data.userEntered);

                Brick.setData.call(data);

                return this;
            },

            /**
             * Returns SimpleInputBrick's data.
             * 
             * @method getData
             * @for SimpleInputBrick
             * @param  {Boolean} [wrap]    indicates of the payload should be wrapped with a Brick's id; useful when collection information from several Bricks at once. 
             * @return {Object}  A wrapper object around two properties: inputValue and userEntered
             */
            getData: function (wrap) {
                var payload = {
                    inputValue: this.inputValue,
                    userEntered: this.userEntered
                };

                return Brick.getData.call(this, payload, wrap);
            }
        });

        /**
        * The DropDownBrick prototype. Provides a dropdown control to choose an item from.
        * To instantiate, call {{#crossLink "DropDownBrick/new:method"}}{{/crossLink}} on the DropDownBrick prototype.
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
        * @class DropDownBrick
        * @for Bricks
        * @static
        * @uses dojo/_base/lang
        * @extends Brick
        */
        DropDownBrick = Brick.extend({
            /**
             * A CSS class of the DropDownBrick container node.
             *
             * @property containerClass
             * @private
             * @for DropDownBrick
             * @type {String}
             * @default "dropdown-brick-container"
             */

            /**
             * A name of the default DropDownBrick template.
             *
             * @property template
             * @private
             * @type {String}
             * @default "default_dropdown_brick_template"
             */

            /**
             * An input field label. Invisible. Defaults to the Brick's header.
             *
             * @property label
             * @private
             * @type {String}
             * @default ""
             */

            /**
             * A value of the currently selected item in the dropdown.
             *
             * @property dropDownValue
             * @private
             * @type {String}
             * @default ""
             */

            /**
             * A text string of the currently selected item in the dropdown.
             *
             * @property dropDownText
             * @private
             * @type {String}
             * @default ""
             */

            /**
             * Indicates if the user selected the option in the dropdown or it was selected programmatically.
             *
             * @property userSelected
             * @private
             * @type {Boolean}
             * @default false
             */

            /**
             * Initializes the DropDownBrick by generating a specified template and setting defaults.
             * This Brick fires a CHANGE event on every change inside the dropdown.
             * 
             * @method new
             * @param  {String} id     specified id of the Brick
             * @param  {Object} config a configuration object for the Brick
             * @param  {String} [config.header] a Brick header
             * @param  {String} [config.instructions] a configuration object for the Brick
             * @param  {Array|Object} [config.required] collection of rules specifying what external conditions must be valid for the Brick to be enabled
             * @param  {Boolean} [config.isEnabled] specifies if the brick is disabled from the start
             * @param  {Array} [config.freezeStates] a set of rules specifying states Brick should be frozen
             * @param  {String} [config.baseTemplate] a base template name to be used
             * @param  {String} [config.noticeTemplate] a notice template name to be used
             * @param  {String} [config.containerClass] a CSS class of the specific brick container
             * @param  {String} [config.customContainerClass] any other optional CSS class to be added to the brick container
             * @param  {String} [config.template] a name of the specific Brick template
             * @retun DropDownBrick
             * @chainable
             * 
             */
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

                // setting event listener on <select> node; "change" is the most appropriate
                // https://developer.mozilla.org/en-US/docs/Web/Events/change
                this.selectNode.on("change", function () {
                    var option = that.selectNode.find("option:selected");

                    that.setDropDownValue(option, true);
                });

                if (this.options) {
                    this.setDropDownOptions(this.options);
                }
            },

            /**
             * Selects the option whose value is provided in selectedOption param;
             * 
             * @method selectOption
             * @param {String} selectedOption    string value to be selected in the dropdown
             * @param {Boolean} userSelected boolean value indicating if the user is the source of the string value
             * @return {DropDownBrick}           itself
             * @chainable
             */
            selectOption: function (selectedOption, userSelected) {
                var option = this.selectNode.find("option[value='" + selectedOption + "']");

                this.selectNode.val(selectedOption);
                this.setDropDownValue(option, userSelected);

                return this;
            },

            /**
             * Stores selected option's text and value and notifies any listeners of the change.
             * Internal should not be called from outside.
             * 
             * @method setDropDownValue
             * @private
             * @param {String} option    string value to be selected in the dropdown
             * @param {Boolean} userSelected boolean value indicating if the user is the source of the string value
             * @return {DropDownBrick}           itself
             * @chainable
             */
            setDropDownValue: function (option, userSelected) {
                var value = option.val(),
                    text = option.find("option:selected").text();

                this.userSelected = userSelected ? true : false;
                this.dropDownValue = value;
                this.dropDownText = text;

                this.notify(this.event.CHANGE, this.getData());

                return this;
            },

            /**
             * Populates the drop down with provided set of options optionally replacing or appending them to the existing options.
             * 
             * @method setDropDownOptions
             * @param {Array} options an array of options(Object) in the form of { value: [value], text: [text] }
             * @param {Boolean} [append]  Indicates whether to append to or replace the existing options
             * @return {DropDownBrick}           itself
             */
            setDropDownOptions: function (options, append) {
                UtilMisc.setSelectOptions(this.selectNode, options, append);

                return this;
            },

            /**
             * Checks if the option was selected by the user or not.
             * 
             * @method isUserSelected
             * @return {Boolean} true if the option was selected by the user; false, otherwise
             * @return {DropDownBrick}           itself
             * @chainable
             */
            isUserSelected: function () {
                return this.userSelected;
            },

            /**
             * Clears the DropDownBrick by setting the selected option to "" and userSelected to false.
             *
             * @method clear
             * @return {DropDownBrick}           itself
             * @chainable
             */
            clear: function () {
                this.selectOption("");

                Brick.clear.call(this);

                return this;
            },

            /**
             * Checks if the DropDownBrick is valid. It's considered valid if the selected option's value is not "".
             *
             * @method isValid
             * @return {Boolean}           true if valid; false if not
             */
            isValid: function () {
                return this.dropDownValue !== "";
            },

            /**
             * Sets DropDownBrick's data.
             * data object may contain:
             *  - {Object} options an array of options to be added to the dropdown
             *  - {Boolean} append indicates whether to append or replace the exiting options
             *  - {String} selectedOption string value of the option that should be preselected (either old or newly added option)
             *  - {Boolean} userSelected boolean value indicating if the user is the source of the string value
             *
             * By default, after appending/replacing options, the first option will be selected unless specified otherwise.
             *
             * @method setData
             * @param {Object} data a wrapper object for the data to be set.
             * @return {DropDownBrick}           itself
             * @chainable
             */
            setData: function (data) {

                if (data.options) {
                    this.setDropDownOptions(data.options, data.append);
                }

                if (data.selectedOption) {
                    this.selectOption(data.selectedOption, data.userSelected);
                } else if (data.options && data.options.length > 0) {
                    this.selectOption(data.options[0].value, false);
                }

                Brick.setData.call(data);

                return this;
            },

            /**
             * Returns DropDownBrick's data.
             * 
             * @method getData
             * @for DropDownBrick
             * @param  {Boolean} [wrap]    indicates of the payload should be wrapped with a Brick's id; useful when collection information from several Bricks at once. 
             * @return {Object}  A wrapper object around two properties: inputValue and userEntered
             */
            getData: function (wrap) {
                var payload = {
                    dropDownValue: this.dropDownValue,
                    dropDownText: this.dropDownText,
                    userSelected: this.userSelected
                };

                return Brick.getData.call(this, payload, wrap);
            }
        });

        /**
        * The ColorPickerBrick prototype. Provides a control to select a color.
        * To instantiate, call {{#crossLink "ColorPickerBrick/new:method"}}{{/crossLink}} on the ColorPickerBrick prototype.
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
        * @class ColorPickerBrick
        * @for Bricks
        * @static
        * @uses dojo/_base/lang
        * @extends SimpleInputBrick
        * 
        */
        ColorPickerBrick = SimpleInputBrick.extend({
            /**
             * A CSS class of the ColorPickerBrick container node.
             *
             * @property containerClass
             * @private
             * @for ColorPickerBrick
             * @type {String}
             * @default "colorpicker-brick-container"
             */

            /**
             * A name of the default ColorPickerBrick template.
             *
             * @property template
             * @private
             * @type {String}
             * @default "default_colorpicker_brick_template"
             */

            /**
             * Specifies positions of the actual color picker (square wheel) control 
             *
             * @property pickerPosition
             * @private
             * @type {String}
             * @default "top"
             */

            /**
            * The actual node of the picker control.
            *
            * @property picker
            * @private
            * @type {Object}
            */

            /**
             * A sample node that is coloured with the selected colour.
             *
             * @property pickerSwatch
             * @private
             * @type {String}
             */

            /**
             * Initializes the ColorPickerBrick by generating a specified template and setting defaults.
             * A random colour is picked as when this Brick is instantiated.
             * This Brick fires a CHANGE event on every time the selected colour changes.
             * 
             * @method new
             * @param  {String} id     specified id of the Brick
             * @param  {Object} config a configuration object for the Brick
             * @param  {String} [config.header] a Brick header
             * @param  {String} [config.instructions] a configuration object for the Brick
             * @param  {Array|Object} [config.required] collection of rules specifying what external conditions must be valid for the Brick to be enabled
             * @param  {Boolean} [config.isEnabled] specifies if the brick is disabled from the start
             * @param  {Array} [config.freezeStates] a set of rules specifying states Brick should be frozen
             * @param  {String} [config.baseTemplate] a base template name to be used
             * @param  {String} [config.noticeTemplate] a notice template name to be used
             * @param  {String} [config.containerClass] a CSS class of the specific brick container
             * @param  {String} [config.customContainerClass] any other optional CSS class to be added to the brick container
             * @param  {String} [config.template] a name of the specific Brick template
             * @param  {String} [config.label] an input field label. Invisible. Defaults to the Brick's header
             * @param  {String} [config.placeholder] a placeholder to be displayed inside the input field
             * @param  {String} [config.pickerPosition] specifies positions of the actual color picker (square wheel) control
             * @retun ColorPickerBrick
             * @chainable
             * 
             */
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

                // create the picker control
                this.picker = new jscolor.color(this.inputNode[0], {
                    pickerPosition: "top",
                    styleElement: this.pickerSwatch[0], //this.guid + "pickerSwatch",
                    onImmediateChange: function () {
                        that.notify(that.event.CHANGE, that.getData());
                    }
                });

                // generate random colour
                this.picker.fromString((new RColor()).get(true).slice(1));

                this.pickerSwatch.on("click", function () {
                    that.picker.showPicker();
                });

            },

            setInputValue: function () {
                // chill
            },/*

            isValid: function () {
                // TODO: if allowing color picker to start empty, need to check it's validity; otherwise, it's always valid
            }*/

            /*setData: function (data) {
                //TODO: allow to set colors programmatically
                //this.setInputValue(data.value, ?data.userEntered?);

                return this;
            },*/

            /**
             * Returns ColorPickerBrick's data.
             * Returns different colour representations:
             *  - {String} hex hexcode
             *  - {Array} rgb array of rgb colours (from 0 to 1)
             *  - {Array} rgb_ array of rgb colours (from 0 to 255)
             *  - {Array} hsv array of hsv colours (from 0 to 1)
             * 
             * @method getData
             * @for ColorPickerBrick
             * @param  {Boolean} [wrap]    indicates of the payload should be wrapped with a Brick's id; useful when collection information from several Bricks at once. 
             * @return {Object}  A wrapper object around two properties: inputValue and userEntered
             */
            getData: function (wrap) {
                var payload = {
                    hex: this.picker.toString(),
                    rgb: this.picker.rgb,
                    rgb_: this.picker.rgb.map(function (c) { return Math.round(c * 255); }), // also return a proper rgb
                    hsv: this.picker.hsv
                };

                return Brick.getData.call(this, payload, wrap);
            }
        });

        /**
        * The FileInputBrick prototype extends SimpleInputBrick. Provides a control to either select a local file or enter its URL.
        * To instantiate, call {{#crossLink "FileInputBrick/new:method"}}{{/crossLink}} on the FileInputBrick prototype.
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
        * @class FileInputBrick
        * @for Bricks
        * @static
        * @uses dojo/_base/lang
        * @extends SimpleInputBrick
        */
        FileInputBrick = SimpleInputBrick.extend({
            /**
             * A CSS class of the FileInputBrick container node.
             *
             * @property containerClass
             * @private
             * @for FileInputBrick
             * @type {String}
             * @default "fileinput-brick-container"
             */

            /**
             * A name of the default FileInputBrick template.
             *
             * @property template
             * @private
             * @type {String}
             * @default "default_fileinput_brick_template"
             */

            /**
             * A file object that is selected through FileAPI.
             *
             * @property fileValue
             * @private
             * @type {Object}
             * @default null
             */

            /**
             * A flag indicating if the user has selected the file or the file has been selected using some magical means.
             *
             * @property userSelected
             * @private
             * @type {Boolean}
             * @default false
             */

            /**
             * A browse files container node
             *
             * @property browseFilesContainer
             * @private
             * @type {Object}
             */

            /**
             * A node of the file input control.
             *
             * @property fileNode
             * @private
             * @type {Object}
             */

            /**
             * A node of the styled pseudo file input control that just looks nice and doesn't do anything. 
             *
             * @property filePseudoNode
             * @private
             * @type {Object}
             */

            /**
             * Initializes the FileInputBrick by generating a specified template and setting defaults.
             * This Brick fires a CHANGE event on every change inside the input field and on every file selected.
             * 
             * @method new
             * @param  {String} id     specified id of the Brick
             * @param  {Object} config a configuration object for the Brick
             * @param  {String} [config.header] a Brick header
             * @param  {String} [config.instructions] a configuration object for the Brick
             * @param  {Array|Object} [config.required] collection of rules specifying what external conditions must be valid for the Brick to be enabled
             * @param  {Boolean} [config.isEnabled] specifies if the brick is disabled from the start
             * @param  {Array} [config.freezeStates] a set of rules specifying states Brick should be frozen
             * @param  {String} [config.baseTemplate] a base template name to be used
             * @param  {String} [config.noticeTemplate] a notice template name to be used
             * @param  {String} [config.containerClass] a CSS class of the specific brick container
             * @param  {String} [config.customContainerClass] any other optional CSS class to be added to the brick container
             * @param  {String} [config.template] a name of the specific Brick template
             * @param  {String} [config.label] an input field label. Invisible. Defaults to the Brick's header
             * @param  {String} [config.placeholder] a placeholder to be displayed inside the input field
             * @retun FileInputBrick
             * @chainable
             * 
             */
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

                // style the pseudoBrowse control to act as a normal button control
                UtilMisc.styleBrowseFilesButton(this.browseFilesContainer);

                this.fileNode.on("change", function (event) {
                    var file = event.target.files[0];

                    that.setFileValue(file, true);
                });
            },

            /**
             * Sets the current value of the input field. In this case it's a file URL.
             * If the URL is set, the returned file object is null.
             *
             * First calls setFileValue(null, false) to null the file object, then calls the prototype's setInputValue with the same parameters.
             * 
             * @method setInputValue
             * @param {String} value    string value to be entered into the input field
             * @param {Boolean} userEntered boolean value indicating if the user is the source of the string value
             * @return {FileInputBrick}           itself
             * @chainable
             */
            setInputValue: function (value, userEntered) {
                this.setFileValue(null, false);

                SimpleInputBrick.setInputValue.call(this, value, userEntered);

                return this;
            },

            /**
             * Sets file value of the Brick. When setting file object, input value is set to "". If value is null, the form is reset.
             * 
             * @method setFileValue
             * @param {Object} value        the selected file object
             * @param {Boolean} userSelected boolean value indicating if the user selected the file
             * @return {FileInputBrick}           itself
             * @chainable
             */
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

                return this;
            },

            /**
             * Checks if the file was selected by the user or not.
             * 
             * @method isUserSelected
             * @return {Boolean} true if the file was selected by the user; false, otherwise
             */
            isUserSelected: function () {
                return this.userSelected;
            },

            /**
             * Clears the Brick by setting inputValue to "" which sets fileValue to null and userEntered to false.
             *
             * @method clear
             * @return {FileInputBrick}           itself
             * @chainable
             */
            clear: function () {
                this.setInputValue("", false);

                Brick.clear.call(this);

                return this;
            },

            /**
             * Checks if the FileInputBrick is valid. It's considered valid if the input value is not "" or a file value is not null. 
             *
             * @method isValid
             * @return {Boolean}           true if valid; false if not
             */
            isValid: function () {
                return SimpleInputBrick.isValid.call(this) || this.fileValue ? true : false;
            },

            /**
             * Sets SimpleInputBrick's data. First calls setInputValue and calls set data on the Brick prototype.
             * data object may contain:
             *  - {Object} fileValue a file object 
             *  - {String} inputValue a input value (file URL)
             *  - {Boolean} userSelected boolean value indicating if the user is the source of the file value
             *  - {Boolean} userEntered boolean value indicating if the user is the source of the string value
             *
             * if both fileValue and inputValue are specified, only fileValue is used.
             * 
             * @method setData
             * @param {Object} data a wrapper object for the data to be set.  
             * @return {FileInputBrick}           itself
             * @chainable
             */
            setData: function (data) {
                if (data.fileValue) {
                    this.setFileValue(data.fileValue, data.userSelected);
                } else if (data.inputValue) {
                    this.setInputValue(data.inputValue, data.userEntered);
                }

                SimpleInputBrick.setData.call(data);

                return this;
            },

            /**
             * Returns FileInputBrick's data. Either a file object or a file URL will be returned along with the file name, not both.
             *
             * Returns an object:
             *  - {Object} fileValue file object if any was selected
             *  - {String} fileName derived file name
             *  - {Boolean} userSelected a flag indicating if the user has selected the file or typed the URL
             * 
             * @method getData
             * @for FileInputBrick
             * @param  {Boolean} [wrap]    indicates of the payload should be wrapped with a Brick's id; useful when collection information from several Bricks at once. 
             * @return {Object}  A wrapper object around two properties: inputValue and userEntered
             */
            getData: function (wrap) {
                var payload = SimpleInputBrick.getData.call(this);

                lang.mixin(payload,
                    {
                        fileValue: this.fileValue,
                        // derive the file name
                        fileName: this.fileValue ? this.fileValue.name : this.inputValue.split("/").pop(),
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
             * @static
             * @type Brick
             */
            Brick: Brick,

            /**
             * The MultiBrick prototype. Used as a container for multiple independent Bricks if they are required to be displayed side by side.
             *
             * @property MultiBrick
             * @static
             * @type MultiBrick
             */
            MultiBrick: MultiBrick,

            /**
             * The ButtonBrick prototype. A simple Brick with a button template.
             *
             * @property ButtonBrick
             * @static
             * @type ButtonBrick
             */
            ButtonBrick: ButtonBrick,

            /**
             * The CheckboxBrick prototype. A simple Brick with a checkbox template.
             *
             * @property CheckboxBrick
             * @static
             * @type CheckboxBrick
             */
            CheckboxBrick: CheckboxBrick,

            /**
             * The CheckboxfaBrick prototype. A simple Brick with a checkbox template styled with Formstone lib.
             *
             * @property CheckboxfaBrick
             * @static
             * @type CheckboxfaBrick
             */
            CheckboxfsBrick: CheckboxfsBrick,

            /**
             * The ToggleBrick prototype. A simple Brick with a checkbox toggle template.
             *
             * @property ToggleBrick
             * @static
             * @type ToggleBrick
             */
            ToggleBrick: ToggleBrick,

            /**
             * The OkCancelButtonBrick prototype. A MultiBrick with two ButtonBricks displayed side by side and styled as OK and Cancel buttons.
             *
             * @property OkCancelButtonBrick
             * @static
             * @type OkCancelButtonBrick
             */
            OkCancelButtonBrick: OkCancelButtonBrick,

            /**
             * The ChoiceBrick prototype. Provides a user the ability to choose a single item among several.
             *
             * @property ChoiceBrick
             * @static
             * @type ChoiceBrick
             */
            ChoiceBrick: ChoiceBrick,

            /**
             * The DropDownBrick prototype. Provides a dropdown control to choose an item from.
             *
             * @property DropDownBrick
             * @static
             * @type DropDownBrick
             */
            DropDownBrick: DropDownBrick,

            /**
             * The ColorPickerBrick prototype. Provides a control to select a color.
             *
             * @property ColorPickerBrick
             * @static
             * @type ColorPickerBrick
             */
            ColorPickerBrick: ColorPickerBrick,

            /**
             * The SimpleInputBrick prototype. Provides a control for a simple text input. Can be potentially extended to serve more specific purposes.
             *
             * @property SimpleInputBrick
             * @static
             * @type SimpleInputBrick
             */
            SimpleInputBrick: SimpleInputBrick,

            /**
             * The FileInputBrick prototype extends SimpleInputBrick. Provides a control to either select a local file or enter its URL.
             *
             * @property FileInputBrick
             * @static
             * @type FileInputBrick
             */
            FileInputBrick: FileInputBrick
        };
    });