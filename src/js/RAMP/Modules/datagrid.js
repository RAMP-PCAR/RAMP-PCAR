/*global define, tmpl, TimelineLite, TweenLite, window, i18n, $, console */
/*jslint white: true */

/**
* Datagrid submodule.
*
* @module RAMP
* @submodule Datagrid
* @main Datagrid
*/

/**
* The Datagrid class represents the side bar table shown next to the map. The data grid displays all map objects in a text format and allows the user to see more
* details (same as clicking the map object) and navigate to the object. This class create the UI panel, events, and event-handles for the data grid container.
*
* @class Datagrid
* @static
* @uses dojo/_base/declare
* @uses dojo/_base/lang
* @uses dojo/query
* @uses dojo/_base/array
* @uses dojo/dom-class
* @uses dojo/dom-attr
* @uses dojo/dom-construct
* @uses dojo/topic
* @uses dojo/on
* @uses esri/layers/FeatureLayer
* @uses esri/tasks/query
* @uses Ramp
* @uses GraphicExtension
* @uses GlobalStorage
* @uses Gui
* @uses DatagridClickHandler
* @uses Map
* @uses EventManager
* @uses Theme
* @uses Util
* @uses Array
* @uses Dictionary
* @uses PopupManager
* @uses TmplHelper
*/

