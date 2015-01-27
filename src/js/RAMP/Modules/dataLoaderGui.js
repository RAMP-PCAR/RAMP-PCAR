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

        PopupManager.registerPopup(rootNode, "click",
            function (d) {
                var optionsContainer = this.target,
                    optionsBackground = optionsContainer.find("> .options-bg"),
                    options = optionsContainer.find("> .step-options"),
                    option = options.find("> ." + this.handle.data("option")),
                    optionStepContent = option.find("> .step-content"),

                    otherOptionButtons = optionsContainer.prev().find(".button-pressed"),

                    currentStepContent = optionsContainer.prev(),
                    currentOptionsContainer = rootNode.find(".current-step"),

                    retreatOptionsContainers,
                    retreatStagger,

                    advanceOptionsContainers = [],
                    advanceStagger,
                    lastContainer = optionsContainer,

                    optionsLeftShift,
                    leftShiftStartAdjustment,

                    pr,

                    tl = new TimelineLite({ paused: true }),

                    node // temp variable
                ;

                // find all downstream containers that have active options including the current container;
                // they will be opened
                node = option;
                while (node.length) {
                    advanceOptionsContainers.push(node.parents(".step-options-container:first"));
                    node = node.find("> .step-options-container > .step-options > .active-option:first");
                }

                // find all downstream containers that are visible;
                // they will be closed
                retreatOptionsContainers = optionsContainer.find(".step-options-container:visible");

                //function _advance(optionsBackground, optionStepContent, options, option, aoc) {
                //    tl
                //        .to(optionsBackground, 0, { height: optionStepContent.outerHeight() }, 0)

                //        .set(options, { left: -optionsLeftShift, ease: "easeOutCirc" })

                //        .set(option, { className: "+=active-option" }, 0)

                //        .to(aoc, 0, { height: optionStepContent.outerHeight(), ease: "easeOutCirc" }, 0)
                //        .fromTo(aoc, transitionDuration, { top: -aoc.height() }, { top: 0, ease: "easeOutCirc" }, 0)
                //    ;
                //}

                function advance() {

                    //var lastContainer;

                    // convert to jQuery array
                    //advanceOptionsContainers = advanceOptionsContainers.map(function (a) { return $(a); });
                    advanceStagger = transitionDuration / 2 / advanceOptionsContainers.length;

                    option.addClass("active-option");

                    tl.addLabel("advanceStart");

                    advanceOptionsContainers.forEach(function (aoc, i) {
                        var optionsBackground,
                            options,
                            //option,
                            optionStepContent;

                        aoc = $(aoc);

                        optionsBackground = aoc.find("> .options-bg");
                        options = aoc.find("> .step-options");
                        //option = options.find("> .active-option:first");
                        optionStepContent = options.find("> .active-option:first > .step-content"); // option.find("> .step-content");

                        TweenLite.set(aoc, { display: "block" });

                        // re-detect the left offset if the block has been hidden before; otherwise it will be zero;
                        optionsLeftShift = optionStepContent.position().left;

                        tl
                            .to(optionsBackground, 0, { height: optionStepContent.outerHeight() }, "advanceStart+=" + advanceStagger * (i))

                            .set(options, { left: -optionsLeftShift, ease: "easeOutCirc" }, "advanceStart+=" + advanceStagger * (i))

                            //.set(option, { className: "+=active-option" }, 0)

                            .to(aoc, 0, { height: optionStepContent.outerHeight(), ease: "easeOutCirc" }, "advanceStart+=" + advanceStagger * (i))
                            .fromTo(aoc, transitionDuration,
                                { top: -aoc.height() },
                                { top: 0, ease: "easeOutCirc" },
                                "advanceStart+=" + advanceStagger * (i))
                            .set(aoc, { height: "auto" }, "advanceStart+=" + advanceStagger * (i))
                        ;

                        lastContainer = aoc;
                    });

                    //tl.set(lastContainer, { className: "+=current-step", immediateRender: false });

                    /*TweenLite.set(optionsContainer, { display: "block" });
        
                    // re-detect the left offset if the block has been hidden before; otherwise it will be zero;
                    optionsLeftShift = optionStepContent.position().left;
        
                    tl
                        .to(optionsBackground, 0, { height: optionStepContent.outerHeight() }, 0)
        
                        .set(options, { left: -optionsLeftShift, ease: "easeOutCirc" })
        
                        .set(option, { className: "+=active-option" }, 0)
        
                        .to(optionsContainer, 0, { height: optionStepContent.outerHeight(), ease: "easeOutCirc" }, 0)
                        .fromTo(optionsContainer, transitionDuration, { top: -optionsContainer.height() }, { top: 0, ease: "easeOutCirc" }, 0)
                    ;*/
                }

                function retreat() {
                    retreatStagger = transitionDuration / 2 / retreatOptionsContainers.length;
                    leftShiftStartAdjustment = retreatOptionsContainers.length > 0 ? "-=0.1" : "";

                    retreatOptionsContainers.each(function (i, doc) {
                        var docActiveOption,
                            docActiveOptionContent;

                        doc = $(doc);
                        docActiveOption = doc.find("> .step-options > .step.active-option");
                        docActiveOptionContent = docActiveOption.find("> .step-content");

                        tl
                            .to(doc, transitionDuration,
                                { top: -docActiveOptionContent.outerHeight(), ease: "easeOutCirc" },
                                retreatStagger * (retreatOptionsContainers.length - i - 1))
                            .set(doc, { display: "none" })
                        ;
                    });
                }

                function shift() {

                    optionsLeftShift = optionStepContent.position().left;

                    tl
                        .addLabel("leftShiftStart")

                        .to(optionsBackground, transitionDuration, { height: optionStepContent.outerHeight() }, "leftShiftStart" + leftShiftStartAdjustment)
                        .to(options, transitionDuration,
                            { left: -optionsLeftShift, ease: "easeOutCirc" }, "leftShiftStart" + leftShiftStartAdjustment)
                        .set(options.find("> .step"), { className: "-=active-option" }) // when shifting, active-option is changing
                        .set(option, { className: "+=active-option" })
                    ;
                }

                function resolveTreeTransitions() {
                    if (optionsContainer.is(":hidden")) {
                        advance();
                    } else {
                        //retreatOptionsContainers = optionsContainer.find(".step-options-container:visible");

                        retreat();

                        if (optionsLeftShift !== options.position().left) {
                            shift();
                        }

                        // drop the first container since it shouldn't be advanced
                        UtilArray.remove(advanceOptionsContainers, 0);
                        advance();
                    }

                    tl
                        .set(currentOptionsContainer, { height: "auto", className: "-=current-step" }, 0)
                        .set(lastContainer, { className: "+=current-step" }, 0)
                        .set(otherOptionButtons, { className: "-=button-pressed" }, 0)
                    ;

                    tl.play();

                    d.resolve();
                }

                function someFunction(action) {
                    var def = new Deferred();

                    switch (action) {
                        case "featureURLcancel":

                            retreatOptionsContainers =
                                optionsContainer.add(
                                    optionsContainer.find(".step-options-container:visible")
                                );

                            retreat();
                            tl.play();

                            d.resolve();

                            break;

                        case "featureURL":

                            currentOptionsContainer.addClass("loading");

                            window.setTimeout(function () {
                                currentOptionsContainer.removeClass("loading");
                                currentStepContent.addClass("loaded");

                                resolveTreeTransitions();
                                def.resolve();
                            }, 1000);

                            break;
                    }

                    return def.promise;
                }

                if (this.handle.data("action")) {
                    pr = someFunction(this.handle.data("action"));
                } else {
                    pr = (new Deferred()).resolve();
                    resolveTreeTransitions();
                }

                //pr.then(function () {

                //}, function (err) {
                //    console.log(err);

                //});
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