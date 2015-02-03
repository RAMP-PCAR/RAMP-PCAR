/* global define, console, TweenLite, TimelineLite, $, window, tmpl, jscolor */

define([
    /* Dojo */
    "dojo/_base/lang", "dojo/Deferred",

    /* Text */
    "dojo/text!./templates/filter_manager_template.json",

    /* Ramp */

    "utils/PopupManager", "ramp/dataLoader", "ramp/theme", "ramp/map", "ramp/layerLoader", "ramp/globalStorage",

    /* Util */
    "utils/util", "utils/tmplHelper", "utils/tmplUtil", "utils/array", "utils/dictionary"
],
    function (
        lang, Deferred,
        filter_manager_template,
        PopupManager, DataLoader, Theme, Map, LayerLoader, GlobalStorage,
        UtilMisc, TmplHelper, TmplUtil, UtilArray, UtilDict
    ) {
        "use strict";

        var rootNode = $("#searchMapSectionBody"),
            mainPopup,

            loadSteps = {
                loadServiceStep: {
                    typeUserSelected: false,
                    serviceType: null,
                    url: ""
                },

                loadFileStep: {
                    typeUserSelected: false,
                    fileType: null,
                    url: "",
                    file: null
                }
            },

            ESCAPE_DELIMITERS = ['|', '^'],
            CELL_DELIMITERS = [',', ';', '\t', '|', '^'],
            //LINE_DELIMITERS = ['\r\n', '\r', '\n'],

            symbologyPreset = {},

            /*hc = {
                layerAttributes: "*",
                minScale: 0,
                maxScale: 0,
                settings: {
                    panelEnabled: true,
                    opacity: {
                        enabled: true,
                        default: 0.7
                    },
                    visible: true,
                    boundingBoxVisible: false
                },
                datagrid: {
                    rowsPerPage: 50,
                    gridColumns: [

                    ]
                },
                templates: {
                    detail: "default_feature_details",
                    hover: "feature_hover_maptip_template",
                    anchor: "anchored_map_tip",
                    summary: "default_grid_summary_row"
                },
                id: "oilAreaOverlay",
                displayName: "CESI Oil Area Overlay",
                url: "http://maps-cartes.ec.gc.ca/ArcGIS/rest/services/RAMP_NRSTC/MapServer/0",
                symbology: {
                    type: "simple",
                    imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAbCAMAAAC6CgRnAAAAP1BMVEUAAAB0MjJ2RER4XFx7fHyERESLAACMjIySS0uWAACfW1uifHymp6e4mpq8vb3JmprP0NDSAADmAADxfHz+//91aGULAAAAFXRSTlP//////////////////////////wAr2X3qAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAARUlEQVQokWMQwQ0YRuXAgJ+RgYFZAKscF5ugkJAgBw8WOV5OITDg5sOUY4JICQmzYMqxQuWE2EnTh88+fO7E6z8MMBzkAGdaNvfnBzzpAAAAAElFTkSuQmCC"
                },
                layerExtent: {
                    xmin: -2566693.97839747,
                    ymin: -1104728.00466316,
                    xmax: 4021444.19787888,
                    ymax: 3657781.52035589,
                    spatialReference: {
                        wkid: 3978
                    }
                },
                isStatic: true
            },*/

            transitionDuration = 0.4;

        filter_manager_template = JSON.parse(TmplHelper.stringifyTemplate(filter_manager_template));

        PopupManager.registerPopup(rootNode, "click",
            function (d) {
                var step = this.handle.parents(".step:first"),
                    stepId = step.attr("id"),
                    group = this.handle.parents(".choice-group:first");//,
                //choiceId = group.data("choice-id");

                group
                    .find(".button-pressed")
                    .removeClass("button-pressed");

                loadSteps[stepId].setChoice(this.handle.data("option"));

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
                    stepId = step.attr("id"),

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
                                inputControlButtons = inputControlGroup.find(".input-group-btn:not(.browse-files)");
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
                                            .find(".btn-option:not(.btn-action), .browse-button")
                                            .attr("disabled", true)
                                            //.addClass("disabled")
                                            .end().find("input[type='file']").attr("disabled", true);

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

                                currentStepContent.on("click", "input[type='file']", function () {
                                    currentStepContent.off("click", "input[type='file']");

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
                                            .find(".btn-option:not(.btn-action), .browse-button")
                                            .attr("disabled", false)
                                            //.removeClass("disabled")
                                            .end().find("input[type='file']").attr("disabled", false);

                                        // disable all active options in the following steps
                                        optionsContainer
                                            .find(".active-option").removeClass("active-option")
                                            .end()
                                            .find(".button-pressed").removeClass("button-pressed");

                                        //loadUrlControlStatusCheck(inputControl);
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

                            .set(options, { left: 0 }, "advanceStart+=" + advanceStagger * (i))
                            //.set(options, { left: -optionsLeftShift }, "advanceStart+=" + advanceStagger * (i))
                            .set(options.find("> .active-option"), { display: "inline-block" }, "advanceStart+=" + advanceStagger * (i))
                            .set(options.find("> .step:not(.active-option)"), { display: "none" }, "advanceStart+=" + advanceStagger * (i))

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
                    var optionsLeftShift;

                    TweenLite.set(options.find("> .step"), { display: "inline-block" });
                    TweenLite.set(options, { left: -options.find("> .active-option").position().left });

                    optionsLeftShift = optionStepContent.length > 0 ? optionStepContent.position().left : -1;

                    if (optionsLeftShift !== -1 && optionsLeftShift !== options.position().left) {

                        tl
                            .addLabel("leftShiftStart")

                            .to(optionsBackground, transitionDuration, { height: optionStepContent.outerHeight(), ease: "easeOutCirc" }, "leftShiftStart" + leftShiftStartAdjustment)

                            .to(options, transitionDuration,
                                { left: -optionsLeftShift, ease: "easeOutCirc" }, "leftShiftStart" + leftShiftStartAdjustment)
                            .set(options.find("> .step"), { className: "-=active-option" }) // when shifting, active-option is changing
                            .set(option, { className: "+=active-option" })

                            .set(options, { left: 0 })
                            .set(options.find("> .step").not(option), { display: "none" })
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
                                url: loadSteps[stepId].getUrl()
                            });

                            promise.then(function (event) {
                                var serviceType = loadSteps[stepId].getServiceType(),
                                    optionStepContent,
                                    data = event;

                                option = options.find("> ." + serviceType + ":first");
                                optionStepContent = option.find("> .step-content");

                                switch (serviceType) {
                                    case "option-feature":
                                        setSelectOptions(
                                            optionStepContent.find("#featurePrimaryAttrlist"),
                                            { selectOne: "Select One" }
                                        );

                                        setSelectOptions(
                                            optionStepContent.find("#featureStyleAttrlist"),
                                            symbologyPreset
                                        );

                                        //setSelectOptions(
                                        //    optionStepContent.find("#featureColourAttrlist"),
                                        //    { selectOne: "Select One" }
                                        //);

                                        optionStepContent.find(".btn-add-dataset").on("click", function () {
                                            addDataset({
                                                data: data,
                                                primary: optionStepContent.find("#featurePrimaryAttrlist").val(),
                                                style: optionStepContent.find("#featureStyleAttrlist").val(),
                                                colour: optionStepContent.find("#featureColourAttrpicker").val()
                                            });
                                        });

                                        break;

                                    case "option-wms":
                                        setSelectOptions(
                                            optionStepContent.find("#wmsParserAttrlist"),
                                            { selectOne: "Select One" }
                                        );

                                        optionStepContent.find(".btn-add-dataset").on("click", function () {
                                            addDataset({
                                                data: data,
                                                parser: optionStepContent.find("#wmsParserAttrlist").val()
                                            });
                                        });

                                        break;
                                }

                                loadURLStep.successLoadUrlStep();

                                /*var fl;
                                hc.url = loadSteps[stepId].getUrl();
                                fl = Map.makeFeatureLayer(hc, true);
                                LayerLoader.loadLayer(fl);*/

                            }, function () {
                                loadURLStep.errorLoadUrlStep();
                            });

                            break;

                        case "fileOrURLcancel":
                            loadURLStep.init();
                            loadURLStep.cancelLoadUrlStep();

                            break;

                        case "fileOrURL":
                            loadURLStep.init();
                            loadURLStep.beforeLoadUrlStep();

                            promise = DataLoader.loadDataSet({
                                url: loadSteps[stepId].getFileUrl(),
                                file: loadSteps[stepId].getFile()
                            });

                            promise.then(function (event) {
                                var fileType = loadSteps[stepId].getFileType(),
                                    optionStepContent,
                                    data = event;

                                //console.log(event);
                                option = options.find("> ." + fileType + ":first");
                                optionStepContent = option.find("> .step-content");

                                switch (fileType) {
                                    case "option-geojson":
                                        setSelectOptions(
                                            optionStepContent.find("#geojsonPrimaryAttrlist"),
                                            { selectOne: "Select One" }
                                        );

                                        setSelectOptions(
                                            optionStepContent.find("#geojsonStyleAttrlist"),
                                            symbologyPreset
                                        );

                                        //setSelectOptions(
                                        //    optionStepContent.find("#geojsonColourAttrlist"),
                                        //    { selectOne: "Select One" }
                                        //);

                                        optionStepContent.find(".btn-add-dataset").on("click", function () {
                                            addDataset({
                                                data: data,
                                                primary: optionStepContent.find("#geojsonPrimaryAttrlist").val(),
                                                style: optionStepContent.find("#geojsonStyleAttrlist").val(),
                                                colour: optionStepContent.find("#geojsonColourAttrpicker").val()
                                            });
                                        });

                                        break;

                                    case "option-csv":
                                        var rows,
                                            delimiter = detectDelimiter(data, CELL_DELIMITERS),
                                            headers = {};

                                        rows = DataLoader.csvPeek(data, delimiter);

                                        rows[0].forEach(function (row) {
                                            headers[row] = row;
                                        });

                                        console.log(headers);

                                        setSelectOptions(
                                            optionStepContent.find("#csvPrimaryAttrlist"),
                                            headers
                                        );

                                        setSelectOptions(
                                            optionStepContent.find("#csvLatitudeAttrlist"),
                                            headers
                                        );

                                        setSelectOptions(
                                            optionStepContent.find("#csvLongitudeAttrlist"),
                                            headers
                                        );

                                        setSelectOptions(
                                            optionStepContent.find("#csvStyleAttrlist"),
                                            symbologyPreset
                                        );

                                        //setSelectOptions(
                                        //    optionStepContent.find("#csvColourAttrlist"),
                                        //    { selectOne: "Select One" }
                                        //);

                                        optionStepContent.find(".btn-add-dataset").on("click", function () {
                                            addCSVDataset({
                                                data: data,
                                                delimiter: delimiter,
                                                primary: optionStepContent.find("#geojsonPrimaryAttrlist").val(),
                                                lat: optionStepContent.find("#csvLatitudeAttrlist").val(),
                                                lon: optionStepContent.find("#csvLongitudeAttrlist").val(),
                                                style: optionStepContent.find("#geojsonStyleAttrlist").val(),
                                                colour: optionStepContent.find("#geojsonColourAttrpicker").val()
                                            });
                                        });

                                        break;

                                    case "option-shapefile":
                                        setSelectOptions(
                                            optionStepContent.find("#shapefilePrimaryAttrlist"),
                                            { selectOne: "Select One" }
                                        );

                                        setSelectOptions(
                                            optionStepContent.find("#shapefileStyleAttrlist"),
                                            symbologyPreset
                                        );

                                        //setSelectOptions(
                                        //    optionStepContent.find("#shapefileColourAttrlist"),
                                        //    { selectOne: "Select One" }
                                        //);

                                        optionStepContent.find(".btn-add-dataset").on("click", function () {
                                            addDataset({
                                                data: data,
                                                primary: optionStepContent.find("#shapefilePrimaryAttrlist").val(),
                                                style: optionStepContent.find("#shapefileStyleAttrlist").val(),
                                                colour: optionStepContent.find("#shapefileColourAttrpicker").val()
                                            });
                                        });

                                        break;
                                }

                                loadURLStep.successLoadUrlStep();
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

        function setSelectOptions(select, options) {
            select.empty(); // remove old options

            UtilDict.forEachEntry(options, function (key, value) {
                select
                    .append($("<option></option>")
                    .attr("value", key).text(value))
                ;
            });
        }

        function addDataset(obj) {
            console.log(obj);

            mainPopup.close();
        }

        //function addFeatureDataset(obj) {
        //    var promise;

        //}

        //function addWMSDataset(obj) {
        //    var promise;

        //}

        function addCSVDataset(obj) {
            var promise;

            promise = DataLoader.buildCsv(obj.data, {
                latfield: obj.lat,
                lonfield: obj.lon,
                delimiter: obj.delimiter
            });

            promise.then(function (event) {
                var fl = event;

                //fl = Map.makeFeatureLayer(hc, true);
                LayerLoader.loadLayer(fl);

                mainPopup.close();
            });
        }

        //function addGeoJSONDataset(obj) {
        //    var promise;

        //    promise = DataLoader.buildGeoJson(obj.data);

        //    promise.then(function (event) {
        //        var fl = event;

        //        //fl = Map.makeFeatureLayer(hc, true);
        //        LayerLoader.loadLayer(fl);

        //        mainPopup.close();
        //    });
        //}

        //function addShapefileDataset(obj) {
        //    var promise;

        //    promise = DataLoader.buildShapefile(obj.data);

        //    promise.then(function (event) {
        //        var fl = event;

        //        //fl = Map.makeFeatureLayer(hc, true);
        //        LayerLoader.loadLayer(fl);

        //        mainPopup.close();
        //    });
        //}

        function reset() {
            var section;

            tmpl.cache = {};
            tmpl.templates = filter_manager_template;

            section = tmpl('add_dataset_content_template', {});

            rootNode
                .find(".add-dataset-content")
                .replaceWith(section);

            UtilMisc.styleBrowseFilesButton(rootNode.find(".browse-files"));

            loadSteps.loadServiceStep = (function () {
                var step = rootNode.find("#loadServiceStep"),
                    stepContent = step.find(".step-content"),
                    choiceButtons = stepContent.find(".choice-group .btn-option"),

                    inputControl = stepContent.find("#serviceURLinput"),
                    submitButton = stepContent.find("#serviceURLinputSubmit"),

                    typeUserSelected = false,
                    serviceType = null,
                    serviceUrl = ""
                ;

                function checkStepStatus() {
                    if (serviceUrl !== "" && !serviceType && !typeUserSelected) {
                        if (serviceUrl.match(/ArcGIS\/rest\/services/ig)) {

                            choiceButtons
                                .removeClass("button-pressed")
                                .filter("button[data-option='option-feature']")
                                .addClass("button-pressed");

                            serviceType = "option-feature";

                        } else if (serviceUrl.match(/wms/ig)) {
                            console.log("Z: wms?");
                        }
                    }

                    submitButton.toggleClass("disabled", (!serviceType || serviceUrl === ""));
                    submitButton.attr("disabled", (!serviceType || serviceUrl === ""));

                    if (serviceUrl === "" && !typeUserSelected) {
                        serviceType = null;
                        choiceButtons
                            .removeClass("button-pressed");
                    }
                }

                inputControl.on("input", function (event) {
                    serviceUrl = $(event.target).val();
                    checkStepStatus();
                });

                return {
                    setChoice: function (value) {
                        serviceType = value;
                        typeUserSelected = true;

                        checkStepStatus();
                    },

                    getServiceType: function () {
                        return serviceType;
                    },

                    getUrl: function () {
                        return serviceUrl;
                    }
                };

            }());

            loadSteps.loadFileStep = (function () {
                var step = rootNode.find("#loadFileStep"),
                    stepContent = step.find(".step-content"),
                    choiceButtons = stepContent.find(".choice-group .btn-option"),

                    inputControl = stepContent.find("#fileOrURLinput"),
                    submitButton = stepContent.find("#fileOrURLinputSubmit"),

                    browsefiles = stepContent.find(".browse-files"),
                    browseControl = stepContent.find(".browse-files input[type='file']"),
                    pseudoBrowseControl = stepContent.find("#fileOrURLpseudoBrowse"),

                    typeUserSelected = false,
                    fileType = null,
                    file = null,
                    fileUrl = ""
                ;

                function checkStepStatus() {
                    var fileName = fileUrl || (file ? file.name : null) || "";

                    if (!typeUserSelected) {
                        if (fileName.endsWith(".csv")) {
                            fileType = "option-csv";

                            choiceButtons
                                .removeClass("button-pressed")
                                .filter("button[data-option='option-csv']")
                                .addClass("button-pressed");

                        } else if (fileName.endsWith(".json")) {
                            fileType = "option-geojson";

                            choiceButtons
                                .removeClass("button-pressed")
                                .filter("button[data-option='option-geojson']")
                                .addClass("button-pressed");

                        } else {
                            fileType = null;
                            choiceButtons
                                .removeClass("button-pressed");
                        }
                    }

                    submitButton.toggleClass("disabled", (!fileType || (!file && fileUrl === "")));
                    submitButton.attr("disabled", (!fileType || (!file && fileUrl === "")));

                    if (fileUrl === "" && !file && !typeUserSelected) {
                        fileType = null;
                        choiceButtons
                            .removeClass("button-pressed");
                    }
                }

                function resetFormElement(e) {
                    e.wrap('<form>').closest('form').get(0).reset();
                    e.unwrap();
                }

                inputControl.on("input", function (event) {
                    fileUrl = $(event.target).val();
                    file = null;
                    resetFormElement(browseControl);
                    pseudoBrowseControl.removeClass("selected");
                    checkStepStatus();
                });

                browseControl.on("change", function (event) {
                    file = event.target.files[0];
                    inputControl.val(file.name);
                    fileUrl = '';
                    pseudoBrowseControl.addClass("selected");
                    checkStepStatus();
                });

                if (!window.FileReader) {
                    browseControl.remove();
                    pseudoBrowseControl.attr("disabled", true);
                    browsefiles
                        .attr({
                            title: "You have IE9"
                        })
                        .addClass("_tooltip");
                    Theme.tooltipster(browsefiles.parent());
                }

                return {
                    setChoice: function (value) {
                        fileType = value;
                        typeUserSelected = true;

                        checkStepStatus();
                    },

                    getFileType: function () {
                        return fileType;
                    },

                    getFileUrl: function () {
                        return fileUrl;
                    },

                    getFile: function () {
                        return file;
                    }
                };

            }());
        }

        function getRandomColor() {
            var letters = '0123456789ABCDEF'.split(''),
                color = '';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }

        function detectDelimiter(string, delimiters) {
            var count = 0,
                detected;

            delimiters.forEach(function (delimiter) {
                var needle = delimiter,
                    matches;

                if (ESCAPE_DELIMITERS.indexOf(delimiter) !== -1) {
                    needle = '\\' + needle;
                }

                matches = string.match(new RegExp(needle, 'g'));
                if (matches && matches.length > count) {
                    count = matches.length;
                    detected = delimiter;
                }
            });

            console.log("Cell delimiter detected: ", (detected || delimiters[0]));

            return (detected || delimiters[0]);
        }

        return {
            init: function () {
                reset();

                rootNode.find("input.color").each(function (i, picker) {
                    picker = new jscolor.color(picker, {});
                    picker.fromString(getRandomColor());
                });

                mainPopup = PopupManager.registerPopup(rootNode.find("#addDatasetToggle"), "click",
                    function (d) {
                        TweenLite.to(this.target, transitionDuration / 2,
                            {
                                autoAlpha: 1, ease: "easeOutCirc",
                                onComplete: function () {
                                    this.target.focus();
                                }
                            });

                        d.resolve();
                    },
                    {
                        closeHandler: function (d) {
                            TweenLite.to(this.target, transitionDuration / 2, { autoAlpha: 0, ease: "easeInCirc" });

                            reset();
                            d.resolve();
                        },
                        target: rootNode.find("#add-dataset-section-container"),
                        activeClass: "button-pressed",
                        resetFocusOnClose: true
                    }
                );

                UtilDict.forEachEntry(GlobalStorage.DefaultRenderers,
                    function (key, value) {
                        symbologyPreset[key] = value.title;
                    }
                );
            }
        };
    });