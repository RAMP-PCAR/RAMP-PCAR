/* global define, console, TweenLite, TimelineLite, $ */

define([
    /* Dojo */
    "dojo/_base/lang", "dojo/Deferred",

    /* Text */
    "dojo/text!./templates/layer_selector_template.json",

    /* Ramp */

    "utils/PopupManager", "ramp/dataLoader", "ramp/theme",

    /* Util */
    "utils/tmplHelper", "utils/tmplUtil", "utils/array", "utils/dictionary"
],
    function (
        lang, Deferred,
        layer_selector_template,
        PopupManager, DataLoader, Theme,
        TmplHelper, TmplUtil, UtilArray, UtilDict
    ) {
        "use strict";

        //var rootNode = $("#add-dataset-section-container");

        console.log(lang, layer_selector_template, TmplHelper, TmplUtil, UtilArray, UtilDict);

        var rootNode = $("#searchMapSectionBody"),

            loadSteps = {
                loadServiceStep: {
                    serviceType: null,
                    url: "",
                    buttonId: "serviceURLinputSubmit"
                },

                loadFileStep: {
                    fileType: null,
                    "file-url": "",
                    buttonId: ""
                }
            },

            transitionDuration = 0.4;

        function checkLoadStep(stepId, step) {
            var loadStep = loadSteps[stepId];

            switch (stepId) {
                case "loadServiceStep":
                    if (loadStep.url && !loadStep.serviceType) {
                        if (loadStep.url.match(/ArcGIS\/rest\/services/ig)) {

                            step
                                .find("div[data-choice-id='serviceType'] button")
                                .removeClass("button-pressed")
                                .filter("button[data-option='option-1']")
                                .addClass("button-pressed");

                            loadStep.serviceType = "option-1";

                        } else if (loadStep.url.match(/wms/ig)) {
                            console.log("Z: wms?");
                        }

                    }

                    rootNode
                        .find("#" + loadStep.buttonId)
                        .toggleClass("disabled", (!loadStep.serviceType || loadStep.url === ""));

                    break;
            }
        }

        PopupManager.registerPopup(rootNode, "click",
            function (d) {
                var step = this.handle.parents(".step:first"),
                    stepId = step.data("step-id"),
                    group = this.handle.parents(".choice-group:first"),
                    choiceId = group.data("choice-id");

                group
                    .find(".button-pressed")
                    .removeClass("button-pressed");

                loadSteps[stepId][choiceId] = this.handle.data("option");

                checkLoadStep(stepId, step);

                d.resolve();
            },
            {
                containerSelector: ".choice-group:first",
                handleSelector: ".btn-option:not(.button-pressed):not(.btn-action)",
                activeClass: "button-pressed",
                openOnly: true,
                useAria: false
            }
        );

        PopupManager.registerPopup(rootNode, "click",
            function (d) {
                var optionsContainer = this.target,
                    optionsBackground = optionsContainer.find("> .options-bg"),
                    options = optionsContainer.find("> .step-options"),
                    option = options.find("> ." + this.handle.data("option")),
                    optionStepContent,

                    otherOptionButtons = this.handle.parent().find(".button-pressed"),

                    currentStepContent = optionsContainer.prev(),
                    currentOptionsContainer = rootNode.find(".current-step"),

                    step = this.handle.parents(".step:first"),
                    stepId = step.data("step-id"),

                    retreatOptionsContainers = [],

                    advanceOptionsContainers = [],
                    lastContainer = optionsContainer,

                    optionsLeftShift,
                    leftShiftStartAdjustment,

                    tl = new TimelineLite({ paused: true }),

                    loadURLStep = (function () {
                        var inputControlGroup,
                            inputControl,
                            inputControlButtons;

                        function clearStep() {
                            currentOptionsContainer.removeClass("error");
                            currentStepContent.removeClass("loaded error");
                            inputControlGroup.removeClass("has-feedback has-success has-error");

                            currentStepContent.find(".btn-action").removeClass("button-pressed");
                        }

                        return {
                            init: function () {
                                inputControlGroup = currentStepContent.find(".input-group");
                                inputControl = inputControlGroup.find(".load-url-control");
                                inputControlButtons = inputControlGroup.find(".input-group-btn");
                            },

                            beforeLoadUrlStep: function () {
                                currentOptionsContainer
                                    .removeClass("error")
                                    .addClass("loading");

                                currentStepContent.removeClass("error");

                                inputControlGroup.removeClass("has-feedback has-success has-error");
                            },

                            successLoadUrlStep: function () {
                                tl
                                    .call(function () {
                                        inputControl.attr("readonly", true);

                                        currentOptionsContainer.removeClass("loading");
                                        currentStepContent.addClass("loaded");
                                        inputControlGroup.addClass("has-feedback has-success");

                                        currentStepContent
                                            .find(".btn-option:not(.btn-action)")
                                            .addClass("disabled");

                                        currentStepContent
                                            .find(".glyphicon")
                                            .css({ right: inputControlButtons.width() });
                                    }, [], null)
                                ;

                                resolveTreeTransitions();
                                executeTransitions();
                            },

                            errorLoadUrlStep: function () {
                                tl
                                    .call(function () {
                                        currentOptionsContainer
                                            .addClass("error")
                                            .removeClass("loading");

                                        currentStepContent.addClass("error");

                                        inputControlGroup.addClass("has-feedback has-error");

                                        currentStepContent
                                            .find(".glyphicon")
                                            .css({ right: inputControlButtons.width() });
                                    }, [], null)
                                ;

                                // no need to resolve transition since there shouldn't be any transitions on error
                                executeTransitions();

                                //Theme.tooltipster(rootNode, null, null, { position: "left" });

                                currentStepContent.on("click", ".btn-option:not(.btn-action)", function () {
                                    currentStepContent.off("click", ".btn-option:not(.btn-action)");

                                    clearStep();
                                });

                                inputControl.on("input", function () {
                                    inputControl.off("input");

                                    clearStep();
                                });
                            },

                            cancelLoadUrlStep: function () {
                                retreatOptionsContainers.push(optionsContainer); // add the current options container
                                lastContainer = optionsContainer.parents(".step-options-container:first");

                                resolveTreeTransitions();

                                tl
                                    .call(function () {
                                        inputControl
                                            //.val("")
                                            .attr("readonly", false);

                                        clearStep();

                                        currentStepContent
                                            .find(".btn-option:not(.btn-action)")
                                            .removeClass("disabled");

                                        // disable all active options in the following steps
                                        optionsContainer
                                            .find(".active-option").removeClass("active-option")
                                            .end()
                                            .find(".button-pressed").removeClass("button-pressed");

                                        loadUrlControlStatusCheck(inputControl);
                                    }, [], null, 0)
                                ;

                                executeTransitions();
                            }
                        };
                    }())
                ;

                function findContainers() {
                    var node; // temp variable

                    optionStepContent = option.find("> .step-content");

                    // find all downstream containers that have active options including the current container;
                    // they will be opened
                    node = option;
                    while (node.length) {
                        advanceOptionsContainers.push(node.parents(".step-options-container:first"));
                        node = node.find("> .step-options-container > .step-options > .active-option:first");
                    }

                    // find all downstream containers that are visible;
                    // they will be closed
                    retreatOptionsContainers = retreatOptionsContainers
                        .concat(
                            optionsContainer
                                .find(".step-options-container:visible")
                                .toArray()
                        );
                }

                function advance() {
                    var advanceStagger = transitionDuration / 2 / advanceOptionsContainers.length; // calculate advance transition stagger

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
                    var retreatStagger = transitionDuration / 2 / retreatOptionsContainers.length;
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
                    findContainers();

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
                    ;
                }

                function executeTransitions() {
                    tl
                        .set(otherOptionButtons, { className: "-=button-pressed" }, 0)
                        .play();

                    d.resolve();
                }

                function someFunction(action) {
                    var promise;

                    switch (action) {
                        case "serviceURLcancel":
                            loadURLStep.init();
                            loadURLStep.cancelLoadUrlStep();

                            break;

                        case "serviceURL":
                            loadURLStep.init();

                            loadURLStep.beforeLoadUrlStep();

                            promise = DataLoader.loadDataSet({
                                url: loadSteps[stepId].url
                            });

                            promise.then(function (event) {
                                option = options.find("> ." + loadSteps[stepId].serviceType + ":first");

                                loadURLStep.successLoadUrlStep();

                                event = null;
                                //console.log(event);

                            }, function () {
                                loadURLStep.errorLoadUrlStep();
                            });

                            break;

                        case "wmsURLcancel":
                            //cancelLoadUrlStep();

                            break;

                        case "wmsURL":
                            //beforeLoadUrlStep();
                            //successLoadUrlStep();

                            break;
                    }
                }

                if (this.handle.data("action")) {
                    someFunction(this.handle.data("action"));
                } else {
                    resolveTreeTransitions();
                    executeTransitions();
                }
            },
            {
                containerSelector: ".step:first",
                handleSelector: ".btn-action:not(.button-pressed)",
                targetSelector: "> .step-options-container",
                activeClass: "button-pressed",
                openOnly: true
            }
        );

        function loadUrlControlStatusCheck(control) {
            var step = control.parents(".step:first"),
                stepId = step.data("step-id");

            loadSteps[stepId].url = control.val();

            checkLoadStep(stepId, step);
        }

        rootNode.on("input", ".load-url-control", function (event) {
            loadUrlControlStatusCheck($(event.target));
        });

        return {

        };
    });