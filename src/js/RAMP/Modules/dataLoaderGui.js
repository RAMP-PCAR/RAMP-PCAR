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

        var transitionDuration = 1;

        PopupManager.registerPopup($("#searchMapSectionBody"), "click",
            function (d) {
                var optionsContainer = this.target,
                    optionsBackground = optionsContainer.find("> .options-bg"),
                    options = optionsContainer.find("> .step-options"),
                    option = options.find("> ." + this.handle.data("option")),
                    optionStepContent = option.find("> .step-content"),

                    currentOptionsContainer = $("#searchMapSectionBody").find(".current-step"),

                    tl = new TimelineLite({ paused: true });

                if (optionsContainer.is(":hidden")) {

                    TweenLite.set(optionsContainer, { display: "block" });

                    tl
                        .to(optionsBackground, 0, { height: optionStepContent.outerHeight() }, 0)

                        .set(options, { left: -optionStepContent.position().left, ease: "easeOutCirc" })

                        .set(option, { className: '+=active-option' }, 0)

                        .to(optionsContainer, 0, { height: optionStepContent.outerHeight(), ease: "easeOutCirc" }, 0)
                        .fromTo(optionsContainer, transitionDuration, { top: -optionsContainer.height() }, { top: 0, ease: "easeOutCirc" }, 0)
                    
                    ;

                    //  this.target.show();

                    //$("#searchMapSectionBody").find(".current-step")
                    //    .height("auto")
                    //    .removeClass("current-step");

                    //TweenLite.to(options, 0, { left: -optionStepContent.position().left, ease: "easeOutCirc" });
                    //  TweenLite.to(this.target, 0, { height: optionStepContent.outerHeight() + 1, ease: "easeOutCirc" });
                    //  TweenLite.fromTo(this.target, transitionDuration, { top: -this.target.height() }, { top: 0, ease: "easeOutCirc" });

                    //this.target.addClass("current-step");

                } else {
                    console.log(optionStepContent.position());

                    var //q = this.target.find(".step-options-container:first"),
                        descendantOptionsContainers = optionsContainer.find(".step-options-container:visible"),
                        optionsLeftShift = optionStepContent.position().left;

                    descendantOptionsContainers.each(function (i, doc) {
                        var docActiveOption,
                            docActiveOptionContent;

                        doc = $(doc);
                        docActiveOption = doc.find("> .step-options > .step.active-option");
                        docActiveOptionContent = docActiveOption.find("> .step-content");

                        tl
                            .to(doc, transitionDuration,
                                { top: -docActiveOptionContent.outerHeight(), ease: "easeInCirc" },
                                transitionDuration * 0.5 * (descendantOptionsContainers.length - i - 1))
                            .set(doc, { display: "none" })
                        ;
                    });

                    if (optionsLeftShift !== options.position().left) {
                        tl
                            .addLabel("leftShiftStart")
                            .to(optionsBackground, transitionDuration, { height: optionStepContent.outerHeight() }, "leftShiftStart")
                            .to(options, transitionDuration,
                                { left: -optionsLeftShift, ease: "easeOutCirc" }, "leftShiftStart")
                        ;
                    }

                    //tl.play();
                    //tl
                    //    .to(this.target.find(".step-options-container"), 0.3, { display: "none", ease: "easeOutCirc" });

                    //TweenLite.to(options, 0.4, { left: -optionStepContent.position().left, ease: "easeOutCirc" });
                    //TweenLite.to(this.target, 0.4, { height: optionStepContent.outerHeight(), ease: "easeOutCirc" });

                    //TweenLite
                }

                tl
                    .set(currentOptionsContainer, { height: "auto", className: "-=current-step" }, 0)
                    .set(optionsContainer, { className: "+=current-step" }, 0)

                ;

                tl.play();

                //$("#searchMapSectionBody").find(".current-step")
                //        .removeClass("current-step");

                //this.target.addClass("current-step");

                this.target.parents(".step:first").find(".button-pressed").removeClass("button-pressed");

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