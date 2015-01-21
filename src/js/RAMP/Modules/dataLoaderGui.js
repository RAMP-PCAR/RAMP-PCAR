/* global define, console, TweenLite, TimelineLite, $ */

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

        var tl = new TimelineLite({ paused: true });

        PopupManager.registerPopup($("#searchMapSectionBody"), "click",
            function (d) {
                var options = this.target.find("> .step-options"),
                    option = options.find(" > ." + this.handle.data("option") + "> .step-content");

                if (this.target.is(":hidden")) {
                    this.target.show();

                    $("#searchMapSectionBody").find(".current-step")
                        .height("auto")
                        .removeClass("current-step");

                    TweenLite.to(options, 0, { left: -option.position().left, ease: "easeOutCirc" });
                    TweenLite.to(this.target, 0, { height: option.outerHeight() + 1, ease: "easeOutCirc" });
                    TweenLite.fromTo(this.target, 0.4, { top: -this.target.height() }, { top: 0, ease: "easeOutCirc" });

                    
                    this.target.addClass("current-step");

                } else {
                    console.log(option.position());

                    var q = this.target.find(".step-options-container:first");

                    tl
                        .clear()
                        .to(options, 0.4, { left: -option.position().left, ease: "easeOutCirc" }, 0)
                        .to(this.target, 0.4, { height: option.outerHeight() + 1, ease: "easeOutCirc" }, 0)
                        .set(q, { display: "none" }, 0.3999);

                    tl.play();
                    //tl
                    //    .to(this.target.find(".step-options-container"), 0.3, { display: "none", ease: "easeOutCirc" });

                    //TweenLite.to(options, 0.4, { left: -option.position().left, ease: "easeOutCirc" });
                    //TweenLite.to(this.target, 0.4, { height: option.outerHeight(), ease: "easeOutCirc" });

                    //TweenLite
                }

                $("#searchMapSectionBody").find(".current-step")
                        .removeClass("current-step");

                this.target.addClass("current-step");
                
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