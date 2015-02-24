/* global define, console, $, i18n, RAMP, t */

define([
    /* Dojo */
    "dojo/_base/lang", "dojo/Deferred",

    /* Text */
    "dojo/text!./templates/filter_manager_template.json",

    /* Ramp */

    "utils/PopupManager", "ramp/dataLoader", "ramp/theme", "ramp/map", "ramp/layerLoader", "ramp/globalStorage", "ramp/stepItem",

    /* Util */
    "utils/util", "utils/tmplHelper", "utils/tmplUtil", "utils/array", "utils/dictionary", "utils/bricks"
],
    function (
        lang, Deferred,
        filter_manager_template,
        PopupManager, DataLoader, Theme, RampMap, LayerLoader, GlobalStorage, StepItem,
        UtilMisc, TmplHelper, TmplUtil, UtilArray, UtilDict, Bricks
    ) {
        "use strict";

        var rootNode = $("#searchMapSectionBody"),

            symbologyPreset = {},

            //steps,
            choiceTree,
            choiceTreeCallbacks,
            stepLookup = {},

            transitionDuration = 0.4;

        console.log(rootNode, symbologyPreset, transitionDuration, RAMP, UtilDict);

        choiceTreeCallbacks = {
            simpleAdvance: function (step, data, options) {
                step.advance(data.selectedChoice, options);
            },

            simpleCancel: function (step, data) {
                console.log("Cancel click:", this, step, data);

                if (step.isCompleted()) {
                    step.retreat();
                } else {
                    step.clearStep();
                }
            },

            serviceTypeStepGuess: function (step, data) {
                var value = data.inputValue,
                    serviceTypeBrick = step.contentBricks.serviceType,
                    guess = "";

                // make a guess if it's a feature or wms server only if the user hasn't already selected the type
                if (!serviceTypeBrick.isUserSelected()) {

                    if (value.match(/ArcGIS\/rest\/services/ig)) {
                        guess = "featureServiceAttrStep";
                    } else if (value.match(/wms/ig)) {
                        guess = "wmsServiceAttrStep";
                    }

                    serviceTypeBrick.setChoice(guess);
                }
            },

            fileTypeStepGuess: function (step, data) {
                var fileName = data.inputValue,
                    serviceFileBrick = step.contentBricks.fileType,
                    guess = "";

                if (!serviceFileBrick.isUserSelected() && !serviceFileBrick.isUserEntered) {
                    if (fileName.endsWith(".csv")) {
                        guess = "csvFileAttrStep";
                    } else if (fileName.endsWith(".json")) {
                        guess = "geojsonFileAttrStep";
                    } else if (fileName.endsWith(".zip")) {
                        guess = "shapefileFileAttrStep";
                    }

                    serviceFileBrick.setChoice(guess);
                }
            }
        };

        choiceTree = {
            id: "sourceTypeStep",
            content: [
                {
                    id: "sourceType",
                    type: Bricks.ChoiceBrick,
                    config: {
                        header: "Data Source",
                        //instructions: "Halp!",
                        choices: [
                            {
                                key: "serviceTypeStep",
                                value: "Service"
                            },
                            {
                                key: "fileTypeStep",
                                value: "File"
                            }
                        ]
                    },
                    on: [
                            {
                                eventName: Bricks.ChoiceBrick.event.CHANGE,
                                expose: { as: "advance" },
                                callback: choiceTreeCallbacks.simpleAdvance
                            }
                    ]
                }
            ],
            children: [
                {
                    id: "serviceTypeStep",
                    content: [
                        {
                            id: "serviceURL",
                            type: Bricks.SimpleInputBrick,
                            config: {
                                header: "Service URL",
                                placeholder: "ESRI MapServer or Feature layer or WMS layer",
                                freezeStates: [Bricks.Brick.state.SUCCESS]
                            },
                            on: [
                                {
                                    eventName: Bricks.SimpleInputBrick.event.CHANGE,
                                    callback: choiceTreeCallbacks.serviceTypeStepGuess
                                }
                            ]
                        },
                        {
                            id: "serviceType",
                            type: Bricks.ChoiceBrick,
                            config: {
                                //template: "template_name", //optional, has a default
                                header: "Service Type",
                                choices: [
                                    {
                                        key: "featureServiceAttrStep",
                                        value: "Feature"
                                    },
                                    {
                                        key: "wmsServiceAttrStep",
                                        value: "WMS"
                                    }
                                ],
                                freezeStates: [Bricks.Brick.state.SUCCESS]
                            }
                        },
                        {
                            id: "serviceTypeOkCancel",
                            type: Bricks.OkCancelButtonBrick,
                            config: {
                                okLabel: "Connect",
                                okFreezeStates: [
                                    Bricks.Brick.state.SUCCESS,
                                    Bricks.Brick.state.ERROR
                                ],
                                cancelLabel: "Cancel",
                                //cancelFreezeStates: false,
                                reverseOrder: true,

                                required: [
                                    {
                                        id: Bricks.OkCancelButtonBrick.okButtonId,
                                        type: "all",
                                        check: ["serviceType", "serviceURL"]
                                    },
                                    {
                                        id: Bricks.OkCancelButtonBrick.cancelButtonId,
                                        type: "any",
                                        check: ["serviceType", "serviceURL"]
                                    }
                                ]
                            },
                            on: [
                                {
                                    eventName: Bricks.OkCancelButtonBrick.event.CLICK,
                                    callback: function (step, data) {
                                        console.log("Just Click:", this, step, data);
                                    }
                                },
                                {
                                    eventName: Bricks.OkCancelButtonBrick.event.OK_CLICK,
                                    expose: { as: "advance" }
                                },
                                {
                                    eventName: Bricks.OkCancelButtonBrick.event.CANCEL_CLICK,
                                    expose: { as: "retreat" },
                                    callback: choiceTreeCallbacks.simpleCancel
                                }

                            ]
                        }
                    ],
                    children: [
                        {
                            id: "featureServiceAttrStep",
                            content: [
                                {
                                    id: "primaryAttribute",
                                    type: Bricks.DropDownBrick,
                                    config: {
                                        header: "Primary Attribute"
                                    }
                                },
                                {
                                    id: "addDataset",
                                    type: Bricks.ButtonBrick,
                                    config: {
                                        label: "Add Dataset",
                                        containerClass: "button-brick-container-main",
                                        buttonClass: "btn-primary"
                                    }
                                }
                            ]
                        },
                        {
                            id: "wmsServiceAttrStep",
                            content: [
                                {
                                    id: "layerName",
                                    type: Bricks.DropDownBrick,
                                    config: {
                                        header: "Layer Name"
                                    }
                                },
                                {
                                    id: "addDataset",
                                    type: Bricks.ButtonBrick,
                                    config: {
                                        label: "Add Dataset",
                                        containerClass: "button-brick-container-main",
                                        buttonClass: "btn-primary"
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    id: "fileTypeStep",
                    content: [
                        {
                            id: "fileOrFileULR",
                            type: Bricks.FileInputBrick,
                            config: {
                                //template: "template_name", //optional, has a default
                                header: "File or URL",
                                //label: "Service URL", // optional, equals to header by default
                                placeholder: "Local file or URL",
                                freezeStates: [Bricks.Brick.state.SUCCESS]
                            },
                            on: [
                                {
                                    eventName: Bricks.FileInputBrick.event.CHANGE,
                                    callback: choiceTreeCallbacks.fileTypeStepGuess
                                }
                            ]
                        },
                        {
                            id: "fileType",
                            type: Bricks.ChoiceBrick,
                            config: {
                                //template: "template_name", //optional, has a default
                                header: "File Type",
                                choices: [
                                    {
                                        key: "geojsonFileAttrStep",
                                        value: "GeoJSON"
                                    },
                                    {
                                        key: "csvFileAttrStep",
                                        value: "CSV"
                                    },
                                    {
                                        key: "shapefileFileAttrStep",
                                        value: "Shapefile"
                                    }
                                ],
                                freezeStates: [Bricks.Brick.state.SUCCESS]
                            }
                        },
                        {
                            id: "fileTypeOkCancel",
                            type: Bricks.OkCancelButtonBrick,
                            config: {
                                okLabel: "Load",
                                okFreezeStates: [
                                    Bricks.Brick.state.SUCCESS,
                                    Bricks.Brick.state.ERROR
                                ],
                                cancelLabel: "Cancel",
                                reverseOrder: true,

                                required: [
                                    {
                                        id: Bricks.OkCancelButtonBrick.okButtonId,
                                        type: "all",
                                        check: ["fileType", "fileOrFileULR"]
                                    },
                                    {
                                        id: Bricks.OkCancelButtonBrick.cancelButtonId,
                                        type: "any",
                                        check: ["fileType", "fileOrFileULR"]
                                    }
                                ]
                            },
                            on: [
                                {
                                    eventName: Bricks.OkCancelButtonBrick.event.CLICK,
                                    callback: function (step, data) {
                                        console.log("Just Click:", this, step, data);
                                    }
                                },
                                {
                                    eventName: Bricks.OkCancelButtonBrick.event.OK_CLICK,
                                    expose: { as: "advance" },
                                    callback: function (step, data) {
                                        console.log("Ok click:", this, step, data);

                                        var stepData = step.getData(),
                                            fileType = stepData.fileType.selectedChoice,
                                            fileName = stepData.fileOrFileULR.inputValue;

                                        step.advance(fileType,
                                            {
                                                datasetName: {
                                                    inputValue: fileName
                                                }
                                            }
                                        );
                                    }
                                },
                                {
                                    eventName: Bricks.OkCancelButtonBrick.event.CANCEL_CLICK,
                                    expose: { as: "retreat" },
                                    callback: choiceTreeCallbacks.simpleCancel
                                }

                            ]
                        }
                    ],
                    children: [
                        {
                            id: "geojsonFileAttrStep",
                            content: [
                                {
                                    id: "datasetName",
                                    type: Bricks.SimpleInputBrick,
                                    config: {
                                        header: "Dataset Name"
                                    }
                                },
                                {
                                    id: "primaryAttribute",
                                    type: Bricks.DropDownBrick,
                                    config: {
                                        header: "Primary Attribute"
                                    }
                                },
                                {
                                    id: "color",
                                    type: Bricks.ColorPickerBrick,
                                    config: {
                                        header: "Colour"
                                    }
                                },
                                {
                                    id: "addDataset",
                                    type: Bricks.ButtonBrick,
                                    config: {
                                        label: "Add Dataset",
                                        containerClass: "button-brick-container-main",
                                        buttonClass: "btn-primary"
                                    }
                                }
                            ]
                        },
                        {
                            id: "csvFileAttrStep",
                            content: [
                                {
                                    id: "datasetName",
                                    type: Bricks.SimpleInputBrick,
                                    config: {
                                        header: "Dataset Name"
                                    }
                                },
                                {
                                    id: "primaryAttribute",
                                    type: Bricks.DropDownBrick,
                                    config: {
                                        header: "Primary Attribute"
                                    }
                                },
                                {
                                    id: "latLongAttribute",
                                    type: Bricks.MultiBrick,
                                    config: {
                                        //header: "Service URL", //optional, omitted if not specified
                                        content: [
                                            {
                                                id: "latitude",
                                                type: Bricks.DropDownBrick,
                                                config: {
                                                    header: "Latitude"
                                                }
                                            },
                                            {
                                                id: "longitude",
                                                type: Bricks.DropDownBrick,
                                                config: {
                                                    header: "Longitude"
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    id: "color",
                                    type: Bricks.ColorPickerBrick,
                                    config: {
                                        header: "Colour"
                                    }
                                },
                                {
                                    id: "addDataset",
                                    type: Bricks.ButtonBrick,
                                    config: {
                                        label: "Add Dataset",
                                        containerClass: "button-brick-container-main",
                                        buttonClass: "btn-primary"
                                    }
                                }
                            ]
                        },
                        {
                            id: "shapefileFileAttrStep",
                            content: [
                                {
                                    id: "datasetName",
                                    type: Bricks.SimpleInputBrick,
                                    config: {
                                        header: "Dataset Name"
                                    }
                                },
                                {
                                    id: "shapefilePrimaryAttribute",
                                    type: Bricks.DropDownBrick,
                                    config: {
                                        header: "Primary Attribute"
                                    }
                                },
                                {
                                    id: "color",
                                    type: Bricks.ColorPickerBrick,
                                    config: {
                                        header: "Colour"
                                    }
                                },
                                {
                                    id: "addDataset",
                                    type: Bricks.ButtonBrick,
                                    config: {
                                        label: "Add Dataset",
                                        containerClass: "button-brick-container-main",
                                        buttonClass: "btn-primary"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        function reset() {

            t.dfs(choiceTree, function (node, par/*, ctrl*/) {
                var stepItem,
                    level = par ? par.level + 1 : 1;

                node.level = level;
                stepItem = new StepItem(node);
                stepItem.on(StepItem.event.CURRENT_STEP_CHANGE, setCurrentStep);
                stepItem.on(StepItem.event.STATE_CHANGE, setStepState);

                node.stepItem = stepItem;
                stepLookup[node.id] = stepItem;

                if (par) {
                    par.stepItem.addChild(stepItem);
                }

                console.log(node);
            });

            rootNode
                .find(".add-dataset-content")
                .append(stepLookup.sourceTypeStep.node)
            ;

            stepLookup.sourceTypeStep.currentStep(1);

            stepLookup.serviceTypeStep.on("advance", function () {
                var promise,
                    data,
                    that = this,
                    stepData = this.getData(),
                    serviceTypeValue = stepData.serviceType.selectedChoice,
                    serviceUrlValue = stepData.serviceURL.inputValue;

                switch (serviceTypeValue) {
                    case "featureServiceAttrStep":
                        //get data from feature layer endpoint
                        promise = DataLoader.getFeatureLayer(serviceUrlValue);

                        promise.then(function (event) {
                            data = event;

                            choiceTreeCallbacks.simpleAdvance(that, stepData.serviceType);

                            ////get data from feature layer's legend endpoint
                            //var legendPromise = DataLoader.getFeatureLayerLegend(loadSteps[stepId].getUrl());
                            //legendPromise.then(function (legendLookup) {
                            //    data.legendLookup = legendLookup;

                            //    //event.fields.forEach(function (f) { fieldOptions[f.name] = f.name; });

                            //    setSelectOptions(
                            //        optionStepContent.find("#featurePrimaryAttrlist"),
                            //        data.fields
                            //    );

                            //    //setSelectOptions(
                            //    //    optionStepContent.find("#featureStyleAttrlist"),
                            //    //    symbologyPreset
                            //    //);

                            //    //setSelectOptions(
                            //    //    optionStepContent.find("#featureColourAttrlist"),
                            //    //    { selectOne: "Select One" }
                            //    //);

                            //    optionStepContent.find(".btn-add-dataset").on("click", function () {
                            //        addFeatureDataset({
                            //            data: data,
                            //            primary: optionStepContent.find("#featurePrimaryAttrlist").val()//,
                            //            //style: optionStepContent.find("#featureStyleAttrlist").val(),
                            //            //colour: optionStepContent.find("#featureColourAttrpicker").val()
                            //        });
                            //    });
                            //    loadURLStep.successLoadUrlStep();
                            //}, function () {
                            //    loadURLStep.errorLoadUrlStep();
                            //});
                        }, function (event) {
                            //setStepState(null, that, StepItem.state.ERROR);
                            that
                                ._notifyStateChange(StepItem.state.ERROR)
                                .displayBrickNotices({
                                    serviceURL: {
                                        type: "error",
                                        header: "I'm error",
                                        message: "more about this erorr"
                                    }
                                })
                            ;

                            console.log(event);
                            //loadURLStep.errorLoadUrlStep();
                        });
                        break;
                }

                /*step.advance(serviceType,
                    {
                        primaryAttribute: {
                            options: [
                                {
                                    value: "one",
                                    text: "One"
                                },
                                {
                                    value: "two",
                                    text: "Two"
                                }
                            ],
                            selectedOption: "two"
                        }
                    }
                );*/

                //choiceTreeCallbacks.simpleChoiceAdvance(step, serviceType.getData(), {});

            });
        }

        function setCurrentStep(event) {
            t.dfs(choiceTree, function (node) {
                node.stepItem.currentStep(event.level, event.id);
            });
        }

        function setStepState(event) {
            t.dfs(choiceTree, function (node) {
                node.stepItem.setState(event.level, event.id, event.state);
            });
        }

        return {
            init: function () {
                reset();

                UtilDict.forEachEntry(GlobalStorage.DefaultRenderers,
                    function (key) {
                        symbologyPreset[key] = i18n.t("presets.defaultRenderers." + key);
                        //symbologyPreset[key] = value.title;
                    }
                );
            }
        };
    });