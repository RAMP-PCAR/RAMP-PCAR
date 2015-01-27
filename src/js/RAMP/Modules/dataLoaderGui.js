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
                retreatOptionsContainers = optionsContainer
                    .find(".step-options-container:visible")
                    .toArray();

                function advance() {
                    advanceStagger = transitionDuration / 2 / advanceOptionsContainers.length; // calculate advance transition stagger

                    option.addClass("active-option"); // mark selected option as active

                    tl.addLabel("advanceStart"); // add time label

                    advanceOptionsContainers.forEach(function (aoc, i) {
                        var optionsBackground,
                            options,
                            optionStepContent;

                        aoc = $(aoc);

                        optionsBackground = aoc.find("> .options-bg");
                        options = aoc.find("> .step-options");
                        optionStepContent = options.find("> .active-option:first > .step-content");

                        TweenLite.set(aoc, { display: "block" }); // unhide options container

                        // re-detect the left offset if the block has been hidden before; otherwise it will be zero;
                        optionsLeftShift = optionStepContent.position().left;

                        tl
                            .to(optionsBackground, 0, { height: optionStepContent.outerHeight() }, "advanceStart+=" + advanceStagger * (i))

                            .set(options, { left: -optionsLeftShift, ease: "easeOutCirc" }, "advanceStart+=" + advanceStagger * (i))

                            .to(aoc, 0, { height: optionStepContent.outerHeight(), ease: "easeOutCirc" }, "advanceStart+=" + advanceStagger * (i))
                            .fromTo(aoc, transitionDuration,
                                { top: -aoc.height() },
                                { top: 0, ease: "easeOutCirc" },
                                "advanceStart+=" + advanceStagger * (i))
                            .set(aoc, { height: "auto" }, "advanceStart+=" + advanceStagger * (i))
                        ;

                        lastContainer = aoc;
                    });
                }

                function retreat() {
                    retreatStagger = transitionDuration / 2 / retreatOptionsContainers.length;
                    leftShiftStartAdjustment = retreatOptionsContainers.length > 0 ? "-=0.1" : "";

                    retreatOptionsContainers.forEach(function (doc, i) {
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
                    var optionsLeftShift = optionStepContent.length > 0 ? optionStepContent.position().left : -1;

                    if (optionsLeftShift !== -1 && optionsLeftShift !== options.position().left) {

                        tl
                            .addLabel("leftShiftStart")

                            .to(optionsBackground, transitionDuration, { height: optionStepContent.outerHeight() }, "leftShiftStart" + leftShiftStartAdjustment)
                            .to(options, transitionDuration,
                                { left: -optionsLeftShift, ease: "easeOutCirc" }, "leftShiftStart" + leftShiftStartAdjustment)
                            .set(options.find("> .step"), { className: "-=active-option" }) // when shifting, active-option is changing
                            .set(option, { className: "+=active-option" })
                        ;
                    }
                }

                function resolveTreeTransitions() {
                    if (optionsContainer.is(":hidden")) {
                        advance();
                    } else {
                        retreat();

                        shift();

                        // drop the first container since it shouldn't be advanced
                        UtilArray.remove(advanceOptionsContainers, 0);
                        advance();
                    }

                    tl
                        .set(currentOptionsContainer, { height: "auto", className: "-=current-step" }, 0)
                        .set(lastContainer, { className: "+=current-step" }, 0)
                        .set(otherOptionButtons, { className: "-=button-pressed" }, 0)
                    ;
                }

                function executeTransitions() {
                    tl.play();

                    d.resolve();
                }

                function successLoadUrlStep() {
                    currentOptionsContainer.removeClass("loading");
                    currentStepContent.addClass("loaded");

                    currentStepContent
                        .find(".glyphicon")
                        .css({ right: currentStepContent.find(".input-group-btn").width(), top: 0 });

                    currentStepContent.find(".input-group").addClass("has-feedback has-success");

                    resolveTreeTransitions();
                    executeTransitions();
                }

                function cancelLoadUrlStep() {
                    var inputControlGroup = currentStepContent.find(".input-group"),
                        inputControl = inputControlGroup.find(".load-url-control"),
                        inputControlButtons = inputControlGroup.find(".input-group-btn"),
                        inputLoadButton = inputControlButtons.find(".btn-option:not(.btn-cancel)");

                    retreatOptionsContainers.unshift(optionsContainer); // retreat the current options container
                    lastContainer = optionsContainer.parents(".step-options-container:first");

                    resolveTreeTransitions();

                    tl
                        .set(currentStepContent, { className: "-=loaded" }, 0)
                        .set(optionsContainer.find(".active-option"), { className: "-=active-option" })
                        .set(optionsContainer.find(".button-pressed"), { className: "-=button-pressed" })
                        .set(inputControlGroup, { className: "-=has-feedback has-success" }, 0)
                        
                        .call(function () {
                            inputControl.val("");
                            loadUrlControlStatusCheck(inputLoadButton);
                        }, [], null, 0)
                    ;

                    executeTransitions();
                }

                function someFunction(action) {
                    var def = new Deferred();

                    switch (action) {
                        case "featureURLcancel":
                            cancelLoadUrlStep();

                            break;

                        case "featureURL":

                            currentOptionsContainer.addClass("loading");

                            window.setTimeout(function () {
                                
                                successLoadUrlStep();
                            }, 1000);

                            break;
                    }

                    return def.promise;
                }

                if (this.handle.data("action")) {
                    pr = someFunction(this.handle.data("action"));
                } else {
                    //pr = (new Deferred()).resolve();
                    resolveTreeTransitions();
                    executeTransitions();
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

        function loadUrlControlStatusCheck(control) {
            var controlButton = control.parent().find("button[id^='" + control.attr("id") + "']");

            controlButton.toggleClass("disabled", control.val().length === 0);
        }

        rootNode.on("input", ".load-url-control", function (event) {
            loadUrlControlStatusCheck($(event.target));
        });

        return {

        };
    });