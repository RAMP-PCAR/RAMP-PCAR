define(["dojo/_base/declare"],
    function (declare) {
        "use strict";

        /*
        * Goes through an array of checkboxes and if any are selected, add the "checked" css class to
        * the label so it displays visually matches the changed state
        *
        * @method _toggleLabels
        * @private
        * @param {Object} objs An array of checkboxes to toggle
        */
        function _toggleLabels(instance, objs) {
            var label;

            objs.each(function (i, obj) {
                var node = $(obj),
                    newText;
                label = node.findInputLabel();
                if (node.is(':checked')) {
                    newText = String.format(instance.labels.checked,
                        label.data("label-name"));
                    label
                        .addClass(instance.checkedClass)
                        .prop('title', newText)
                        .find("> span").text(newText);
                } else {
                    newText = String.format(instance.labels.unchecked,
                        label.data("label-name"));
                    label
                        .removeClass(instance.checkedClass)
                        .prop('title', newText)
                        .find("> span").text(newText);
                }
                if (instance.fnc) {
                    instance.fnc.call(this, label.parent(), null, "update");
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
        function _toggleState(instance, nodes, fcn) {
            nodes.each(function () {
                $(this).prop('checked', fcn($(this)));
            });

            _toggleLabels(instance, nodes);
        }

        return declare(null, {
            /**
            * Wraps the specified checkbox to provide an alternative rendering of checkbox without compromising
            * its functionality. Handles synchronisation of the checkbox's state with its new rendering.
            * Also adds highlight/unhighlight on focus/unfocus, update label when checked/unchecked
            *
            * @method styleCheckboxes
            * @static
            * @param {jObject} node a jQuery object representing the checkbox
            * @param {String} checkedClass Name of the CSS class to be used when checked
            * @param {String} focusedClass Name of the CSS class to be used when focused
            * @param {object} labels An object containing labels' text { checked: "label when checked", unchecked: "label when unchecked" }
            * @param {Function} [fnc] Function to run on the label node when it's toggled
            * @return {CheckboxWrapper} A control objects allowing to toggle checkboxes supplying a state, and retrieve original checkbox nodes
            */
            constructor: function (nodes, checkedClass, focusedClass, labels, fnc) {
                this.checkedClass = checkedClass;
                this.nodes = nodes;
                this.labels = labels;
                this.fnc = fnc;

                var instance = this;

                nodes
                .on("change", function () {
                    _toggleLabels(instance, $(this));
                })
                .on("focus", function () {
                    $(this).findInputLabel().addClass(focusedClass);
                })
                .on("focusout", function () {
                    $(this).findInputLabel().removeClass(focusedClass);
                });

                _toggleLabels(instance, nodes);
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
            setState: function (fcn) {
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