/* global define */

/**
* @module Tools
*/

/**
* [Description]
*
*
*
* @class BaseTool
* @static
* @uses dojo/Evented
* @uses dojo/_base/lang
* @uses Checkbox
*/

define(["dojo/Evented", "dojo/_base/lang",

        "utils/popupManager"],
    function (Evented, dojoLang,
            PopupManager) {
        "use strict";

        return dojoLang.mixin(new Evented(),
            {
                active: false,

                handle: null,
                initToggle: function (node, activate, deactivate) {
                    var that = this;

                    this.handle = PopupManager.registerPopup(node, "click",
                        function (d) {
                            console.log("open tool");
                            activate.call(this);

                            d.resolve();
                        }, {
                            closeHandler: function (d) {
                                console.log("close tool");
                                deactivate.call(this);

                                d.resolve();
                            },

                            activeClass: "button-pressed",
                            useAria: false
                        }
                    );
                },

                activate: function () {
                    console.log("base activate; nothing to see here;")
                    if (this.handle) {
                        this.handle.open();
                    }
                },

                deactivate: function () {
                    console.log("base deactivate; nothing to see here;")
                    if (this.handle) {
                        this.handle.close();
                    }
                }
            }
        );
    }
);