define([
/* Dojo */
    "dojo/_base/declare", "dojo/_base/lang", "dojo/query", "dojo/_base/array", "dojo/dom-class",
    "dojo/dom-attr", "dojo/dom-construct", "dojo/topic", "dojo/on", "dojo/Deferred",

/* Text */
     "dojo/text!./templates/datagrid_template.json",
     "dojo/text!./templates/extended_datagrid_template.json",

// Esri
        "esri/layers/FeatureLayer", "esri/tasks/query",

// Ramp
        "ramp/ramp", "ramp/graphicExtension", "ramp/globalStorage", "ramp/datagridClickHandler", "ramp/map",
        "ramp/eventManager", "ramp/theme",

// Util
         "utils/util", "utils/array", "utils/dictionary", "utils/popupManager", "utils/tmplHelper"],

    function (
    // Dojo
        declare, lang, dojoQuery, dojoArray, domClass, domAttr,
        domConstruct, topic, dojoOn, Deferred,

    //Text
        data_grid_template,
        extended_datagrid_template,

    // Esri
        FeatureLayer, EsriQuery,

    // Ramp
        Ramp, GraphicExtension, GlobalStorage, DatagridClickHandler, RampMap, EventManager, Theme,

    // Util
        utilMisc, UtilArray, utilDict, popupManager, tmplHelper) {
        "use strict";

        var GRID_MODE_SUMMARY = "summary",
            GRID_MODE_FULL = "full",

            /**
            * Name of the attribute used to store the oid
            * in the details and zoomTo buttons
            *
            * @private
            * @property featureOidField
            */
            featureOidField = "feature-oid",

            /**
            * Name of the attribute used to store the feature url
            * in the details and zoomTo buttons
            *
            * @private
            * @property featureUrlField
            */
            featureUrlField = "feature-url",

            data_grid_template_json = JSON.parse(tmplHelper.stringifyTemplate(data_grid_template)),
            extended_datagrid_template_json = JSON.parse(tmplHelper.stringifyTemplate(extended_datagrid_template)),
            config,
            //layerConfig,
            gridConfig,

            /**
            * The jquery table
            *
            * @private
            * @property oTable
            */
            oTable,

        // The JQuery Object representing the grid
            jqgrid,
            featureToPage = {},

            currentSortingMode = "asc",

        // A boolean used to keep track of whether or not the grid should apply an
        // extent filter when the datagrid gets selected
            extentFilterExpired = true,

            zoomToGraphic,

            lastExtent,

            /**
            * Total number of features in all the visible layers on the map
            *
            * @private
            * @property totalRecords
            */
            totalRecords = 0,

            ui = (function () {
                /**
                * creates a datagrid row that has the following features:
                * highlight for a give graphic
                * un-highlight
                * scroll to for a give graphic
                *
                * @method createRowPrototype
                * @private
                * @param {String} cssClass the style that highlights the row.
                * @return {Object} an object containing features of a datagrid row
                */
                function createRowPrototype(cssClass) {
                    var index = -1,
                        graphic = null;

                    return {
                        focusedButton: null,

                        isActive: function () {
                            return graphic !== null;
                        },

                        isEqual: function (url, oid) {
                            var thisUrl = graphic.getLayer().url,
                                thisOid = GraphicExtension.getOid(graphic);

                            return (thisUrl === url) && (thisOid === oid);
                        },

                        /**
                        * Navigate to the page the row is in and scroll to it. Returns true
                        * if the row exists in the datagrid, false otherwise.
                        *
                        * @method navigateToRow
                        * @return {Boolean} A value indicating is the navigation is successful
                        * @private
                        * @method navigateToRow
                        */
                        navigateToRow: function () {
                            if (index !== -1) {
                                // Figure out which page the entry is in and navigate to that page
                                var page = Math.floor(index / gridConfig.rowsPerPage);
                                if (oTable.page() !== page) {
                                    // False tells draw not to navigate to the first page
                                    jqgrid.DataTable().page(page).draw(false);
                                }

                                jqgridTableWrapper.scrollTo(this.getNode(), 300, {
                                    axis: "y",
                                    offset: {
                                        left: 0,
                                        top: -this.getNode().height() * 1.5
                                    }
                                });

                                return true;
                            }
                            return false;
                        },

                        setGraphic: function (newGraphic) {
                            graphic = newGraphic;

                            this.refresh();
                        },

                        /**
                        * Finds a row node corresponding to the given graphic object.
                        *
                        * @method refresh
                        * @private
                        * @return {{node: jObject, page: number}} A row node that displays graphic information. If none found, returns an object with empty jNode.
                        */
                        refresh: function () {
                            if (graphic) {
                                var url = graphic.getLayer().url,
                                    id = GraphicExtension.getOid(graphic);
                                if ((url in featureToPage) && (id in featureToPage[url])) {
                                    index = featureToPage[url][id];
                                } else {
                                    index = -1;
                                }
                            } else {
                                index = -1;
                            }
                        },

                        /**
                        * Finds a row node corresponding to the given graphic object.
                        *
                        * @method getNode
                        * @private
                        * @return {{node: jObject, page: number}} A row node that displays graphic information. If none found, returns an object with empty jNode.
                        */
                        getNode: function () {
                            return $(String.format("#jqgrid tbody tr:nth-child({0})", index % gridConfig.rowsPerPage + 1));
                        },

                        /**
                        * Highlights the given graphic object using the specified cssClass.
                        *
                        * @method activate
                        * @private
                        */
                        activate: function () {
                            if (graphic) {
                                this.getNode().addClass(cssClass);

                                if (this.focusedButton) {
                                    this.getNode().find(this.focusedButton).focus();
                                    this.focusedButton = null;
                                }
                            }
                        },

                        /**
                        * Removes a specified cssClass from a given graphic object in the data grid
                        *
                        * @method deactivate
                        * @private
                        */
                        deactivate: function () {
                            if (graphic) {
                                this.getNode().removeClass(cssClass);
                                graphic = null;
                            }
                        }
                    };
                }

                var highlightRow = createRowPrototype("selected-row"),
                    zoomlightRow = createRowPrototype("highlighted-row"),

                    extendedTabTitle,

                    sectionNode,

                    selectedDatasetUrl,

                    datagridStatusLine,
                    datagridGlobalToggles,
                    jqgridWrapper,
                    jqgridTableWrapper,
                    dataTablesScroll,
                    dataTablesScrollBody,
                    dataTablesScrollHead,
                    datasetSelector,
                    datasetSelectorSubmitButton,

                    datagridMode = GRID_MODE_SUMMARY, // GRID_MODE_FULL

                    _isReady = false; // indicates if the ui has fully rendered

                /**
                * Generates a data grid row data with a checkbox to be used in template
                *
                * @method generateToggleButtonDataForTemplate
                * @private
                * @return {String} the generated row data object.
                */
                function generateToggleButtonDataForTemplate() {
                    // TODO: if no more modification is needed, this can be omitted and merged in the higher level.
                    // create object for template
                    // TODO: JKW
                    // Note, the following object is for passing to the template, properties
                    // were guessed. Need to add more detail later on. Empty values were provided,
                    // for example, there were value of "" assigned to the toggle button template, in the code
                    // provided. A temporary property name "attribute" is used. Not sure if this will be
                    // used by ECDMP, therefore, leave the empty value in the template
                    var toggleButtonData = {
                        buttonLabel: i18n.t("datagrid.sort"),
                        classAddition: "font-medium global-button",
                        someAttribute: ""
                    };

                    return toggleButtonData;
                }

                function rowRenderer(data, type, row, meta) {
                    //attribute = feature.attributes;
                    //Remember, case sensitivity MATTERS in the attribute name.

                    var obj = row.last(),
                        datagridMode = ui.getDatagridMode(),
                        tmplData;

                    if (datagridMode === GRID_MODE_SUMMARY) {
                        if (utilMisc.isUndefined(obj[datagridMode])) {
                            var sumTemplate = getGridConfig(obj.featureUrl).summaryRowTemplate;

                            tmpl.cache = {
                            };

                            tmpl.templates = data_grid_template_json;

                            //bundle feature into the template data object
                            tmplData = tmplHelper.dataBuilder(obj.feature, obj.featureUrl);

                            obj[datagridMode] = tmpl(sumTemplate, tmplData);
                        }

                        return obj[datagridMode];
                    } else {
                        if (utilMisc.isUndefined(obj[datagridMode])) {
                            obj[datagridMode] = [];

                            //make array containing values for each column in the full grid
                            // retrieve extendedGrid config object
                            var extendedGrid = getGridConfig(obj.featureUrl).gridColumns;

                            tmpl.cache = {};
                            tmpl.templates = extended_datagrid_template_json;

                            //bundle feature into the template data object
                            tmplData = tmplHelper.dataBuilder(obj.feature, obj.featureUrl);

                            dojoArray.forEach(extendedGrid, function (col, i) {
                                // add columnIdx property, and set initial value
                                tmplData.columnIdx = i;
                                var result = tmpl(col.columnTemplate, tmplData);
                                // Need to check if it's a number, since the template converts
                                // everything into strings
                                if (col.sortType === "numeric") {
                                    result = Number(result);
                                }
                                obj[datagridMode].push(result);
                            });
                        }

                        return obj[datagridMode][meta.col];
                    }
                }

                /**
                * Creates a Data table based on the grid configuration specified in the application config object. See http://www.datatables.net/usage/columns  for addition information on config parameters.
                *
                * @method createDatatable
                * @private
                */
                function createDatatable() {
                    var forcedWidth,
                        tableOptions = {
                            info: false,
                            columnDefs: [],
                            autoWidth: false,
                            deferRender: true,
                            paging: true,
                            pagingType: "ramp", //"full_numbers",
                            scrollX: true,
                            destroy: true,
                            pageLength: gridConfig.rowsPerPage,
                            language: i18n.t("datagrid.gridstrings", { returnObjectTrees: true }),
                            getTotalRecords: function () {
                                return totalRecords;
                            }
                        };

                    if (datagridMode === GRID_MODE_SUMMARY) {
                        tableOptions = lang.mixin(tableOptions,
                            {
                                columns: [{
                                    title: "Name",
                                    width: "300px",
                                    type: "string",
                                    className: "",
                                    render: rowRenderer,
                                    orderable: true
                                }],
                                dom: '<"jqgrid_table_wrapper summary-table"t><"status-line"p>',
                                searching: true
                            }
                        );
                    } else {
                        //layout for variable column (extended grid)
                        tableOptions = lang.mixin(tableOptions,
                            {
                                columns: ui.getSelectedDatasetUrl() === null ? [{ title: "" }] : dojoArray.map(getGridConfig(ui.getSelectedDatasetUrl()).gridColumns, function (column) {
                                    return {
                                        title: column.title,
                                        width: column.width ? column.width : "100px",
                                        type: column.sortType,
                                        className: column.alignment ? "" : "center",
                                        render: rowRenderer
                                    };
                                }),
                                dom: '<"jqgrid_table_wrapper full-table"t><"status-line"p>',
                                scrollY: "500px", // just a placeholder; it will be dynamically updated later
                                searching: config.datagrid.extendedExtentFilterEnabled
                            }
                        );
                    }

                    jqgrid = sectionNode.find("table");

                    // True if a page change just occurred
                    // False otherwise
                    var pageChange = false;

                    oTable = jqgrid.DataTable(tableOptions)
                        .on("page.dt", function () {
                            topic.publish(EventManager.GUI.SUBPANEL_DOCK, { origin: "datagrid,ex-datagrid" });

                            console.log("subPanleDock");

                            pageChange = true;
                        })
                        .on("order.dt", function () {
                            topic.publish(EventManager.GUI.SUBPANEL_DOCK, { origin: "datagrid,ex-datagrid" });

                            console.log("subPanleDock");
                        })
                        .on("draw.dt", function () {
                            cacheSortedData();

                            // Do not activateRows if we're doing a page change
                            if (pageChange) {
                                pageChange = false;
                            } else {
                                ui.activateRows();
                            }

                            ui.adjustPanelWidth();

                            topic.publish(EventManager.Datagrid.DRAW_COMPLETE);
                        });

                    jqgridWrapper = sectionNode.find("#jqgrid_wrapper");
                    jqgridTableWrapper = sectionNode.find(".jqgrid_table_wrapper");
                    dataTablesScroll = sectionNode.find(".dataTables_scroll");
                    dataTablesScrollBody = dataTablesScroll.find(".dataTables_scrollBody");
                    dataTablesScrollHead = dataTablesScroll.find(".dataTables_scrollHead");

                    Theme.tooltipster(jqgridWrapper);

                    // DO:Clean;
                    if (datagridMode !== GRID_MODE_SUMMARY) {
                        // explicitly set height of the scrollbody so the horizontal scrollbar is visible
                        dataTablesScrollBody.height(jqgridTableWrapper.height() - dataTablesScrollHead.height());

                        // explicitly force-set width of the jqgrid so it wouldn't compress when a sub-panel is opened
                        // also check if the width is no greater than that of the container, hide the horizontal scrollbar
                        forcedWidth = jqgrid.outerWidth();

                        ui.adjustPanelWidth();

                        /*if (forcedWidth === jqgridWrapper.outerWidth()) {
                            dataTablesScrollBody.addClass("overflow-x-hidden");
                        } else {
                            dataTablesScrollBody.removeClass("overflow-x-hidden");
                        }*/

                        jqgrid.forceStyle({ width: forcedWidth + "px" });
                    }
                }
                /**
                * Initialize tooltips for the data grid
                *
                * @method initTooltips
                * @private
                */
                function initTooltips() {
                    /// <summary>
                    /// initialize tooltips for the datagrid
                    /// </summary>
                    popupManager.registerPopup(sectionNode, "hoverIntent",
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
                            handleSelector: ".point-name, .category-name, .title-span",
                            useAria: false,
                            timeout: 500
                        }
                    );
                }

                /**
                * Adds event-handling for buttons inside the data grid's row elements (i.e 'Details', 'Zoom To' buttons)
                *
                * @method setButtonEvents
                * @private
                */
                function setButtonEvents() {
                    sectionNode.on("click", "button.details", function () {
                        var buttonNode = $(this),
                            url = buttonNode.data(featureUrlField),
                            oid = buttonNode.data(featureOidField);  //TODO: replace with better selector

                        highlightRow.focusedButton = "button.details";

                        if (highlightRow.isActive() && highlightRow.isEqual(url, oid)) {
                            DatagridClickHandler.onDetailDeselect(datagridMode);
                        } else {
                            var graphic = getGraphicFromButton(buttonNode);

                            DatagridClickHandler.onDetailSelect(buttonNode, graphic, datagridMode);
                        }
                    });

                    // Event handling for "Zoom To" button
                    sectionNode.on("click", "button.zoomto", function (evt) {
                        var zoomNode = $(this);

                        zoomlightRow.focusedButton = "button.zoomto";

                        // Zoom To
                        if (zoomNode.text() === i18n.t("datagrid.zoomTo")) {
                            handleGridEvent(evt, function () {
                                zoomToGraphic = getGraphicFromButton(zoomNode);

                                //store the current extent, then zoom to point.
                                lastExtent = RampMap.getMap().extent.clone();

                                DatagridClickHandler.onZoomTo(RampMap.getMap().extent.clone(), zoomToGraphic);

                                // Update "zoom back" text after the extent change, if we update it
                                // before the extent change, it won't work since the datagrid gets
                                // repopulated after an extent change
                                utilMisc.subscribeOnce(EventManager.Datagrid.EXTENT_FILTER_END, function () {
                                    // Find the first node with the same oid, featureUrl
                                    var newNode = $(String.format("button.zoomto[data-{0}='{1}'][data-{2}='{3}']:eq(0)",
                                                    featureOidField, GraphicExtension.getOid(zoomToGraphic),
                                                    featureUrlField, zoomToGraphic.getLayer().url));
                                    newNode.text(i18n.t("datagrid.zoomBack"));
                                });
                            });
                        } else { // Zoom back
                            DatagridClickHandler.onZoomBack(zoomToGraphic);
                            zoomNode.text(i18n.t("datagrid.zoomTo"));

                            // Reset focus back to "Zoom To" link after map extent change
                            utilMisc.subscribeOnce(EventManager.Datagrid.EXTENT_FILTER_END, function () {
                                var newNode = $(String.format("button.zoomto[data-{0}='{1}'][data-{2}='{3}']:eq(0)",
                                        featureOidField, GraphicExtension.getOid(zoomToGraphic),
                                        featureUrlField, zoomToGraphic.getLayer().url));
                                newNode.focus();
                            });
                        }
                    });

                    sectionNode.on("click", "button.global-button", function () {
                        var buttonNode = $(this);

                        if (currentSortingMode === "asc") {
                            buttonNode.addClass("state-expanded");
                            currentSortingMode = "desc";
                        } else {
                            buttonNode.removeClass("state-expanded");
                            currentSortingMode = "asc";
                        }

                        jqgrid.DataTable().order([0, currentSortingMode]).draw();
                    });

                    //Adds an event trigger for the expansion of the datagrid control
                    sectionNode.on("click", "button.expand", function () {
                        var d = new Deferred();
                        console.log("grid expanded!");

                        datagridMode = datagridMode === GRID_MODE_SUMMARY ? GRID_MODE_FULL : GRID_MODE_SUMMARY;

                        d.then(function () {
                            initScrollListeners();
                        });

                        refreshPanel(d);

                        topic.publish(EventManager.GUI.DATAGRID_EXPAND);
                    });

                    sectionNode.on("change", "#datasetSelector", function () {
                        var controlNode = $(this),
                            optionSelected = controlNode.find("option:selected"),
                            state = (optionSelected[0].value === selectedDatasetUrl);

                        updateDatasetSelectorState(state, true);
                    });

                    sectionNode.on("click", "#datasetSelectorSubmitButton", function () {
                        var optionSelected = datasetSelector.find("option:selected");

                        if (optionSelected.length > 0) {
                            selectedDatasetUrl = optionSelected[0].value;
                        } else {
                            selectedDatasetUrl = "";
                        }

                        refreshTable();
                    });

                    popupManager.registerPopup(sectionNode, "hover, focus",
                        function (d) {
                            this.target.removeClass("wb-invisible");
                            d.resolve();
                        },
                        {
                            handleSelector: "tr",

                            targetSelector: ".record-controls",

                            closeHandler: function (d) {
                                this.target.addClass("wb-invisible");

                                d.resolve();
                            },

                            activeClass: "bg-very-light",
                            useAria: false
                        }
                    );

                    popupManager.registerPopup(sectionNode, "hover, focus",
                        function (d) {
                            d.resolve();
                        },
                        {
                            handleSelector: ".full-table #jqgrid tbody tr",
                            activeClass: "bg-very-light",
                            useAria: false
                        }
                    );

                    popupManager.registerPopup(sectionNode, "dblclick",
                        function (d) {
                            var //oldHandles = jqgrid.find(".expand-cell"),
                                extraPadding = (this.handle.outerHeight() - this.target.height()) / 2;

                            TweenLite.set(".expand-cell", { clearProps: "padding", className: "-=expand-cell" });
                            //TweenLite.set(".expand-cell", { className: "-=expand-cell" });
                            TweenLite.set(this.handle, { padding: extraPadding });

                            window.getSelection().removeAllRanges();

                            d.resolve();
                        },
                        {
                            handleSelector: "td",

                            targetSelector: ".title-span",

                            closeHandler: function (d) {
                                TweenLite.set(this.handle, { clearProps: "padding" });
                                TweenLite.set(this.handle, { className: "-=expand-cell" });

                                d.resolve();
                            },

                            activeClass: "expand-cell",
                            useAria: false
                        }
                    );
                }

                /**
                * Apply's or removes the scrollbar from the data grid based on the height of its container.
                *
                * @method initScrollListeners
                * @private
                */
                function initScrollListeners() {
                    var currentTopScroll,
                        currentBottomScroll;

                    if (datagridMode === GRID_MODE_SUMMARY) {
                        jqgridTableWrapper.scroll(function () {
                            currentTopScroll = jqgridTableWrapper.scrollTop();
                            currentBottomScroll = dataTablesScroll.height() - jqgridTableWrapper.scrollTop() - jqgridTableWrapper.height();

                            if (currentTopScroll === 0) {
                                datagridGlobalToggles.removeClass("scroll");
                            } else {
                                datagridGlobalToggles.addClass("scroll");
                            }

                            if (currentBottomScroll === 0) {
                                datagridStatusLine.removeClass("scroll");
                            } else {
                                datagridStatusLine.addClass("scroll");
                            }
                        });
                    } else {
                        dataTablesScrollBody.scroll(function () {
                            currentTopScroll = dataTablesScrollBody.scrollTop();

                            if (currentTopScroll === 0) {
                                dataTablesScrollHead.removeClass("scroll");
                            } else {
                                dataTablesScrollHead.addClass("scroll");
                            }
                        });
                    }
                }

                /**
                * Highlights the row according to the graphic stored in the event. Sets the hightlightRow variable to the graphic object inside the sent event
                *
                * @method highlightrowShow
                * @private
                * @param {Object} event A thrown event that contains a graphic object inside the grid
                */
                function highlightrowShow(event) {
                    highlightrowHide();

                    highlightRow.setGraphic(event.graphic);

                    if (event.scroll) {
                        ui.activateRows();
                        //applyExtentFilter();
                    }
                }

                /**
                * Un-highlights the row that is currently highlighted
                *
                * @method highlightrowHide
                * @private
                */
                function highlightrowHide() {
                    highlightRow.deactivate();

                    DatagridClickHandler.onZoomCancel();
                }

                /**
                * Stores the graphic in the given event in the variable zoomlightRow
                *
                * @method zoomlightrowShow
                * @private
                * @param {Object} event A thrown event that contains a graphic object inside the grid
                */
                function zoomlightrowShow(event) {
                    zoomlightRow.setGraphic(event.graphic);
                }

                /**
                * De-activates the row stored in zoomlightRow
                *
                * @method zoomlightrowHide
                * @private
                */
                function zoomlightrowHide() {
                    zoomlightRow.deactivate();
                }

                /**
                * Registers event handlers for following events:
                * datagrid/highlightrow-show
                * datagrid/zoomlightrow-show
                * datagrid/zoomlightrow-hide
                * @method initUIListeners
                * @private
                */
                function initUIListeners() {
                    topic.subscribe(EventManager.Datagrid.HIGHLIGHTROW_SHOW, highlightrowShow);

                    topic.subscribe(EventManager.Datagrid.HIGHLIGHTROW_HIDE, highlightrowHide);

                    topic.subscribe(EventManager.Datagrid.ZOOMLIGHTROW_SHOW, zoomlightrowShow);

                    topic.subscribe(EventManager.Datagrid.ZOOMLIGHTROW_HIDE, zoomlightrowHide);

                    topic.subscribe(EventManager.Datagrid.DRAW_COMPLETE, updateDatasetSelectorToLoaded);
                }
                /**
                 * 
                 * @param {Boolean} state indicates if button is disabled or not; true - disabled;
                 * @param {Boolean} [loaded] indicates if the selected dataset is already loaded; it's assumed to be loading otherwise
                 */
                function updateDatasetSelectorState(state, loaded) {
                    var layer;
                    loaded = loaded || false;

                    datasetSelectorSubmitButton
                        .attr("disabled", state)
                        .text(state ?
                            (loaded ?
                                i18n.t("datagrid.ex.datasetSelectorButtonLoaded")
                                : i18n.t("datagrid.ex.datasetSelectorButtonLoading"))
                            : i18n.t("datagrid.ex.datasetSelectorButtonLoad"));

                    layer = dojoArray.filter(GlobalStorage.config.layers.featureLayers,
                        function (layer) {
                            return layer.url === selectedDatasetUrl;
                        });

                    if (extendedTabTitle && layer.length > 0) {
                        extendedTabTitle.text(": " + layer[0].displayName);
                    }
                }

                function updateDatasetSelectorToLoaded() {
                    datasetSelectorSubmitButton
                        .text(i18n.t("datagrid.ex.datasetSelectorButtonLoaded"));
                }

                function refreshTable() {
                    var duration = 0.2,
                        tl = new TimelineLite({ paused: true }),
                        newWrapper,
                        deffered = new Deferred();

                    tmpl.cache = {};
                    tmpl.templates = data_grid_template_json;
                    newWrapper = tmpl(
                        "datagrid_manager_table_Template",
                        {
                            tableId: "jqgrid",
                            tableCss: "display table-condensed table-simplify animated fadeIn"
                        }
                    );

                    if (highlightRow.isActive()) {
                        duration = 0.6;
                        DatagridClickHandler.onDetailDeselect(datagridMode);
                    }

                    tl.set(jqgridWrapper, { className: "+=animated fadeOut" });

                    /*jshint validthis: true */
                    tl.call(function () {
                        tl.pause();

                        jqgridWrapper.replaceWith(newWrapper);
                        createDatatable();

                        updateDatasetSelectorState(true);

                        // continue with transition when apply filter finished
                        deffered.then(function () {
                            tl.set(jqgrid, { className: "-=animated fadeIn" }, "+=" + duration);
                            tl.resume();
                        });
                        applyExtentFilter(deffered);
                    }, null, this, duration + 0.05);

                    tl.set(jqgridWrapper, { className: "-=fadeOut" });
                    tl.set(jqgridWrapper, { className: "+=fadeIn" });
                    tl.set(jqgridWrapper, { className: "-=animated fadeIn" }, "+=" + duration);

                    tl.play();
                }

                function refreshPanel(d) {
                    // using template to generate global checkboxes
                    var globalCheckBoxesData = generateToggleButtonDataForTemplate(),
                        templateData = {
                            buttons: globalCheckBoxesData,
                            tableId: "jqgrid",
                            tableCss: "display table-condensed table-simplify"
                        },
                        section,
                        templateKey,
                        duration = 0.5,
                        tl = new TimelineLite({ paused: true }),
                        deffered = new Deferred();

                    tmpl.cache = {};
                    tmpl.templates = data_grid_template_json;

                    if (datagridMode === GRID_MODE_SUMMARY) {
                        templateKey = "datagrid_manager_Template";
                        templateData.buttons.toggleTitle = i18n.t("datagrid.fullData");

                        if (extendedTabTitle) {
                            extendedTabTitle.remove();
                        }
                    } else {
                        templateKey = "datagrid_full_manager_Template";

                        // filter out static layers
                        var nonStaticFeatureLayers = dojoArray.filter(GlobalStorage.config.layers.featureLayers, function (layerConfig) {
                            var layer = GlobalStorage.map.getLayer(layerConfig.id);
                            return layer.ramp.type !== GlobalStorage.layerType.Static && layer.visible;
                        });

                        templateData.buttons = lang.mixin(templateData.buttons,
                            {
                                datasets: nonStaticFeatureLayers,
                                toggleTitle: i18n.t("datagrid.ex.dataSummary"),
                                txtDataset: i18n.t("datagrid.ex.dataset")
                            }
                        );

                        extendedTabTitle = $("#tabs1_2-lnk").append("<span>").find("span");
                    }

                    // generate the content using rowData and given template
                    section = tmpl(templateKey, templateData);

                    DatagridClickHandler.onDetailDeselect(datagridMode);

                    tl.set(sectionNode, { className: "+=animated fadeOut" });
                    if (jqgrid) {
                        tl.set(jqgrid, { clearProps: "width" });
                    }

                    /*jshint validthis: true */
                    tl.call(function () {
                        tl.pause();

                        sectionNode.empty().append(section);
                        createDatatable();

                        datagridGlobalToggles = sectionNode.find('#datagridGlobalToggles');
                        datagridStatusLine = sectionNode.find('.status-line');
                        datasetSelector = $("#datasetSelector");
                        datasetSelectorSubmitButton = $("#datasetSelectorSubmitButton");
                        updateDatasetSelectorState(true);

                        d.resolve();

                        // continue with transition when apply filter finished
                        deffered.then(function () {
                            //tl.call(function () { oTable.columns.adjust().draw(); console.log("!!!"); }, null, this, "+=2");

                            tl.resume();
                        });

                        applyExtentFilter(deffered);
                    }, null, this, duration + 0.1);

                    tl.set(sectionNode, { className: "-=fadeOut" });
                    tl.set(sectionNode, { className: "+=fadeIn" });
                    tl.set(sectionNode, { className: "-=animated fadeIn" }, "+=" + duration);

                    tl.play();
                }

                function activateRows() {
                    // If there was previously a selected point,
                    // navigate to the correct page and highlight it in the datagrid
                    highlightRow.refresh();
                    zoomlightRow.refresh();

                    // Scroll to the highlighted row first, if it fails,
                    // scroll to the zoomed row
                    if (!highlightRow.navigateToRow()) {
                        zoomlightRow.navigateToRow();
                    }

                    // set the focus on the first button in the datagrid
                    // is not a really good idea to just move focus around
                    //jqgrid.dataTable().find("button:first").focus();

                    zoomlightRow.activate();
                    highlightRow.activate();

                    capturePanel();
                }

                function capturePanel() {
                    var origin = "datagrid",
                        target = highlightRow.getNode().find(".record-controls");

                    if (datagridMode === GRID_MODE_FULL) {
                        origin = "ex-datagrid";
                        target = highlightRow.getNode().find(".button.details");
                    }

                    if (highlightRow.isActive()) {
                        topic.publish(EventManager.GUI.SUBPANEL_CAPTURE, {
                            target: target,
                            consumeOrigin: origin,
                            origin: origin
                        });
                    }
                }

                function adjustPanelWidth() {
                    if (datagridMode === GRID_MODE_SUMMARY) {
                        utilMisc.adjustWidthForSrollbar(jqgridTableWrapper, [datagridGlobalToggles, datagridStatusLine]);
                    } else {
                        if (jqgrid.outerWidth() === jqgridWrapper.outerWidth()) {
                            dataTablesScrollBody.addClass("overflow-x-hidden");
                        } else {
                            dataTablesScrollBody.removeClass("overflow-x-hidden");
                        }
                    }
                }

                return {
                    /**
                    * The constructor method for the data grid. Adds the grid's panel to the UI, adds the data rows, and creates all event triggers
                    *
                    * @method init
                    * @constructor
                    *
                    */
                    init: utilMisc.once(
                        function () {
                            var d = new Deferred();
                            d.then(
                                function () {
                                    _isReady = true;

                                    initTooltips();
                                    setButtonEvents();
                                    initScrollListeners();
                                    initUIListeners();
                                }
                                );

                            sectionNode = $("#" + GlobalStorage.config.divNames.datagrid);
                            refreshPanel(d);
                        }
                ),

                    getDatagridMode: function () {
                        return datagridMode;
                    },

                    getSelectedDatasetUrl: function () {
                        if (!selectedDatasetUrl) {
                            if (datasetSelector.find("option:selected").length > 0) {
                                selectedDatasetUrl = datasetSelector.find("option:selected")[0].value;
                            } else {
                                var firstVisibleLayer = UtilArray.find(GlobalStorage.config.layers.featureLayers, function (layerConfig) {
                                    var layer = GlobalStorage.map.getLayer(layerConfig.id);
                                    return layer.visible && layer.ramp.type !== GlobalStorage.layerType.Static;
                                });
                                selectedDatasetUrl = firstVisibleLayer === null ? null : firstVisibleLayer.url;
                            }
                        } else {
                            datasetSelector.find("option[value='" + selectedDatasetUrl + "']").prop('selected', true);
                        }

                        return selectedDatasetUrl;
                    },

                    /**
                    * Indicates that the Data grid is fully rendered
                    * @method isReady
                    * @returns {Boolean} _isReady flag indicating the render status of the data grid
                    */
                    isReady: function () {
                        return _isReady;
                    },

                    /**
                    * Adjusts the width of the datagrid panel to accommodate the scrollbar.
                    *
                    * @method adjustPanelWidth
                    */
                    adjustPanelWidth: adjustPanelWidth,

                    activateRows: activateRows,

                    /**
                    * publishes the subPanel_Capture event to the GUI class
                    * @method capturePanel
                    */
                    capturePanel: capturePanel
                };
            }());

        /**
        * Caches the sorted data from datatables for feature click events to consume.  Builds featureToPage as a
        * mapping of (layerName,featureId) => page where layerName and featureId are strings and page is a zero based int.
        *
        * @method cacheSortedData
        * @private
        */
        function cacheSortedData() {
            var elements = oTable.rows().data();
            featureToPage = {
            };
            $.each(elements, function (idx, val) {
                var layer = val.last().featureUrl,
                    fid = GraphicExtension.getOid(val.last().feature);

                if (!(layer in featureToPage)) {
                    featureToPage[layer] = {
                    };
                }
                featureToPage[layer][fid] = idx;
            });
        }

        /**
        * Returns the config Object for the given featureLayerUrl
        *
        * @method getGridConfig
        * @param {String} url
        * @return {Object} grid config
        */
        function getGridConfig(url) {
            return Ramp.getLayerConfig(url).datagrid;
        }

        /**
        * A handler that handlers the Enter key press and Click mouse event of the data grid.
        * It is actually a binder that binds the key / mouse event to a handler specified.
        * This is wired up to grid cells in the bootstrapper to achieve click/keypress functions
        *
        * @method handleGridEvent
        * @private
        * @param {Event} e the event object
        * @param {Function} callback the callback function
        */
        function handleGridEvent(e, callback) {
            if ((e.type === "keypress" && e.keyCode === 13) || e.type === "click") {
                callback();
                //Ramp.setHTML(oid); // just update info hit
            }
        }
        /**
        * Gets all layer data in the current map extent that are visible, and put the data into the data grid.
        *
        * @method applyExtentFilter
        * @param {A Deferred object} d
        *
        */
        function applyExtentFilter(d) {
            var visibleFeatures = {},
                visibleGridLayers = RampMap.getVisibleFeatureLayers(),
                dataGridMode = ui.getDatagridMode(),
                q = new EsriQuery();

            // filter out static layers
            visibleGridLayers = dojoArray.filter(visibleGridLayers, function (layer) {
                return layer.ramp.type !== GlobalStorage.layerType.Static;
            });

            if (dataGridMode === GRID_MODE_FULL) {
                visibleGridLayers = dojoArray.filter(visibleGridLayers, function (layer) {
                    return layer.url === ui.getSelectedDatasetUrl();
                });

                if (config.datagrid.extendedExtentFilterEnabled) {
                    q.geometry = RampMap.getMap().extent;
                } else {
                    // Grab everything!
                    q.where = "1 = 1";
                }
            } else { // Summary Mode
                q.geometry = RampMap.getMap().extent;
            }

            q.outFields = ["*"];

            // Update total records
            totalRecords = 0;
            dojoArray.forEach(visibleGridLayers, function (layer) {
                totalRecords += layer.graphics.length;
            });

            var deferredList = dojoArray.map(visibleGridLayers, function (gridLayer) {
                return gridLayer.queryFeatures(q).then(function (features) {
                    if (features.features.length > 0) {
                        var layer = features.features[0].getLayer();
                        visibleFeatures[layer.url] = features.features;
                    }
                });
            });

            // Execute this only after all the deferred objects has resolved
            utilMisc.afterAll(deferredList, function () {
                fetchRecords(visibleFeatures);

                if (d) {
                    d.resolve();
                }
            });
        }

        /**
        * Given a map feature, return a data object used to represent the feature in the datagrid.
        *
        * @method getDataObject
        * @private
        * @param {Object} feature the feature needs to be represented in the datagrid
        * return {Array} an array representing the data the given feature contains.
        */
        function getDataObject(feature) {
            var url = feature.getLayer().url,
                innerArray;
            //attribute = feature.attributes;

            //Remember, case sensitivity MATTERS in the attribute name.

            if (ui.getDatagridMode() === GRID_MODE_SUMMARY) {
                innerArray = [feature.attributes[Ramp.getLayerConfig(url).nameField]];
            } else {
                //make array containing values for each column in the full grid
                innerArray = [];

                // retrieve extendedGrid config object
                var extendedGrid = getGridConfig(url).gridColumns;

                // process each column and add to row
                dojoArray.forEach(extendedGrid, function (column) {
                    innerArray.push(feature.attributes[column.fieldName] || "");
                });
            }

            //TODO may want to move the generation of this custom object to a separate area, as this data will be useful in
            //     both the summary and full grid state.  Will need some thinking.

            // Includes fields that are useful which are not derived from the config.featureSources
            // this should not draw, as there will be no column defined for it
            innerArray.push({
                featureUrl: url,
                layerName: Ramp.getLayerConfig(url).displayName,
                feature: feature
            });

            return innerArray;
        }

        function updateRecordsCount(visibleRecords) {
            $(".pagination-record-number").text(String.format("{0} / {1}", visibleRecords, totalRecords));
        }

        /**
        * Populate the datagrid with data in visibleFeatures
        *
        * @method fetchRecords
        * @param {Array} visibleFeatures a dictionary mapping
        * service url to an array of feature objects
        * @private
        */
        function fetchRecords(visibleFeatures) {
            if (jqgrid === undefined) {
                // fetchRecords call made prior ty jqgrid creation
                // TODO: consider adding a log.warning('fetchRecords called prior to grid initialization')
                return;
            }
            jqgrid.DataTable().clear(); // Do NOT redraw the datatable at this point

            if (Object.keys(visibleFeatures).isEmpty()) {
                updateRecordsCount(0);
                jqgrid.DataTable().draw();
                return;
            }

            var data = [];

            //for each feature layer
            utilDict.forEachEntry(visibleFeatures, function (key, features) {
                //for each feature in a specific layer
                data = data.concat(dojoArray.map(features, function (feature) {
                    //return the appropriate data object for the feature (.map puts them in array form)

                    // "cache" the data object so we don't have to generate it again
                    return feature[ui.getDatagridMode()] ? feature[ui.getDatagridMode()] : feature[ui.getDatagridMode()] = getDataObject(feature);
                }));
            });

            updateRecordsCount(data.length);

            oTable.one("draw.dt", function () {
                topic.publish(EventManager.Datagrid.EXTENT_FILTER_END);
            });

            //add the data to the grid
            jqgrid.dataTable().fnAddData(data);

            // NOTE: fnAddData should be the last thing that happens in this function
            // if you want to add something after this point, use the fnDrawCallback
            // function in the jqgrid initialization
        }

        /**
        * Returns the graphic object of a feature layer which is contained in the given buttonNode.
        *
        * @method getGraphicFromButton
        * @private
        * @param {JObject} buttonNode   the node containing the feature layer
        * @return {Object}   the graphic object of the feature layer.
        */
        function getGraphicFromButton(buttonNode) {
            var featureUrl = buttonNode.data(featureUrlField),
            // Need to parse the index into an integer since it
            // comes as a String
                oid = parseInt(buttonNode.data(featureOidField)),
                featureLayer = RampMap.getFeatureLayer(featureUrl),

                graphic = UtilArray.binaryFind(featureLayer.graphics,
                    function (a_graphic) {
                        return GraphicExtension.getOid(a_graphic) - oid;
                    });

            return graphic;
        }

        /**
        * Binding event handling for events:
        * filterManager/layer-visibility-toggled
        * datagrid/applyExtentFilter
        *
        * @method initListeners
        * @private
        */
        function initListeners() {
            topic.subscribe(EventManager.FilterManager.LAYER_VISIBILITY_TOGGLED, function () {
                extentFilterExpired = true;
            });

            /* UI EVENTS */
            topic.subscribe(EventManager.GUI.TAB_SELECTED, function (arg) {
                if (arg.tabName === "datagrid") {
                    if (extentFilterExpired) {
                        extentFilterExpired = false;
                        applyExtentFilter();
                    } else {
                        ui.capturePanel();
                    }

                    ui.adjustPanelWidth();
                }
            });

            topic.subscribe(EventManager.GUI.TAB_DESELECTED, function (arg) {
                if (arg.tabName === "datagrid") {
                    topic.publish(EventManager.GUI.SUBPANEL_DOCK, {
                        origin: "datagrid"
                    });
                    console.log("subPanleDock");
                }
            });

            topic.subscribe(EventManager.Datagrid.APPLY_EXTENT_FILTER, function () {
                if (ui.getDatagridMode() !== GRID_MODE_FULL) {
                    applyExtentFilter();
                }
            });

            topic.subscribe(EventManager.GUI.SUBPANEL_CHANGE, function (evt) {
                if (evt.origin === "ex-datagrid" &&
                    evt.isComplete) {
                    ui.adjustPanelWidth();
                }
            });
        }

        return {
            /**
            * Initialize the datagrid. must be called before any properties can be accessed.
            *
            * @method init
            */
            init: function () {
                config = GlobalStorage.config;

                // Added to make sure the layer is not static
                var layerConfigs = dojoArray.filter(config.layers.featureLayers, function (layerConfig) {
                    return !layerConfig.isStatic;
                });

                // layerConfig = config.featureLayers;
                gridConfig = layerConfigs[0].datagrid;  //this is just to configure the structure of the grid.  since all layers have same structure, just pick first one

                /*
                $.fn.dataTable.ext.search.push(
                    function (settings, data, dataIndex) {
                        return data[0].indexOf("Water Regions") > -1;
                    }
                );*/

                initListeners();

                ui.init();
            } //InitDataGrid
        };
    });