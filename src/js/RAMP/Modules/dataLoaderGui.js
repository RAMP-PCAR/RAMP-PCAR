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
            stepLookup = {},

            transitionDuration = 0.4;

        console.log(rootNode, symbologyPreset, transitionDuration, RAMP, UtilDict);

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
                                callback: function (step, data) {
                                    step.advance(data.selectedChoice);
                                }
                            }
                    ]
                }
            ],
            children: [
                {
                    id: "serviceTypeStep",
                    content: [
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
                            id: "serviceURL",
                            type: Bricks.SimpleInputBrick,
                            config: {
                                //template: "template_name", //optional, has a default
                                header: "Service URL",
                                //label: "Service URL", // optional, equals to header by default
                                placeholder: "ESRI MapServer or Feature layer or WMS layer",
                                freezeStates: [Bricks.Brick.state.SUCCESS]
                            },
                            on: [
                                {
                                    eventName: Bricks.SimpleInputBrick.event.CHANGE,
                                    callback: function (step, data) {
                                        var value = data.inputValue,
                                            serviceTypeBrick = step.contentBricks.serviceType,
                                            guess = "";

                                        // make a guess if it's a feature or wms server only if the user hasn't already selected the type
                                        if (!serviceTypeBrick.isUserSelected()) {

                                            if (value.match(/ArcGIS\/rest\/services/ig)) {
                                                guess = "feature";
                                            } else if (value.match(/wms/ig)) {
                                                guess = "wms";
                                            }
                                            serviceTypeBrick.setChoice(guess);
                                        }
                                    }
                                }
                            ]
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
                                    expose: { as: "advance" },
                                    callback: function (step, data) {
                                        
                                        console.log("Ok click:", this, step, data);

                                        step.advance(step.getData().serviceType.selectedChoice);

                                    }
                                },
                                {
                                    eventName: Bricks.OkCancelButtonBrick.event.CANCEL_CLICK,
                                    expose: { as: "retreat" },
                                    callback: function (step, data) {

                                        console.log("Cancel click:", this, step, data);

                                        if (step.isCompleted()) {
                                            step.retreat();
                                        } else {
                                            step.clearStep();
                                            //step.clearStep(["serviceType", "serviceURL"]);
                                        }
                                    }
                                }

                            ]
                        }
                    ],
                    children: [
                        {
                            id: "featureServiceAttrStep",
                            content: [
                                {
                                    id: "primaryFeatureAttribute",
                                    type: Bricks.DropDownBrick,
                                    config: {
                                        header: "Primary Attribute"
                                    }
                                },
                                {
                                    id: "addFeatureDataset",
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
                            id: "fileType",
                            type: Bricks.ChoiceBrick,
                            config: {
                                //template: "template_name", //optional, has a default
                                header: "File Type",
                                choices: [
                                    {
                                        key: "feature",
                                        value: "GeoJSON"
                                    },
                                    {
                                        key: "wms",
                                        value: "CSV"
                                    },
                                    {
                                        key: "shapefile",
                                        value: "Shapefile"
                                    }
                                ]
                            }
                        },
                        {
                            id: "fileOrFileULR",
                            type: Bricks.FileInputBrick,
                            config: {
                                //template: "template_name", //optional, has a default
                                header: "File or URL",
                                //label: "Service URL", // optional, equals to header by default
                                placeholder: "Local file or URL"
                            },
                            on: [
                                {
                                    eventName: Bricks.FileInputBrick.event.CHANGE,
                                    callback: function (step, data) {
                                        console.log(this.id, this.isValid(), data);
                                    }
                                }
                            ]
                        },
                        {
                            id: "fileTypeOkCancel",
                            type: Bricks.OkCancelButtonBrick,
                            config: {
                                okLabel: "Load",
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
                                    }
                                },
                                {
                                    eventName: Bricks.OkCancelButtonBrick.event.CANCEL_CLICK,
                                    expose: { as: "retreat" },
                                    callback: function (step, data) {
                                        console.log("Cancel click:", this, step, data);

                                        if (step.state === "completed") {
                                            step.retreat();
                                        } else {
                                            step.clearStep();
                                        }
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