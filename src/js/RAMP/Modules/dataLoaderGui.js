﻿/* global define, console, window, $, i18n, RAMP, t, TimelineLite */

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

            addDatasetToggle,
            addDatasetContainer,

            layerList,
            filterToggles,

            symbologyPreset = {},

            //steps,
            choiceTree,
            choiceTreeCallbacks,
            choiceTreeErrors,
            stepLookup = {},

            transitionDuration = 0.5,

            templates = JSON.parse(TmplHelper.stringifyTemplate(filter_manager_template));

        //console.log(rootNode, symbologyPreset, transitionDuration, RAMP, UtilDict);

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

        choiceTreeErrors = {
            base: {
                type: "error",
                header: "Cannot load",
                message: "You have IE9?"
            }
        };

        choiceTree = {
            // step for choosing between adding a service or a file
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
                            //expose: { as: "advance" },
                            callback: choiceTreeCallbacks.simpleAdvance
                        }
                    ]
                }
            ],
            children: [
                {
                    // step for choosing between feature and wms service and providing a service url
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
                                                // get data from feature layer endpoint
                                                promise = DataLoader.getFeatureLayer(serviceUrlValue);

                                                promise.then(function (data) {
                                                    // get data from feature layer's legend endpoint
                                                    var legendPromise = DataLoader.getFeatureLayerLegend(serviceUrlValue);
                                                    legendPromise.then(function (legendLookup) {
                                                        var fieldOptions;
                                                        window.clearTimeout(handle);

                                                        data.legendLookup = legendLookup;
                                                        // TODO: when field name aliases are available, change how the dropdown values are generated
                                                        fieldOptions = data.fields.map(function (field) { return { value: field, text: field }; });

                                                        // no fields available; likely this is not a Feature service
                                                        if (!fieldOptions || fieldOptions.length === 0) {
                                                            handleFailure(step, handle, {
                                                                serviceType:
                                                                    lang.mixin(choiceTreeErrors.base, {
                                                                        message: "Blah-blah"
                                                                    })
                                                            });
                                                        } else {

                                                            choiceTreeCallbacks.simpleAdvance(step, bricksData.serviceType, {
                                                                stepData: data,
                                                                bricksData: {
                                                                    primaryAttribute: {
                                                                        options: fieldOptions
                                                                    }
                                                                }
                                                            });
                                                        }

                                                    }, function (event) {
                                                        handleFailure(step, handle, {
                                                            serviceType:
                                                                lang.mixin(choiceTreeErrors.base, {
                                                                    message: "Blah-blah" + event.message
                                                                })
                                                        });
                                                    });

                                                }, function (event) {
                                                    // error connection to service
                                                    handleFailure(step, handle, {
                                                        serviceURL:
                                                            lang.mixin(choiceTreeErrors.base, {
                                                                message: "Blah-blah" + event.message
                                                            })
                                                    });
                                                });

                                                break;

                                            case "wmsServiceAttrStep":
                                                // get data from wms endpoint
                                                promise = DataLoader.getWmsLayerList(serviceUrlValue);

                                                promise.then(function (data) {
                                                    var layerOptions;
                                                    window.clearTimeout(handle);

                                                    // TODO: when field name aliases are available, change how the dropdown values are generated
                                                    layerOptions = data.layers.map(function (layer) { return { value: layer.name, text: layer.desc }; });

                                                    // no layer names available; likely this is not a WMS service
                                                    if (!layerOptions || layerOptions.length === 0) {
                                                        handleFailure(step, handle, {
                                                            serviceType:
                                                                lang.mixin(choiceTreeErrors.base, {
                                                                    message: "Blah-blah"
                                                                })
                                                        });
                                                    } else {

                                                        choiceTreeCallbacks.simpleAdvance(step, bricksData.serviceType, {
                                                            stepData: {
                                                                wmsData: data,
                                                                wmsUrl: serviceUrlValue
                                                            },
                                                            bricksData: {
                                                                layerName: {
                                                                    options: layerOptions
                                                                }
                                                            }
                                                        });
                                                    }

                                                }, function (event) {
                                                    handleFailure(step, handle, {
                                                        serviceType:
                                                            lang.mixin(choiceTreeErrors.base, {
                                                                message: "Blah-blah" + event.message
                                                            })
                                                    });
                                                });

                                                break;
                                        }
                                    }
                                    //expose: { as: "advance" }
                                },
                                {
                                    eventName: Bricks.OkCancelButtonBrick.event.CANCEL_CLICK,
                                    //expose: { as: "retreat" },
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
                                    },
                                    on: [
                                        {
                                            eventName: Bricks.ButtonBrick.event.CLICK,
                                            // add wms service layer to the map
                                            callback: function (step /*,data*/) {
                                                var data = step.getData(),
                                                    bricksData = data.bricksData,
                                                    stepData = data.stepData,

                                                    wmsLayerName = bricksData.layerName.dropDownValue,

                                                    wmsConfig,
                                                    layer,
                                                    wmsLayer;

                                                layer = UtilArray.find(stepData.wmsData.layers,
                                                    function (l) {
                                                        return l.name === wmsLayerName;
                                                    }
                                                );

                                                wmsConfig = {
                                                    id: LayerLoader.nextId(),
                                                    displayName: layer.desc,
                                                    format: "png",
                                                    layerName: wmsLayerName,
                                                    imageUrl: "assets/images/wms.png",
                                                    url: stepData.wmsUrl,
                                                    legendMimeType: "image/jpeg"
                                                };

                                                if (layer.queryable) {
                                                    wmsConfig.featureInfo = {
                                                        parser: "stringParse",
                                                        mimeType: "text/plain"
                                                    };
                                                }

                                                wmsConfig = GlobalStorage.applyWMSDefaults(wmsConfig);

                                                wmsLayer = RampMap.makeWmsLayer(wmsConfig, true);
                                                RAMP.config.layers.wms.push(wmsConfig);

                                                LayerLoader.loadLayer(wmsLayer);
                                            }
                                            //expose: { as: "ADD_DATASET" }
                                        }
                                    ]
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
                                /*{
                                    eventName: Bricks.OkCancelButtonBrick.event.CLICK,
                                    callback: function (step, data) {
                                        console.log("Just Click:", this, step, data);
                                    }
                                },*/
                                {
                                    eventName: Bricks.OkCancelButtonBrick.event.OK_CLICK,
                                    // load and process files
                                    callback: function (step/*, data*/) {
                                        var promise,
                                            handle = delayLoadingState(step, 100),
                                            bricksData = step.getData().bricksData,
                                            fileTypeValue = bricksData.fileType.selectedChoice,
                                            fileValue = bricksData.fileOrFileULR.fileValue,
                                            fileUrlValue = bricksData.fileOrFileULR.inputValue,
                                            fileName = bricksData.fileOrFileULR.fileName;

                                        promise = DataLoader.loadDataSet({
                                            url: fileValue ? null : fileUrlValue,
                                            file: fileValue,
                                            type: fileTypeValue === "shapefileFileAttrStep" ? "binary" : "text"
                                        });

                                        promise.then(function (data) {
                                            switch (fileTypeValue) {
                                                case "geojsonFileAttrStep":
                                                    var geojsonPromise = DataLoader.buildGeoJson(data);

                                                    geojsonPromise.then(function (featureLayer) {
                                                        var fieldOptions;
                                                        window.clearTimeout(handle);

                                                        // TODO: when field name aliases are available, change how the dropdown values are generated
                                                        fieldOptions = featureLayer.fields.map(function (field) { return { value: field.name, text: field.name }; });

                                                        // no layer names available; likely this is not a geojson file
                                                        if (!fieldOptions || fieldOptions.length === 0) {
                                                            handleFailure(step, handle, {
                                                                fileType:
                                                                    lang.mixin(choiceTreeErrors.base, {
                                                                        message: "Not a geojson file"
                                                                    })
                                                            });
                                                        } else {

                                                            choiceTreeCallbacks.simpleAdvance(step, bricksData.fileType, {
                                                                stepData: featureLayer,
                                                                bricksData: {
                                                                    datasetName: {
                                                                        inputValue: fileName
                                                                    },
                                                                    primaryAttribute: {
                                                                        options: fieldOptions
                                                                    }
                                                                }
                                                            });
                                                        }

                                                    }, function (event) {
                                                        //error building geojson
                                                        handleFailure(step, handle, {
                                                            fileType:
                                                                lang.mixin(choiceTreeErrors.base, {
                                                                    message: "Cannot build, not a geojson" + event.message
                                                                })
                                                        });
                                                    });

                                                    break;

                                                case "csvFileAttrStep":
                                                    var rows,
                                                        delimiter = UtilMisc.detectDelimiter(data),

                                                        guess,
                                                        primaryAttribute,
                                                        headers;

                                                    window.clearTimeout(handle);

                                                    rows = DataLoader.csvPeek(data, delimiter);
                                                    headers = rows[0].map(function (header) { return { value: header, text: header }; });

                                                    // no properties names available; likely this is not a csv file
                                                    if (!headers || headers.length === 0) {
                                                        handleFailure(step, handle, {
                                                            fileType:
                                                                lang.mixin(choiceTreeErrors.base, {
                                                                    message: "Not a geojson file"
                                                                })
                                                        });
                                                    } else if (!rows || rows.length < 2) {
                                                        handleFailure(step, handle, {
                                                            fileType:
                                                                lang.mixin(choiceTreeErrors.base, {
                                                                    message: "No data in the file; maybe not CSV?"
                                                                })
                                                        });
                                                    } else {

                                                        guess = guessLatLong(rows);

                                                        // preselect primary attribute so it's not one of the lat or long guesses;
                                                        // if csv has only two fields (lat, long), select the first as primary
                                                        primaryAttribute = rows[0].filter(function (header) {
                                                            return header !== guess.lat && header !== guess.long;
                                                        })[0] || rows[0][0];

                                                        // TODO: if you can't detect lat or long make the user choose them, don't just select the first header from the list, maybe.
                                                        choiceTreeCallbacks.simpleAdvance(step, bricksData.fileType, {
                                                            stepData: {
                                                                csvData: data,
                                                                csvHeaders: rows[0],
                                                                csvDelimeter: delimiter
                                                            },
                                                            bricksData: {
                                                                datasetName: {
                                                                    inputValue: fileName
                                                                },
                                                                primaryAttribute: {
                                                                    options: headers,
                                                                    selectedOption: primaryAttribute
                                                                },
                                                                latitude: {
                                                                    options: headers,
                                                                    selectedOption: guess.lat
                                                                },
                                                                longitude: {
                                                                    options: headers,
                                                                    selectedOption: guess.long
                                                                }
                                                            }
                                                        });
                                                    }

                                                    break;

                                                case "shapefileFileAttrStep":
                                                    var shapefilePromise = DataLoader.buildShapefile(data);

                                                    shapefilePromise.then(function (featureLayer) {
                                                        var fieldOptions;

                                                        window.clearTimeout(handle);

                                                        // TODO: when field name aliases are available, change how the dropdown values are generated
                                                        fieldOptions = featureLayer.fields.map(function (field) { return { value: field.name, text: field.name }; });

                                                        // no layer names available; likely this is not a geojson file
                                                        if (!fieldOptions || fieldOptions.length === 0) {
                                                            handleFailure(step, handle, {
                                                                fileType:
                                                                    lang.mixin(choiceTreeErrors.base, {
                                                                        message: "Not a shapefile file"
                                                                    })
                                                            });
                                                        } else {

                                                            choiceTreeCallbacks.simpleAdvance(step, bricksData.fileType, {
                                                                stepData: featureLayer,
                                                                bricksData: {
                                                                    datasetName: {
                                                                        inputValue: fileName
                                                                    },
                                                                    primaryAttribute: {
                                                                        options: fieldOptions
                                                                    }
                                                                }
                                                            });
                                                        }

                                                    }, function (event) {
                                                        // error to build shapefiles
                                                        handleFailure(step, handle, {
                                                            fileType:
                                                                lang.mixin(choiceTreeErrors.base, {
                                                                    message: "Cannot build, not a shapefile" + event.message
                                                                })
                                                        });
                                                    });

                                                    break;
                                            }

                                        }, function (event) {
                                            //error loading file
                                            handleFailure(step, handle, {
                                                fileOrFileULR:
                                                    lang.mixin(choiceTreeErrors.base, {
                                                        message: "Cannot load file" + event.message
                                                    })
                                            });
                                        });
                                    }
                                    //expose: { as: "advance" },
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
                                    },
                                    on: [
                                        {
                                            eventName: Bricks.ButtonBrick.event.CLICK,
                                            // add wms service layer to the map
                                            callback: function (step /*,data*/) {
                                                var data = step.getData(),
                                                    bricksData = data.bricksData,
                                                    featureLayer = data.stepData,

                                                    iconTemplate = makeIconTemplate("a_d_icon_" + featureLayer.renderer._RAMP_rendererType, bricksData.color.hex);

                                                DataLoader.enhanceFileFeatureLayer(featureLayer, {
                                                    //renderer: obj.style,
                                                    colour: [
                                                        bricksData.color.rgb_[0],
                                                        bricksData.color.rgb_[1],
                                                        bricksData.color.rgb_[2],
                                                        255
                                                    ],
                                                    nameField: bricksData.primaryAttribute.dropDownValue,
                                                    icon: iconTemplate,
                                                    datasetName: bricksData.datasetName.inputValue
                                                });

                                                LayerLoader.loadLayer(featureLayer);
                                            }
                                        }
                                    ]
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
                                    },
                                    on: [
                                        {
                                            eventName: Bricks.ButtonBrick.event.CLICK,
                                            // add wms service layer to the map
                                            callback: function (step /*,data*/) {
                                                var data = step.getData(),
                                                    bricksData = data.bricksData,
                                                    stepData = data.stepData,

                                                    csvData = stepData.csvData,
                                                    csvHeaders = stepData.csvHeaders,
                                                    csvDelimeter = stepData.csvDelimeter,

                                                    featureLayer,
                                                    iconTemplate = makeIconTemplate('a_d_icon_circlePoint', bricksData.color.hex),

                                                    promise;

                                                promise = DataLoader.buildCsv(csvData, {
                                                    latfield: bricksData.latitude.dropDownValue,
                                                    lonfield: bricksData.longitude.dropDownValue,
                                                    delimiter: csvDelimeter,

                                                    fields: csvHeaders
                                                });

                                                promise.then(function (event) {
                                                    featureLayer = event;

                                                    DataLoader.enhanceFileFeatureLayer(featureLayer, {
                                                        renderer: "circlePoint",
                                                        colour: [
                                                            bricksData.color.rgb_[0],
                                                            bricksData.color.rgb_[1],
                                                            bricksData.color.rgb_[2],
                                                            255
                                                        ],
                                                        nameField: bricksData.primaryAttribute.dropDownValue,
                                                        icon: iconTemplate,
                                                        datasetName: bricksData.datasetName.inputValue,
                                                        fields: csvHeaders
                                                    });

                                                    //TODO: set symbology and colour on feature layer (obj.data)
                                                    LayerLoader.loadLayer(featureLayer);

                                                }, function () {
                                                    // can't construct csv
                                                    handleFailure(step, null, {
                                                        datasetName:
                                                            lang.mixin(choiceTreeErrors.base, {
                                                                message: "Cannot create CSV feature lyer, probably not a valid csv"
                                                            })
                                                    });
                                                });
                                            }
                                        }
                                    ]
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
                                    },
                                    on: [
                                        {
                                            eventName: Bricks.ButtonBrick.event.CLICK,
                                            // add wms service layer to the map
                                            callback: function (step /*,data*/) {
                                                var data = step.getData(),
                                                    bricksData = data.bricksData,
                                                    featureLayer = data.stepData,

                                                    iconTemplate = makeIconTemplate('a_d_icon_' + featureLayer.renderer._RAMP_rendererType, bricksData.color.hex);

                                                DataLoader.enhanceFileFeatureLayer(featureLayer, {
                                                    //renderer: obj.style,
                                                    colour: [
                                                        bricksData.color.rgb_[0],
                                                        bricksData.color.rgb_[1],
                                                        bricksData.color.rgb_[2],
                                                        255
                                                    ],
                                                    nameField: bricksData.primaryAttribute.dropDownValue,
                                                    icon: iconTemplate,
                                                    datasetName: bricksData.datasetName.inputValue
                                                });

                                                LayerLoader.loadLayer(featureLayer);
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        function createChoiceTree() {

            // clear steps
            t.dfs(choiceTree, function (node) {
                node.stepItem = null;
            });

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
                .empty()
                .append(stepLookup.sourceTypeStep.node)
            ;

            // set the first step as active
            stepLookup.sourceTypeStep.currentStep(1);
        }

        function guessLatLong(rows) {
            // try guessing lat and long columns
            var latRegex = new RegExp(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/i),
                longRegex = new RegExp(/^[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/i),

                guessesLat,
                guessesLong,

                guessedLatHeader,
                guessedLongHeader;

            // first filter out all columns that are not lat
            guessesLat = rows[0].filter(function (header, i) {
                return rows.every(function (row, rowi) {
                    return rowi === 0 || latRegex.test(row[i]);
                });
            });

            // filter out all columns that are not long for sure
            guessesLong = rows[0].filter(function (header, i) {
                return rows.every(function (row, rowi) {
                    return rowi === 0 || longRegex.test(row[i]);
                });
            });

            // console.log(guessesLat);
            // console.log(guessesLong);

            // if there more than one lat guesses
            if (guessesLat.length > 1) {
                // filter out ones that don't have "la" or "y" in header name
                guessesLat = guessesLat.filter(function (header) {
                    var h = header.toLowerCase();

                    return h.indexOf('la') !== -1 || h.indexOf('y') !== -1;
                });
            }

            // console.log(guessesLat);
            // pick the first lat guess or null
            guessedLatHeader = guessesLat[0] || null;

            // if there more than one long guesses
            if (guessesLong.length > 1) {
                // first, remove lat guess from long options in case they overlap
                UtilArray.remove(guessesLong, guessedLatHeader);

                // filter out ones that don't have "lo" or "x" in header name
                guessesLong = guessesLong.filter(function (header) {
                    var h = header.toLowerCase();

                    return h.indexOf('lo') !== -1 || h.indexOf('x') !== -1;
                });
            }

            // console.log(guessesLong);
            // pick the first long guess or null
            guessedLongHeader = guessesLong[0] || null;

            return {
                lat: guessedLatHeader,
                long: guessedLongHeader
            };
        }

        /**
         * 
         * @method makeIconTemplate
         * @param {String} templateName a name of the template to use for an icon
         * @param {String} hex color value in hex
         * @return {String} a base64 encoded icon template
         */
        function makeIconTemplate(templateName, hex) {
            /*jshint validthis: true */
            return "data:image/svg+xml;base64," +
                UtilMisc.b64EncodeUnicode(
                    TmplHelper.template.call(this, templateName, {
                        colour: hex
                    }, templates)
                );
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

        function handleFailure(step, handle, brickNotices) {
            if (handle) {
                window.clearTimeout(handle);
            }

            step
                ._notifyStateChange(StepItem.state.ERROR)
                .displayBrickNotices(brickNotices)
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

        function closeChoiceTree() {
            stepLookup.sourceTypeStep.retreat();
        }

        return {
            init: function () {
                var tl = new TimelineLite({ paused: true });

                addDatasetToggle = rootNode.find("#addDatasetToggle");
                addDatasetContainer = rootNode.find("#add-dataset-section-container");

                layerList = rootNode.find("#layerList");
                filterToggles = rootNode.find("#filterGlobalToggles");

                createChoiceTree();
                tl
                    .set(addDatasetContainer, { display: "block" })

                    .set(layerList, { className: "+=scroll" }, 0.01)
                    .set(filterToggles, { className: "+=scroll" }, 0.01)

                    .to(filterToggles, transitionDuration, { top: -60, ease: "easeOutCirc" })
                    .to(layerList, transitionDuration, { top: layerList.height() / 3, autoAlpha: 0, ease: "easeOutCirc" }, 0)
                ;

                PopupManager.registerPopup(addDatasetToggle, "click",
                    function (d) {                        
                        createChoiceTree();

                        tl
                            .eventCallback("onComplete", function () {
                                addDatasetContainer.find(":focusable:first").focus();
                                d.resolve();
                            })
                           .play()
                        ;
                    },
                    {
                        closeHandler: function (d) {
                            closeChoiceTree();

                            tl
                                .eventCallback("onReverseComplete", function () {
                                    d.resolve();
                                })
                               .reverse()
                            ;
                        },
                        target: addDatasetContainer,
                        activeClass: "button-pressed",
                        resetFocusOnClose: true
                    }
                );

                UtilDict.forEachEntry(GlobalStorage.DefaultRenderers,
                    function (key) {
                        symbologyPreset[key] = i18n.t("presets.defaultRenderers." + key);
                        //symbologyPreset[key] = value.title;
                    }
                );
            }
        };
    });