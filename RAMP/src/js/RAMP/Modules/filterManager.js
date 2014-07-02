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
*/

define([
/* Dojo */
        "dojo/_base/declare", "dojo/_base/lang", "dojo/query", "dojo/_base/array", "dojo/dom", "dojo/dom-class",
        "dojo/dom-style", "dojo/dom-construct", "dojo/_base/connect", "dojo/Deferred", "dojo/topic",
        "dojo/aspect", "dojo/promise/all",
/* Text */
        "dojo/text!./templates/filter_manager_template.json",

/* Esri */
        "esri/tasks/query", "esri/layers/FeatureLayer",

/* Ramp */
        "ramp/ramp", "ramp/globalStorage", "ramp/map", "ramp/eventManager", "themes/theme",

/* Util */
        "utils/tmplHelper", "utils/util", "utils/array", "utils/dictionary", "utils/popupManager"],

    function (
    /* Dojo */
        declare, lang, query, dojoArray, dom, domClass, domStyle, domConstruct,
        connect, Deferred, topic, aspect, all,
    /* Text */
        filter_manager_template_json,

    /* Esri */
        EsriQuery, FeatureLayer,

    /* Ramp */
        Ramp, GlobalStorage, RampMap, EventManager, Theme,

    /* Util */
        TmplHelper, UtilMisc, UtilArray, UtilDict, PopupManager) {
        "use strict";

        var config,
            localString,

            ui = (function () {
                var layerList,
                    filterGlobalToggles;

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
                    var globalEyeCheckboxes,
                        globalBoxCheckboxes,
                        eyeCheckboxes,
                        boxCheckboxes;

                    globalEyeCheckboxes = UtilMisc.styleCheckboxes(
                        filterGlobalToggles.find(".checkbox-custom .eye + input"),
                        "checked", "focused",
                        {
                            checked: localString.txtHideAllFeatures,
                            unchecked: localString.txtShowAllFeatures
                        }
                    );

                    // Turn off the bounding boxes by default
                    globalBoxCheckboxes = UtilMisc
                        .styleCheckboxes(
                            filterGlobalToggles.find(".checkbox-custom .box + input"),
                            "checked", "focused",
                            {
                                checked: localString.txtHideAllBounds,
                                unchecked: localString.txtShowAllBounds
                            })
                        .setAll(false);

                    eyeCheckboxes = UtilMisc.styleCheckboxes(
                        layerList.find(".checkbox-custom .eye + input"),
                        "checked", "focused",
                        {
                            checked: localString.txtHideFeatures,
                            unchecked: localString.txtShowFeatures
                        }
                    );

                    // Turn off the bounding boxes by default
                    boxCheckboxes = UtilMisc
                        .styleCheckboxes(
                            layerList.find(".checkbox-custom .box + input"),
                            "checked", "focused",
                            {
                                checked: localString.txtHideBounds,
                                unchecked: localString.txtShowBounds
                            })
                        .setAll(false);
                    /**
                    * Toggles each layers visibility when the global visibility button is clicked
                    * @method toggleGlobalEye
                    * @param {Boolean} checked The value of the global visibility button's check status (on or off)
                    */
                    function toggleGlobalEye(checked) {
                        eyeCheckboxes.setAll(checked);

                        topic.publish(EventManager.FilterManager.GLOBAL_LAYER_VISIBILITY_TOGGLED, {
                            checked: checked
                        });
                    }
                    /**
                    * Toggles each layers boundary box display check box when the global boundary box button is clicked
                    * @method toggleGlobalBox
                    * @param {Boolean} checked The value of the global boundary box button's check status (on or off)
                    */
                    function toggleGlobalBox(checked) {
                        boxCheckboxes.setAll(checked);

                        topic.publish(EventManager.FilterManager.GLOBAL_BOX_VISIBILITY_TOGGLED, {
                            checked: checked
                        });
                    }

                    topic.subscribe(EventManager.FilterManager.TOGGLE_GLOBAL_LAYER_VISIBILITY, function (evt) {
                        globalEyeCheckboxes.setAll(evt.visible);
                        toggleGlobalEye(evt.visible);
                    });

                    topic.subscribe(EventManager.FilterManager.TOGGLE_GLOBAL_BOX_VISIBILITY, function (evt) {
                        globalBoxCheckboxes.setAll(evt.visible);
                        toggleGlobalBox(evt.visible);
                    });

                    /* START GLOBAL "EYE" AND BOUNDING BOX BUTTON EVENTS */
                    globalEyeCheckboxes.getNodes().on("change", function () {
                        // True if the checkbox got selected, false otherwise
                        var checked = $(this).is(':checked');

                        toggleGlobalEye(checked);
                    });

                    globalBoxCheckboxes.getNodes().on("change", function () {
                        // True if the checkbox got selected, false otherwise
                        var checked = $(this).is(':checked');

                        toggleGlobalBox(checked);
                    });

                    /* END GLOBAL "EYE" AND BOUNDING BOX BUTTONS */

                    /* START INDIVIDUAL "EYE" AND BOUNDING BUTTON EVENTS */
                    /**
                    * Toggles the visibility button (or eye) beside a given layer in the legend. Fires the layer_visibility event.
                    * @method toggleEye
                    * @param {Boolean} checked The check status of the visibility button next to the target layer (on or off)
                    * @param {Object} node The legend item representing the target layer
                    */
                    function toggleEye(checked, node) {
                        // Figure out whether or not all the checkboxes are selected
                        var allChecked = dojoArray.every(eyeCheckboxes.getNodes(), function (checkbox) {
                            return $(checkbox).is(':checked');
                        });

                        globalEyeCheckboxes.setAll(allChecked);

                        // True if the checkbox got selected, false otherwise
                        topic.publish(EventManager.FilterManager.LAYER_VISIBILITY_TOGGLED, {
                            checked: checked,
                            node: node[0]
                        });
                    }
                    /**
                    * Toggles the boundary box button beside a given layer in the legend. Fires the box_visibility event.
                    * @method toggleBox
                    * @param {Boolean} checked The check status of the boundary box button next to the target layer (on or off)
                    * @param {Object} node The legend item representing the target layer
                    */
                    function toggleBox(checked, node) {
                        // Figure out whether or not all the checkboxes are selected
                        var allChecked = dojoArray.every(boxCheckboxes.getNodes(), function (checkbox) {
                            return $(checkbox).is(':checked');
                        });

                        globalBoxCheckboxes.setAll(allChecked);

                        topic.publish(EventManager.FilterManager.BOX_VISIBILITY_TOGGLED, {
                            checked: checked,
                            node: node[0]
                        });
                    }

                    topic.subscribe(EventManager.FilterManager.TOGGLE_LAYER_VISIBILITY, function (evt) {
                        // Set the checkboxes visually, checkboxes with an id in evt.layerIds gets
                        // turned on, the rest gets turned off
                        eyeCheckboxes.setState(function (checkbox) {
                            var layerId = $(checkbox).findInputLabel().data("layer-id");
                            if (evt.layerIds.contains(layerId)) {
                                return evt.checked;
                            } else {
                                return !evt.checked;
                            }
                        });

                        dojoArray.forEach(eyeCheckboxes.getNodes(), function (checkbox) {
                            checkbox = $(checkbox);
                            var layerId = checkbox.findInputLabel().data("layer-id");
                            toggleEye(evt.layerIds.contains(layerId), checkbox);
                        });
                    });

                    topic.subscribe(EventManager.FilterManager.TOGGLE_BOX_VISIBILITY, function (evt) {
                        // Set the checkboxes visually, checkboxes with an id in evt.layerIds gets
                        // turned on, the rest gets turned off
                        boxCheckboxes.setState(function (checkbox) {
                            var layerId = $(checkbox).findInputLabel().data("layer-id");
                            if (evt.layerIds.contains(layerId)) {
                                return evt.checked;
                            } else {
                                return !evt.checked;
                            }
                        });

                        dojoArray.forEach(boxCheckboxes.getNodes(), function (checkbox) {
                            checkbox = $(checkbox);
                            var layerId = checkbox.findInputLabel().data("layer-id");
                            toggleBox(evt.layerIds.contains(layerId), checkbox);
                        });
                    });

                    // Event handling for individual "eye" and "box" toggle
                    eyeCheckboxes.getNodes().on("change", function () {
                        var node = $(this),
                            checked = node.is(':checked');

                        toggleEye(checked, node);
                    });

                    boxCheckboxes.getNodes().on("change", function () {
                        var node = $(this),
                        // True if the checkbox got selected, false otherwise
                            checked = node.is(':checked');

                        toggleBox(checked, node);
                    });
                    /* END INDIVIDUAL "EYE" AND BOUNDING BUTTON EVENTS */
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

                    // metadata buttons
                    // to be changed...
                    layerList.find("legend button.metadata-button").on("click", function () {
                        var node = $(this).parents("legend");

                        if (!node.hasClass("selected-row")) {
                            //var guid = $(this).data("guid") || $(this).data("guid", UtilMisc.guid()).data("guid");
                            var guid = $(this).data("layer-uuid"),
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

                return {
                    init: function () {
                        // reset and load global template
                        // move the following out from generateGlobalCheckboxes() and merge filter_global_row_template_json into filter_row_template
                        tmpl.cache = {};
                        tmpl.templates = JSON.parse(TmplHelper.stringifyTemplate(filter_manager_template_json));

                        // get visible layers
                        var layers = RampMap.getMap().getLayersVisibleAtScale(),
                            lLayers = [];

                        // limit only to visible layer that is not basemap
                        dojoArray.forEach(layers, function (layer) {
                            if (!layer.type || layer.type === "basemap") {
                                return;
                            }

                            // modify layer object
                            layer.layerConfig = Ramp.getLayerConfig(layer.url);
                            lLayers.push(layer);
                        });

                        // put layer in datawrapper to be used in template
                        var data = TmplHelper.dataBuilder(lLayers),
                            sectionNode = $("#" + GlobalStorage.config.divNames.filter),
                            section;

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

                                layerList = $("#layerList");
                                if (layerList.find("> li").length > 1) {
                                    layerList.sortable(
                                        {
                                            axis: "y",
                                            handle: ".sort-handle",
                                            placeholder: "sortable-placeholder",
                                            update: function (event, ui) {
                                                var layerId = ui.item[0].id,
                                                    index = dojoArray.indexOf($("#layerList").sortable("toArray"), layerId);

                                                topic.publish(EventManager.GUI.SUBPANEL_CLOSE, { origin: "rampPopup,datagrid" });

                                                topic.publish(EventManager.FilterManager.SELECTION_CHANGED, {
                                                    id: layerId,
                                                    index: index
                                                });
                                            }
                                        }
                                    );
                                }
                                filterGlobalToggles = $('#filterGlobalToggles');

                                setCheckboxEvents();

                                initTooltips();

                                setButtonEvents();

                                initScrollListeners();

                                // ui initialization complets
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