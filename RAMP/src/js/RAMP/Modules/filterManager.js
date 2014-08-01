/*global define, window, tmpl */

/**
* FilterManager submodule
*
* @module RAMP
* @submodule FilterManager
* @main FilterManager
*/

/**
* FilterManager class. Represents the legend next to the map and the controls to toggle each map layer's visibility and boundary box.
* The FilterManager also includes a attribute filter that allows the user to hide map features based on a attribute values
*
* For a doc with diagrams on how this class works, please see
* http://ecollab.ncr.int.ec.gc.ca/projects/science-apps/priv/RAMP/RAMP%20AMD%20Filter%20Module.docx
*
* @class FilterManager
* @static
* @uses dojo/_base/declare
* @uses dojo/_base/lang
* @uses dojo/query
* @uses dojo/_base/array
* @uses dojo/dom
* @uses dojo/on
* @uses dojo/dom-class
* @uses dojo/dom-style
* @uses dojo/dom-construct
* @uses dojo/_base/connect
* @uses dojo/Deferred
* @uses dojo/topic
* @uses dojo/aspect
* @uses dojo/promise/all
* @uses templates/filter_manager_template.json
* @uses esri/tasks/query
* @uses esri/layers/FeatureLayer
* @uses RAMP
* @uses GlobalStorage
* @uses Map
* @uses EventManager
* @uese Theme
* @uese TmplHelper
* @uses Util
* @uses Array
* @uses Dictionary
* @uses PopupManager
* @uses Checkbox
* @uses CheckboxGroup
*/

