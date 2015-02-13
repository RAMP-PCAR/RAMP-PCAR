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
                        choices: [
                            {
                                key: "service",
                                value: "Service"
                            },
                            {
                                key: "file",
                                value: "File"
                            }
                        ]
                    }
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
                                        key: "feature",
                                        value: "Feature"
                                    },
                                    {
                                        key: "wms",
                                        value: "WMS"
                                    }
                                ]
                            }
                        },
                        {
                            id: "serviceURL",
                            type: Bricks.SimpleInputBrick,
                            config: {
                                //template: "template_name", //optional, has a default
                                header: "Service URL",
                                //label: "Service URL", // optional, equals to header by default
                                placeholder: "ESRI MapServer or Feature layer or WMS layer"
                            },
                            on: [
                                {
                                    eventName: "change",
                                    callback: function (step, data) {
                                        var value = data.inputValue,
                                            serviceTypeBrick = step.contentBricks.serviceType,
                                            guess = "";

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
                        }
                    ]
                }
            ]
        };

        //choiceTree = {
        //    id: "sourceTypeStep",
        //    content: "dfsf",
        //    children: [
        //        {

        //            id: "serviceTypeStep"
        //        },
        //        {
        //            id: "fileTypeStep"
        //        }
        //    ]
        //};

        function reset() {

            t.dfs(choiceTree, function (node, par/*, ctrl*/) {
                var stepItem,
                    level = par ? par.level + 1 : 1;

                node.level = level;
                stepItem = new StepItem(node);
                stepItem.on("curentStep", resetCurrentStep);

                node.stepItem = stepItem;

                if (par) {
                    par.stepItem.addChild(stepItem);
                }

                console.log(node);
            });

            rootNode
                    .find(".add-dataset-content")
                    .append(choiceTree.stepItem.node)
            ;

            getStep("sourceTypeStep").stepItem.currentStep(true);

            //var tree = new TreeModel(),
            //    root;

            //root = tree.parse(choiceTree);

            //root.walk(function (node) {
            //    console.log(node.parent);

            //    // Halt the traversal by returning false
            //    //if (node.model.id === 121) return false;
            //});
        }

        function resetCurrentStep(event) {
            t.dfs(choiceTree, function (node) {
                if (node.id !== event.id) {
                    node.stepItem.currentStep(false);
                }
            });
        }

        function getStep(stepId) {
            return t.find(choiceTree, function (node) {
                return node.id === stepId;
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