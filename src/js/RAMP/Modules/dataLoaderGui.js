/* global define, console, window, $, i18n, RAMP, t */

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
            simpleAdvance: function (step, data, targetChildData) {
                step.advance(data.selectedChoice, targetChildData);
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
                                /*{
                                    eventName: Bricks.OkCancelButtonBrick.event.CLICK,
                                    callback: function (step, data) {
                                        console.log("Just Click:", this, step, data);
                                    }
                                },*/
                                {
                                    eventName: Bricks.OkCancelButtonBrick.event.OK_CLICK,
                                    // connect to feature service
                                    callback: function (step/*, data*/) {
                                        var promise,
                                            handle = delayLoadingState(step, 100),
                                            bricksData = step.getData().bricksData,
                                            serviceTypeValue = bricksData.serviceType.selectedChoice,
                                            serviceUrlValue = bricksData.serviceURL.inputValue;

                                        switch (serviceTypeValue) {
                                            case "featureServiceAttrStep":
                                                //get data from feature layer endpoint
                                                promise = DataLoader.getFeatureLayer(serviceUrlValue);

                                                promise.then(function (data) {
                                                    //get data from feature layer's legend endpoint
                                                    var legendPromise = DataLoader.getFeatureLayerLegend(serviceUrlValue);
                                                    legendPromise.then(function (legendLookup) {
                                                        window.clearTimeout(handle);

                                                        data.legendLookup = legendLookup;

                                                        choiceTreeCallbacks.simpleAdvance(step, bricksData.serviceType, {
                                                            stepData: data,
                                                            bricksData: {
                                                                primaryAttribute: {
                                                                    // TODO: when field name aliases are available, change how the dropdown values are generated
                                                                    options: data.fields.map(function (field) { return { value: field, text: field }; })
                                                                }
                                                            }
                                                        });

                                                    }, function (event) {
                                                        handleFailure(step, event, handle);
                                                    });

                                                }, function (event) {
                                                    handleFailure(step, event, handle);
                                                });
                                                break;
                                        }
                                    }
                                    //expose: { as: "advance" }
                                }/*,
                                {
                                    eventName: Bricks.OkCancelButtonBrick.event.CANCEL_CLICK,
                                    expose: { as: "retreat" },
                                    callback: choiceTreeCallbacks.simpleCancel
                                }*/

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
                                    },
                                    on: [
                                        {
                                            eventName: Bricks.ButtonBrick.event.CLICK,
                                            // add feature service layer to the map
                                            callback: function (step /*,data*/) {
                                                var data = step.getData(),
                                                    bricksData = data.bricksData,
                                                    layerData = data.stepData,

                                                    newConfig = { //make feature layer config.
                                                        id: LayerLoader.nextId(),
                                                        displayName: layerData.layerName,
                                                        nameField: bricksData.primaryAttribute.dropDownValue,
                                                        datagrid: DataLoader.createDatagridConfig(layerData.fields),
                                                        symbology: DataLoader.createSymbologyConfig(layerData.renderer, layerData.legendLookup),
                                                        url: layerData.layerUrl
                                                    },
                                                    featureLayer;

                                                //TODO: set symbology and colour on feature layer (obj.data)
                                                newConfig = GlobalStorage.applyFeatureDefaults(newConfig);

                                                //make layer
                                                featureLayer = RampMap.makeFeatureLayer(newConfig, true);
                                                RAMP.config.layers.feature.push(newConfig);

                                                LayerLoader.loadLayer(featureLayer);

                                                //mainPopup.close();
                                            }
                                            //expose: { as: "ADD_DATASET" }
                                        }
                                    ]
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

            // create the choice tree
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

            // append tree to the page
            rootNode
                .find(".add-dataset-content")
                .append(stepLookup.sourceTypeStep.node)
            ;

            // set the first step as active
            stepLookup.sourceTypeStep.currentStep(1);           
        }

        /**
         * Delay setting loading state to the step for a specified time in case it happens really fast and 
         * 
         * @method delayLoadingState
         * @param {StepItem} step step to delay setting loading state on
         * @param {Number} time a delay in ms
         * @private
         * @return {Number} setTimeout handle
         */
        function delayLoadingState(step, time) {
            return window.setTimeout(function () {
                step._notifyStateChange(StepItem.state.LOADING);
            }, time);
        }

        function handleFailure(step, event, handle) {
            window.clearTimeout(handle);

            step
                ._notifyStateChange(StepItem.state.ERROR)
                .displayBrickNotices({
                    serviceURL: {
                        type: "error",
                        header: "Cannot load",
                        message: event.message
                    }
                })
            ;
        }

        function setCurrentStep(event) {
            t.dfs(choiceTree, function (node) {
                node.stepItem.currentStep(event.level, event.id);
            });
        }

        function setStepState(event, step, state) {
            if (step && state) {
                event = {
                    id: step.id,
                    level: step.level,
                    state: state
                };
            }

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