define([
/* Dojo */
        "dojo/_base/declare", "dojo/_base/lang", "dojo/query", "dojo/_base/array", "dojo/on", "dojo/dom", "dojo/dom-class",
        "dojo/dom-style", "dojo/dom-construct", "dojo/_base/connect", "dojo/Deferred", "dojo/topic",
        "dojo/aspect", "dojo/promise/all",
/* Text */
        "dojo/text!./templates/filter_manager_template.json",
        "dojo/text!./templates/filter_wms_meta_Template.html",

/* Esri */
        "esri/tasks/query", "esri/layers/FeatureLayer",

/* Ramp */
        "ramp/ramp", "ramp/globalStorage", "ramp/map", "ramp/eventManager", "themes/theme",

/* Util */
        "utils/tmplHelper", "utils/util", "utils/array", "utils/dictionary", "utils/popupManager", "utils/checkbox", "utils/checkboxGroup"],

    function (
    /* Dojo */
        declare, lang, query, dojoArray, on, dom, domClass, domStyle, domConstruct,
        connect, Deferred, topic, aspect, all,
    /* Text */
        filter_manager_template_json,
        filter_wms_meta_Template,

    /* Esri */
        EsriQuery, FeatureLayer,

    /* Ramp */
        Ramp, GlobalStorage, RampMap, EventManager, Theme,

    /* Util */
        TmplHelper, UtilMisc, UtilArray, UtilDict, PopupManager, Checkbox, CheckboxGroup) {
        "use strict";

        var config,
            localString,

            ui = (function () {
                var sectionNode,
                    layerList,
                    filterGlobalToggles,
                    layerSettings;

                layerSettings = (function () {
                    function initTransparencySliders() {
                        var transparencySliders;

                        transparencySliders = layerList.find(".nstSlider")
                            .nstSlider({
                                left_grip_selector: ".leftGrip",
                                rounding: 0.01,
                                highlight: {
                                    grip_class: "gripHighlighted",
                                    panel_selector: ".highlightPanel"
                                },
                                value_changed_callback: function (cause, leftValue, rightValue, prevMin, prevMax) {
                                    var slider = $(this),
                                        sliderId = slider.data("layer-id"),
                                        leftValueFormatted = Math.round(leftValue * 100) + "%",
                                        opacityHelper = slider.parents(".layerList1").find(".opacity-helper"),
                                        newState;

                                    slider
                                        .parent().find('.leftLabel').text(leftValueFormatted).end().end()
                                        .nstSlider('highlight_range', 0, leftValue);

                                    opacityHelper
                                        .find(".opacity-helper-value").text(leftValueFormatted).end()
                                        .toggle(leftValue !== 0 && leftValue !== 1);

                                    topic.publish(EventManager.FilterManager.LAYER_TRANSPARENCY_CHANGED, {
                                        layerId: sliderId,
                                        value: leftValue
                                    });

                                    newState = leftValue === 0 ? false : slider.hasClass("disabled") ? true : newState;

                                    if (!UtilMisc.isUndefined(newState)) {
                                        topic.publish(EventManager.FilterManager.TOGGLE_LAYER_VISIBILITY, {
                                            state: newState,
                                            layerId: sliderId
                                        });
                                    }

                                    console.log(cause, leftValue, rightValue, prevMin, prevMax);
                                }
                            });
                        //.nstSlider("set_step_histogram", [4, 6, 10, 107]);

                        topic.subscribe(EventManager.FilterManager.LAYER_VISIBILITY_TOGGLED, function (evt) {
                            var slider = transparencySliders
                                    .filter("[data-layer-id='" + evt.id + "']")
                                    .toggleClass("disabled", !evt.state),
                                value = slider.nstSlider("get_current_min_value");

                            if (value === 0 && evt.state) {
                                slider.nstSlider("set_position", 1);
                            }
                        });
                    }

                    return {
                        init: function () {
                            initTransparencySliders();
                        }
                    };
                }());

                /**
                * Sets UI status of a layer presentation (checkbox and eye) according to the user action: select / de-select a layer.
                * publishes event "filterManager/box-visibility-toggled" every time a layer status changed.
                * There should only be one eye and one global checkbox, but
                * we say checkbox"es" because jquery returns a list and it's
                * easier to write a function that takes a list of checkboxes
                * than to write two functions, one to take a list and one to
                * take an individual checkbox
                * @method setCheckboxEvents
                * @private
                */
                function setCheckboxEvents() {
                    var boxCheckboxGroup,
                        eyeCheckboxGroup;

                    boxCheckboxGroup = new CheckboxGroup(
                        layerList.find(".checkbox-custom .box + input"),
                        {
                            nodeIdAttr: "layer-id",

                            cssClass: {
                                active: "active",
                                focus: "focused",
                                check: "checked"
                            },

                            label: {
                                check: localString.txtHideBounds,
                                uncheck: localString.txtShowBounds
                            },

                            onChange: function () {
                                Theme.tooltipster(this.labelNode.parent(), null, "update");
                            },

                            master: {
                                node: filterGlobalToggles.find(".checkbox-custom .box + input"),

                                nodeIdAttr: "id",/*

                                cssClass: {
                                    active: "active",
                                    focus: "focused",
                                    check: "checked"
                                },*/

                                label: {
                                    check: localString.txtHideAllBounds,
                                    uncheck: localString.txtShowAllBounds
                                }/*,

                                onChange: Theme.tooltipster*/
                            }
                        })
                        // Turn off the bounding boxes by default
                        .setState(false);

                    boxCheckboxGroup.on(boxCheckboxGroup.event.MEMBER_TOGGLE, function (evt) {
                        console.log("Filter Manager -> Checkbox", evt.checkbox.id, "set by", evt.agency, "to", evt.checkbox.state);

                        if (evt.checkbox.id.indexOf("wms") === -1) {
                            topic.publish(EventManager.FilterManager.BOX_VISIBILITY_TOGGLED, {
                                id: evt.checkbox.id,
                                state: evt.checkbox.state
                            });
                        }
                    });

                    boxCheckboxGroup.on(boxCheckboxGroup.event.MASTER_TOGGLE, function (evt) {
                        console.log("Filter Manager -> Master Checkbox", evt.checkbox.id, "set by", evt.agency, "to", evt.checkbox.state);
                    });

                    topic.subscribe(EventManager.FilterManager.TOGGLE_BOX_VISIBILITY, function (evt) {
                        boxCheckboxGroup.setState(evt.state, evt.layerId);
                    });

                    eyeCheckboxGroup = new CheckboxGroup(
                        layerList.find(".checkbox-custom .eye + input"),
                        {
                            nodeIdAttr: "layer-id",

                            cssClass: {
                                active: "active",
                                focus: "focused",
                                check: "checked"
                            },

                            label: {
                                check: localString.txtHideFeatures,
                                uncheck: localString.txtShowFeatures
                            },

                            onChange: function () {
                                Theme.tooltipster(this.labelNode.parent(), null, "update");
                            },

                            master: {
                                node: filterGlobalToggles.find(".checkbox-custom .eye + input"),

                                nodeIdAttr: "id",/*

                                cssClass: {
                                    active: "active",
                                    focus: "focused",
                                    check: "checked"
                                }*/

                                label: {
                                    check: localString.txtHideAllFeatures,
                                    uncheck: localString.txtShowAllFeatures
                                }/*,

                                onChange: Theme.tooltipster*/
                            }
                        });

                    eyeCheckboxGroup.on(eyeCheckboxGroup.event.MEMBER_TOGGLE, function (evt) {
                        console.log("Filter Manager -> Checkbox", evt.checkbox.id, "set by", evt.agency, "to", evt.checkbox.state);

                        topic.publish(EventManager.FilterManager.LAYER_VISIBILITY_TOGGLED, {
                            id: evt.checkbox.id,
                            state: evt.checkbox.state
                        });
                    });

                    eyeCheckboxGroup.on(eyeCheckboxGroup.event.MASTER_TOGGLE, function (evt) {
                        console.log("Filter Manager -> Master Checkbox", evt.checkbox.id, "set by", evt.agency, "to", evt.checkbox.state);
                    });

                    topic.subscribe(EventManager.FilterManager.TOGGLE_LAYER_VISIBILITY, function (evt) {
                        eyeCheckboxGroup.setState(evt.state, evt.layerId);
                    });
                }
                /**
                * initialize a tooltip for each layer, using the layer name.
                * @method initTooltips
                * @private
                */
                function initTooltips() {
                    Theme.tooltipster(filterGlobalToggles);
                    Theme.tooltipster(layerList);

                    PopupManager.registerPopup(layerList, "hoverIntent",
                        function () {
                            if (this.target.attr("title")) {
                                if (this.target.isOverflowed()) {
                                    this.target.tooltipster({ theme: '.tooltipster-dark' }).tooltipster("show");
                                } else {
                                    this.target.removeAttr("title");
                                }
                            }
                        },
                        {
                            handleSelector: ".layer-name span",
                            useAria: false,
                            timeout: 500
                        }
                    );
                }
                /**
                * Adjusts UI layout according to a layer event.
                * @method setButtonEvents
                * @private
                */
                function setButtonEvents() {
                    var expandAllButton = filterGlobalToggles.find(".global-button"),
                        expandAllPopupHandle,
                        expandNodes = layerList.find(".layerList-container:hidden"),
                        expandButtons = layerList.find("button.legend-button");
                    /**
                    * Changes the width of the layers pane to accommodate for the scrollbar if it's needed.
                    * @method adjustPaneWidth
                    * @private
                    */
                    function adjustPaneWidth() {
                        UtilMisc.adjustWidthForSrollbar(layerList, [filterGlobalToggles]);
                    }
                    /**
                    *  Changes the state of the expand all control if all the nodes are expanded.
                    * @method adjustExpandAllButtonState
                    * @private
                    */
                    function adjustExpandAllButtonState() {
                        var count = expandNodes.length,
                            hiddenCount = expandNodes.filter(":hidden").length;

                        if (hiddenCount === 0) {
                            expandAllPopupHandle.open();
                        } else if (hiddenCount === count) {
                            expandAllPopupHandle.close();
                        }
                    }

                    expandButtons.map(function () {
                        var handle = $(this),
                            target = handle.parents("fieldset").find("> .layerList-container");

                        PopupManager.registerPopup(handle, "state-expanded", target, "click",
                            function (d) {
                                target.slideToggle(400, function () {
                                    adjustPaneWidth();
                                    adjustExpandAllButtonState();
                                    d.resolve();
                                });
                            },
                            "same"
                        );
                    });

                    expandAllPopupHandle = PopupManager.registerPopup(expandAllButton, "state-expanded", expandNodes, "click",
                        function (d) {
                            expandNodes.slideDown(400, function () {
                                expandButtons.addClass("state-expanded");

                                adjustPaneWidth();
                                d.resolve();
                            });
                        },
                        function (d) {
                            expandNodes.slideUp(400, function () {
                                expandButtons.removeClass("state-expanded");
                                $("#tabs1_1-parent").scrollTop(0);

                                adjustPaneWidth();
                                d.resolve();
                            });
                        });

                    PopupManager.registerPopup(layerList, "hover, focus",
                        function (d) {
                            d.resolve();
                        },
                        {
                            handleSelector: "li.layerList1:not(.list-item-grabbed):not(.ui-sortable-helper)",
                            targetSelector: ":tabbable",
                            activeClass: "background-light",
                            useAria: false
                        }
                    );

                    PopupManager.registerPopup(layerList, "click",
                        function (d) {
                            this.target.slideToggle("fast", function () {
                                d.resolve();
                            });
                            this.target.find(".nstSlider").nstSlider("refresh");
                        },
                        {
                            handleSelector: ".settings-button",
                            targetContainerSelector: "li.layerList1",
                            targetSelector: ".filter-row-settings",
                            activeClass: "button-pressed"
                        }
                    );

                    // metadata buttons
                    // to be changed...
                    layerList.find("legend button.metadata-button").on("click", function () {
                        var button = $(this),
                            node = button.parents("legend");

                        if (!node.hasClass("selected-row")) {
                            //var guid = $(this).data("guid") || $(this).data("guid", UtilMisc.guid()).data("guid");
                            var guid = button.data("layer-uuid"),
                                metadataUrl;

                            topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                                panelName: localString.txtMetadata,
                                title: node.find(".layer-name span").text(), // + " " + guid,
                                content: null,
                                target: node.find(".layer-details"),
                                origin: "filterManager",
                                guid: guid,
                                doOnOpen: function () { node.addClass("selected-row"); },
                                doOnHide: function () { layerList.find(".selected-row").removeClass("selected-row"); }
                            });

                            var layerConfig = Ramp.getLayerConfigwithGuid(guid);

                            //only wms layers have this value
                            if (layerConfig.layerInfo != null) {
                                if (layerConfig.legend.enable) {
                                    var legendUrl = layerConfig.legend.legendURL,
                                        wmsmeta = String.format(filter_wms_meta_Template,
                                            localString.txtLegend,
                                            legendUrl,
                                            localString.txtLinkToCap,
                                            layerConfig.url + "&request=GetCapabilities");

                                    topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                                        content: $(wmsmeta),
                                        origin: "filterManager",
                                        update: true,
                                        guid: guid
                                    });
                                } else {
                                    topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                                        content: "<p>" + localString.txtMetadataNotFound + "</p>",
                                        origin: "filterManager",
                                        update: true,
                                        guid: guid
                                    });
                                }
                            } else {
                                //for feature layer
                                // metadataUrl =String.format("http://intranet.ecdmp-dev.cmc.ec.gc.ca/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&outputSchema=csw:IsoRecord&id={0}", guid);

                                metadataUrl = "assets/metadata/" + guid + ".xml";

                                UtilMisc.transformXML(metadataUrl, "assets/metadata/xstyle_default_" + config.lang + ".xsl",
                                    function (error, data) {
                                        if (error) {
                                            topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                                                content: "<p>" + localString.txtMetadataNotFound + "</p>",
                                                origin: "filterManager",
                                                update: true,
                                                guid: guid
                                            });
                                        } else {
                                            topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                                                content: $(data),
                                                origin: "filterManager",
                                                update: true,
                                                guid: guid
                                            });
                                        }
                                    });
                            }
                        } else {
                            topic.publish(EventManager.GUI.SUBPANEL_CLOSE, { origin: "filterManager" });
                        }
                    });
                }
                /**
                * Adjusts filter style according to the scroll action on the layers.
                * @method initScrollListeners
                * @private
                */
                function initScrollListeners() {
                    layerList.scroll(function () {
                        var currentScroll = layerList.scrollTop();
                        if (currentScroll === 0) {
                            filterGlobalToggles.removeClass("scroll");
                        } else {
                            filterGlobalToggles.addClass("scroll");
                        }
                    });
                }

                /**
                * Sets all the events to handle layer reordering with both mouse and keyboard.
                * @method setLayerReorderingEvents
                * @private
                */
                function setLayerReorderingEvents() {
                    // Drag and drop layer reordering using jQuery UI Sortable widget
                    layerList = $("#layerList > ul");

                    var layerGroupSeparator = layerList.parent().find(".layer-group-separator"),
                        reorderLists = layerList.filter(function (i, elm) { return $(elm).find("> li").length > 1; }),

                        onUpdate = function (event, ui) {
                            var layerId = ui.item[0].id,
                                idArray = layerList
                                    .map(function (i, elm) { return $(elm).find("> li").toArray().reverse(); }) // for each layer list, find its items and reverse their order
                                    .map(function (i, elm) { return elm.id; }), // get ids
                                index = dojoArray.indexOf(idArray, layerId);

                            topic.publish(EventManager.GUI.SUBPANEL_CLOSE, {
                                origin: "rampPopup,datagrid"
                            });

                            topic.publish(EventManager.FilterManager.SELECTION_CHANGED, {
                                id: layerId,
                                index: index
                            });

                            console.log("Layer", layerId, "moved ->", index);
                        },

                        onStop = function () {
                            layerList
                                .removeClass("sort-active")
                                .removeClass("sort-disabled");

                            layerGroupSeparator.removeClass("active");

                            console.log("Layer Reordering complete.");
                        },

                        onStart = function (event, ui) {
                            layerList
                                .has(ui.item).addClass("sort-active")
                                .end().filter(":not(.sort-active)").addClass("sort-disabled");
                            ui.item.removeClass("background-light");

                            layerGroupSeparator.addClass("active");

                            console.log("Layer Reordering starts.");
                        };

                    reorderLists.sortable({
                        axis: "y",
                        handle: ".sort-handle",
                        placeholder: "sortable-placeholder",
                        update: onUpdate,
                        stop: onStop,
                        start: onStart
                    });

                    UtilMisc.keyboardSortable(reorderLists, {
                        linkLists: true,
                        onUpdate: onUpdate,
                        onStart: onStart,
                        onStop: onStop
                    });
                }

                return {
                    init: function () {
                        // reset and load global template
                        // move the following out from generateGlobalCheckboxes() and merge filter_global_row_template_json into filter_row_template
                        tmpl.cache = {};
                        tmpl.templates = JSON.parse(TmplHelper.stringifyTemplate(filter_manager_template_json));

                        // get visible layers reversing their order; that's important
                        var layers = RampMap.getMap().getLayersVisibleAtScale().reverse(),
                            layerGroups = {
                                feature: [

                                ],

                                wms: [

                                ]
                            },
                            data,
                            section;

                        // limit only to visible layer that is not basemap
                        dojoArray.forEach(layers, function (layer) {
                            //WMS does not have layer type property.  must use layer id to determine if we want to show layer in filter

                            if (layer.type === "Feature Layer" || layer.id.indexOf("wmsLayer") === 0 || layer.id.indexOf("static_") === 0) {
                                // modify layer object

                                var wmsLayerName = null;
                                if (layer.id.indexOf("wmsLayer") === 0) {
                                    wmsLayerName = layer.layerInfos[0].name;

                                    layer.layerConfig = Ramp.getLayerConfig(layer.url, wmsLayerName);
                                    layerGroups.wms.push(layer);
                                } else {
                                    layer.layerConfig = Ramp.getLayerConfig(layer.url, wmsLayerName);

                                    layerGroups.feature.push(layer);
                                }
                            }
                        });

                        // put layer in datawrapper to be used in template
                        data = {
                            config: GlobalStorage.config,
                            str: GlobalStorage.config.stringResources,
                            layerGroups: {
                                feature: TmplHelper.dataBuilder(layerGroups.feature),
                                wms: TmplHelper.dataBuilder(layerGroups.wms)
                            }
                        };

                        sectionNode = $("#" + GlobalStorage.config.divNames.filter);
                        // TODO: generate section using one template, need to refactoring the following fixed string
                        section = tmpl('filter_manager_template', data);

                        // fade out the loading animation
                        sectionNode.addClass('animated fadeOut');
                        window.setTimeout(
                            function () {
                                sectionNode
                                    .empty().append(section)
                                    .removeClass("fadeOut")
                                    .addClass('animated fadeIn');

                                // remove the animating css class
                                window.setTimeout(function () { sectionNode.removeClass('animated fadeIn'); }, 300);

                                filterGlobalToggles = $('#filterGlobalToggles');

                                setLayerReorderingEvents();

                                setCheckboxEvents();

                                initTooltips();

                                setButtonEvents();

                                initScrollListeners();

                                layerSettings.init();

                                // ui initialization completes
                                console.log(EventManager.FilterManager.UI_COMPLETE);
                                topic.publish(EventManager.FilterManager.UI_COMPLETE);
                            },
                            300
                        );
                    }
                };
            }());

        /**
        * Initiates a listener to handle tab deselected event
        *
        * @method initListeners
        * @private
        */
        function initListeners() {
            topic.subscribe(EventManager.GUI.TAB_DESELECTED, function (arg) {
                if (arg.tabName === "filterManager") {
                    topic.publish(EventManager.GUI.SUBPANEL_CLOSE, { origin: "filterManager" });
                }
            });
        }

        return {
            /**
            * Reads the application configuration and creates the legend and filter management widget
            * @method init
            * @constructor
            */
            init: function () {
                // Convenience config objects
                config = GlobalStorage.config;
                localString = GlobalStorage.config.stringResources;

                initListeners();

                ui.init();
            },
            /**
            * Queries all map points on a given feature layer and returns their attributes
            * @method _getFeatures
            * @param {Object} fl A feature layer to query
            * @return {Object} An array of attributes from the designated feature layer
            */
            _getFeatures: function (fl) {
                //do a query on ALL the map points.
                var queryTask = new EsriQuery();
                queryTask.returnGeometry = false; //only return attributes
                queryTask.maxAllowableOffset = 1000;
                //query.outFields = outFieldsList;  //note: this list is overridden by fields in featurelayer constructor
                queryTask.where = fl.objectIdField + ">0";

                return fl.queryFeatures(queryTask);
            },
            /**
            * Grabs all distinct values of the given field from a featureLayer.
            * @method _getField
            * @param {Object} fl A feature layer to query
            * @param {String} field The field (or column) to query in the feature layer
            * @return {Object} deferred A deferred object which will resolve to an array of unique values
            */
            _getField: function (fl, field) {
                var deferred = new Deferred();

                this._getFeatures(fl).then(function (featureSet) {
                    deferred.resolve(dojoArray.map(featureSet.features, function (feature) {
                        return feature.attributes[field];
                    }));
                });

                return deferred.promise;
            }
        };
    });