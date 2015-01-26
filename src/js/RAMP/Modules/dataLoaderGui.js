/* global define, console, TweenLite, TimelineLite, $, window */

define([
    /* Dojo */
    "dojo/_base/lang", "dojo/Deferred",

    /* Text */
    "dojo/text!./templates/layer_selector_template.json",

    /* Ramp */

    "utils/PopupManager",

    /* Util */
    "utils/tmplHelper", "utils/tmplUtil", "utils/array", "utils/dictionary"
],
    function (
        lang, Deferred,
        layer_selector_template,
        PopupManager,
        TmplHelper, TmplUtil, UtilArray, UtilDict
    ) {
        "use strict";

        //var rootNode = $("#add-dataset-section-container");

        console.log(lang, layer_selector_template, TmplHelper, TmplUtil, UtilArray, UtilDict);

        var rootNode = $("#searchMapSectionBody"),
            transitionDuration = 0.4;

        function someFunction(control) {
            var def = new Deferred();

            switch (control.data("action")) {
                case "featureURL":

                    control.parents(".step-options-container:first").addClass("loading");

                    window.setTimeout(function () {
                        def.resolve();
                    }, 1000);

                    break;

            }

            return def.promise;
        }

        PopupManager.registerPopup(rootNode, "click",
            function (d) {
                var optionsContainer = this.target,
                    optionsBackground = optionsContainer.find("> .options-bg"),
                    options = optionsContainer.find("> .step-options"),
                    option = options.find("> ." + this.handle.data("option")),
                    optionStepContent = option.find("> .step-content"),

                    otherOptionButtons = optionsContainer.parents(".step:first").find(".button-pressed"),

                    currentOptionsContainer = rootNode.find(".current-step"),

                    descendantOptionsContainers,
                    descendantStagger,
                    leftShiftStartAdjustment,

                    optionsLeftShift = optionStepContent.position().left,

                    pr,

                    tl = new TimelineLite({ paused: true });

                if (this.handle.data("action")) {
                    pr = someFunction(this.handle, optionsContainer);
                } else {
                    pr = (new Deferred()).resolve();
                }

                pr.then(function () {
                    if (optionsContainer.is(":hidden")) {

                        TweenLite.set(optionsContainer, { display: "block" });

                        // re-detect the left offset if the block has been hidden before; otherwise it will be zero;
                        optionsLeftShift = optionStepContent.position().left;

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
                        leftShiftStartAdjustment = descendantOptionsContainers.length > 0 ? "-=0.1" : "";

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
                                .to(optionsBackground, transitionDuration, { height: optionStepContent.outerHeight() }, "leftShiftStart" + leftShiftStartAdjustment)
                                .to(options, transitionDuration,
                                    { left: -optionsLeftShift, ease: "easeOutCirc" }, "leftShiftStart" + leftShiftStartAdjustment)
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
                });
            },
            {
                containerSelector: ".step:first",
                handleSelector: ".btn-option:not(.button-pressed)",
                targetSelector: "> .step-options-container",
                activeClass: "button-pressed",
                openOnly: true
            }
        );

        rootNode.on("input", ".load-url-control", function (event) {
            var control = $(event.target),
                controlButton = control.next().find("button[id^='" + control.attr("id") + "']");

            controlButton.toggleClass("disabled", control.val().length === 0);
        });

        return {

        };
    });