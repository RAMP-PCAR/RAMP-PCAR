/* global define, console, TweenLite, $ */

define([
    "dojo/_base/lang",

    /* Text */
    "dojo/text!./templates/layer_selector_template.json",

    /* Ramp */

    "utils/PopupManager",

    /* Util */
    "utils/tmplHelper", "utils/tmplUtil", "utils/array", "utils/dictionary"
],
    function (
        lang,
        layer_selector_template,
        PopupManager,
        TmplHelper, TmplUtil, UtilArray, UtilDict
    ) {
        "use strict";

        //var rootNode = $("#add-dataset-section-container");

        console.log(lang, layer_selector_template, TmplHelper, TmplUtil, UtilArray, UtilDict);

        PopupManager.registerPopup($("#searchMapSectionBody"), "click",
            function (d) {
                var options = this.target.find("> .step-options"),
                    option = options.find(" > ." + this.handle.data("option"));

                if (this.target.is(":hidden")) {
                    this.target.show();

                    TweenLite.to(options, 0, { left: -option.position().left, ease: "easeOutCirc" });
                    TweenLite.to(this.target, 0, { height: option.height(), ease: "easeOutCirc" });
                    TweenLite.fromTo(this.target, 0.4, { top: -this.target.height() }, { top: 0, ease: "easeOutCirc" });

                    $("#searchMapSectionBody").find(".current-step")
                        .height("auto")
                        .removeClass("current-step");

                    this.target.addClass("current-step");

                } else {
                    console.log(option.position());

                    TweenLite.to(options, 0.4, { left: -option.position().left, ease: "easeOutCirc" });
                    TweenLite.to(this.target, 0.4, { height: option.height(), ease: "easeOutCirc" });
                }

                
                d.resolve();
            },
            {
                containerSelector: ".step:first",
                handleSelector: ".btn-option",
                targetSelector: "> .step-options-container",
                activeClass: "button-pressed",
                openOnly: true
            }
        );

        return {

        };
    });