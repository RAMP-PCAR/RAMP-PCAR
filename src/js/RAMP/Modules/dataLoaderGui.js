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

        var transitionDuration = 0.4;

        PopupManager.registerPopup($("#searchMapSectionBody"), "click",
            function (d) {
                var optionsContainer = this.target,
                    optionsBackground = optionsContainer.find("> .options-bg"),
                    options = optionsContainer.find("> .step-options"),
                    option = options.find("> ." + this.handle.data("option")),
                    optionStepContent = option.find("> .step-content"),

                    otherOptionButtons = optionsContainer.parents(".step:first").find(".button-pressed"),

                    currentOptionsContainer = $("#searchMapSectionBody").find(".current-step"),

                    descendantOptionsContainers,
                    descendantStagger,

                    optionsLeftShift = optionStepContent.position().left,

                    tl = new TimelineLite({ paused: true });

                if (optionsContainer.is(":hidden")) {

                    TweenLite.set(optionsContainer, { display: "block" });

                    tl
                        .to(optionsBackground, 0, { height: optionStepContent.outerHeight() }, 0)

                        .set(options, { left: -optionsLeftShift, ease: "easeOutCirc" })

                        .set(option, { className: '+=active-option' }, 0)

                        .to(optionsContainer, 0, { height: optionStepContent.outerHeight(), ease: "easeOutCirc" }, 0)
                        .fromTo(optionsContainer, transitionDuration, { top: -optionsContainer.height() }, { top: 0, ease: "easeOutCirc" }, 0)                    
                    ;

                } else {
                    descendantOptionsContainers = optionsContainer.find(".step-options-container:visible");
                    descendantStagger = transitionDuration / 2 / descendantOptionsContainers.length;

                    descendantOptionsContainers.each(function (i, doc) {
                        var docActiveOption,
                            docActiveOptionContent;

                        doc = $(doc);
                        docActiveOption = doc.find("> .step-options > .step.active-option");
                        docActiveOptionContent = docActiveOption.find("> .step-content");

                        tl
                            .to(doc, transitionDuration,
                                { top: -docActiveOptionContent.outerHeight(), ease: "easeOutCirc" },
                                descendantStagger * (descendantOptionsContainers.length - i - 1))
                            .set(doc, { display: "none" })
                        ;
                    });

                    if (optionsLeftShift !== options.position().left) {
                        tl
                            .addLabel("leftShiftStart")
                            .to(optionsBackground, transitionDuration, { height: optionStepContent.outerHeight() }, "leftShiftStart-=0.1")
                            .to(options, transitionDuration,
                                { left: -optionsLeftShift, ease: "easeOutCirc" }, "leftShiftStart-=0.1")
                        ;
                    }
                }

                tl
                    .set(currentOptionsContainer, { height: "auto", className: "-=current-step" }, 0)
                    .set(optionsContainer, { className: "+=current-step" }, 0)
                    .set(otherOptionButtons, { className: "-=button-pressed" }, 0)
                ;

                tl.play();

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