/*global define, tmpl, i18n, console, $, RAMP */

/**
* FilterManager submodule
*
* @module RAMP
* @submodule FilterManager
* @main FilterManager
*/

/**
* FilterManager class. Represents the legend next to the map and the controls to toggle each map layer's
* visibility and boundary box.
* The FilterManager also includes an attribute filter that allows the user to hide map features based on
* attribute values
*
* For a doc with diagrams on how this class works, please see
* http://ecollab.ncr.int.ec.gc.ca/projects/science-apps/priv/RAMP/RAMP%20AMD%20Filter%20Module.docx
*
* ####Imports RAMP Modules:
* {{#crossLink 'RAMP'}}{{/crossLink}}
* {{#crossLink 'GlobalStorage'}}{{/crossLink}}
* {{#crossLink 'Map'}}{{/crossLink}}
* {{#crossLink 'EventManager'}}{{/crossLink}}
* {{#crossLink 'LayerItem'}}{{/crossLink}}
* {{#crossLink 'LayerGroup'}}{{/crossLink}}
* {{#crossLink 'Theme'}}{{/crossLink}}
* {{#crossLink 'TmplHelper'}}{{/crossLink}}
* {{#crossLink 'Util'}}{{/crossLink}}
* {{#crossLink 'Dictionary'}}{{/crossLink}}
* {{#crossLink 'PopupManager'}}{{/crossLink}}
* {{#crossLink 'Checkbox'}}{{/crossLink}}
* {{#crossLink 'CheckboxGroup'}}{{/crossLink}}
*
* ####Uses RAMP Templates:
* {{#crossLink 'templates/filter_manager_template.json'}}{{/crossLink}}
* {{#crossLink 'templates/filter_wms_meta_Template.json'}}{{/crossLink}}
*
* @class FilterManager
* @static
* @uses dojo/Deferred
* @uses dojo/topic
* @uses esri/tasks/query
*/

define([

    /* Dojo */
        'dojo/_base/lang', 'dojo/Deferred', 'dojo/topic',

    /* Text */
        'dojo/text!./templates/filter_manager_template.json',
        'dojo/text!./templates/filter_wms_meta_Template.json',

    /* Esri */
        'esri/tasks/query',

    /* Ramp */
        'ramp/globalStorage', 'ramp/map', 'ramp/eventManager', 'ramp/theme', 'ramp/layerGroup', 'ramp/layerItem',

    /* Util */
        'utils/tmplHelper', 'utils/util', 'utils/dictionary', 'utils/popupManager', 'utils/checkboxGroup',
],

    function (

    /* Dojo */
        lang, Deferred, topic,

    /* Text */
        filterManagerTemplateJson,
        filterWmsMetaTemplate,

    /* Esri */
        EsriQuery,

    /* Ramp */
        GlobalStorage, RampMap, EventManager, Theme, LayerGroup, LayerItem,

    /* Util */
        TmplHelper, UtilMisc, UtilDict, PopupManager, CheckboxGroup) {
        'use strict';

        var config;
        var layerIdField = 'layer-id';

        var layerGroups = {};

        var updatingLayers = [];

        var ui = (function () {
            var sectionNode;
            var mainList;
            var layerGroupList;

            var layerSettings;
            var layerToggles;
            var layerSort;
            var layerTooltips;

            layerSettings = (function () {
                var transparencySliders;

                function initTransparencySliders() {
                    // initializes all sliders in the layer list
                    transparencySliders = layerGroupList.find('.nstSlider._slider')
                        .removeClass('_slider')

                        //jscs:disable requireCamelCaseOrUpperCaseIdentifiers
                        .nstSlider({
                            left_grip_selector: '.leftGrip', //jshint ignore:line
                            rounding: 0.01,
                            highlight: {
                                grip_class: 'gripHighlighted', //jshint ignore:line
                                panel_selector: '.highlightPanel', //jshint ignore:line
                            },
                            value_changed_callback: function (cause, leftValue) { //jshint ignore:line
                                //, rightValue, prevMin, prevMax) {
                                var slider = $(this);
                                var sliderId = slider.data(layerIdField);
                                var leftValueFormatted = Math.round(leftValue * 100) + '%';
                                var newState;

                                // update the slider label and highlight range
                                slider
                                    .parent().find('.leftLabel').text(leftValueFormatted).end().end()
                                    .nstSlider('highlight_range', 0, leftValue);

                                topic.publish(EventManager.FilterManager.LAYER_TRANSPARENCY_CHANGED, {
                                    layerId: sliderId,
                                    value: leftValue,
                                });

                                // Setting Opacity to 0.0, sets layer to invisible
                                // Setting Opacity to >0.0, sets layer to visible
                                newState = leftValue === 0 ? false : slider.hasClass('disabled') ? true : newState;

                                // TODO: refactor; this is a bit unclear
                                // fire event only if newState is false or true; do nothing if undefined
                                if (typeof newState !== 'undefined' && cause && cause !== 'refresh') {
                                    topic.publish(EventManager.FilterManager.TOGGLE_LAYER_VISIBILITY, {
                                        state: newState,
                                        layerId: sliderId,
                                    });
                                }

                                //console.log(cause, leftValue, rightValue, prevMin, prevMax);
                            },
                        });

                    //jscs:enable requireCamelCaseOrUpperCaseIdentifiers
                    //.nstSlider('set_step_histogram', [4, 6, 10, 107]);
                }

                function initListeners() {
                    topic.subscribe(EventManager.FilterManager.LAYER_VISIBILITY_TOGGLED, function (evt) {
                        var slider = layerGroupList.find('.nstSlider').filter('[data-layer-id="' + evt.id + '"]');
                        var value;

                        if (slider.length > 0) {
                            slider.toggleClass('disabled', !evt.state);
                            value = slider.nstSlider('get_current_min_value');

                            // Toggling layer to Visible when Opacity is 0.0, sets Opacity to 1.0
                            if (value === 0 && evt.state) {
                                slider.nstSlider('set_position', 1);
                            }
                        }
                    });
                }

                return {
                    init: function () {
                        initTransparencySliders();

                        initListeners();
                    },

                    update: function () {
                        initTransparencySliders();
                    },
                };
            }());

            layerToggles = (function () {
                var globalToggleSection;
                var boxCheckboxGroup;
                var eyeCheckboxGroup;
                var queryCheckboxGroup;

                /**
                * Sets UI status of a layer presentation (checkbox and eye) according to the user action:
                * select / de-select a layer.
                * Publishes event 'filterManager/box-visibility-toggled' every time a layer status changed.
                * There should only be one eye and one global checkbox, but we say checkbox'es' because
                * jquery returns a list and it's easier to write a function that takes a list of checkboxes
                * than to write two functions, one to take a list and one to take an individual checkbox
                *
                * @method createGroups
                * @private
                */
                function createGroups() {
                    boxCheckboxGroup = new CheckboxGroup(
                        mainList.find('.checkbox-brick-container.bbox input:first'),
                        {
                            nodeIdAttr: layerIdField,

                            label: {
                                check: i18n.t('filterManager.hideBounds'),
                                uncheck: i18n.t('filterManager.showBounds'),
                            },

                            onChange: function () {
                                UtilMisc.tooltipster(this.labelNode.parent(), null, 'update');
                            },
                            /*
                            master: {
                                node: globalToggleSection.find('.checkbox-custom .box + input'),

                                nodeIdAttr: 'id',

                                label: {
                                    check: i18n.t('filterManager.hideAllBounds'),
                                    uncheck: i18n.t('filterManager.showAllBounds')
                                }
                            }*/
                        });

                    boxCheckboxGroup.on(CheckboxGroup.event.MEMBER_TOGGLE, function (evt) {
                        console.log('Filter Manager -> Checkbox', evt.checkbox.id, 'set by',
                            evt.agency, 'to', evt.checkbox.state);

                        topic.publish(EventManager.FilterManager.BOX_VISIBILITY_TOGGLED, {
                            id: evt.checkbox.id,
                            state: evt.checkbox.state,
                        });
                    });

                    /*boxCheckboxGroup.on(CheckboxGroup.event.MASTER_TOGGLE, function (evt) {
                        console.log('Filter Manager -> Master Checkbox', evt.checkbox.id, 'set by',
                        evt.agency, 'to', evt.checkbox.state);
                    });*/

                    eyeCheckboxGroup = new CheckboxGroup(
                        mainList.find('.checkbox-custom .eye + input'),
                        {
                            nodeIdAttr: layerIdField,

                            label: {
                                check: i18n.t('filterManager.hideFeatures'),
                                uncheck: i18n.t('filterManager.showFeatures'),
                            },

                            onChange: function () {
                                UtilMisc.tooltipster(this.labelNode.parent(), null, 'update');
                            },

                            master: {
                                node: globalToggleSection.find('.checkbox-custom .eye + input'),

                                nodeIdAttr: 'id',

                                label: {
                                    check: i18n.t('filterManager.hideAllFeatures'),
                                    uncheck: i18n.t('filterManager.showAllFeatures'),
                                },
                            },
                        });

                    eyeCheckboxGroup.on(CheckboxGroup.event.MEMBER_TOGGLE, function (evt) {
                        console.log('Filter Manager -> Checkbox', evt.checkbox.id, 'set by',
                            evt.agency, 'to', evt.checkbox.state);

                        topic.publish(EventManager.FilterManager.LAYER_VISIBILITY_TOGGLED, {
                            id: evt.checkbox.id,
                            state: evt.checkbox.state,
                        });
                    });

                    eyeCheckboxGroup.on(CheckboxGroup.event.MASTER_TOGGLE, function (evt) {
                        console.log('Filter Manager -> Master Checkbox', evt.checkbox.id, 'set by',
                            evt.agency, 'to', evt.checkbox.state);
                    });

                    queryCheckboxGroup = new CheckboxGroup(
                        mainList.find('.checkbox-custom .query + input'),
                        {
                            nodeIdAttr: layerIdField,

                            label: {
                                check: i18n.t('filterManager.WMSQueryDisable'),
                                uncheck: i18n.t('filterManager.WMSQueryEnable'),
                            },

                            onChange: function () {
                                UtilMisc.tooltipster(this.labelNode.parent(), null, 'update');
                            },

                            master: {
                                node: globalToggleSection.find('.checkbox-custom .query + input'),

                                nodeIdAttr: 'id',

                                label: {
                                    check: i18n.t('filterManager.WMSAllQueryDisable'),
                                    uncheck: i18n.t('filterManager.WMSAllQueryEnable'),
                                },
                            },
                        });

                    queryCheckboxGroup.on(CheckboxGroup.event.MEMBER_TOGGLE, function (evt) {
                        console.log('Filter Manager -> Checkbox', evt.checkbox.id, 'set by',
                            evt.agency, 'to', evt.checkbox.state);

                        // TODO: temp function; move or connect to the ramp state manager later.
                        var wmsLayer = RAMP.layerRegistry[evt.checkbox.id];
                        if (wmsLayer.ramp.config.featureInfo) {
                            wmsLayer.ramp.state.queryEnabled = evt.checkbox.state;
                        }
                    });

                    queryCheckboxGroup.on(CheckboxGroup.event.MASTER_TOGGLE, function (evt) {
                        console.log('Filter Manager -> Master Checkbox', evt.checkbox.id, 'set by',
                            evt.agency, 'to', evt.checkbox.state);
                    });
                }

                function initListeners() {
                    topic.subscribe(EventManager.FilterManager.TOGGLE_BOX_VISIBILITY, function (evt) {
                        boxCheckboxGroup.setState(evt.state, evt.layerId);
                    });

                    topic.subscribe(EventManager.FilterManager.TOGGLE_LAYER_VISIBILITY, function (evt) {
                        eyeCheckboxGroup.setState(evt.state, evt.layerId);
                    });
                }

                return {
                    init: function () {
                        globalToggleSection = sectionNode.find('#filterGlobalToggles');
                        UtilMisc.tooltipster(mainList);

                        createGroups();
                        initListeners();

                        // wms query toggles are hidden by default as we don't know if there are any wms layers
                        this.hideQueryToggles(true);
                    },

                    update: function () {
                        UtilMisc.tooltipster(mainList);

                        boxCheckboxGroup.addCheckbox(mainList.find('.checkbox-brick-container.bbox input:first'));
                        eyeCheckboxGroup.addCheckbox(mainList.find('.checkbox-custom .eye + input'));
                        queryCheckboxGroup.addCheckbox(mainList.find('.checkbox-custom .query + input'));
                    },

                    globalToggleSection: function () {
                        return globalToggleSection;
                    },

                    // TODO: refactor - temp function
                    hideQueryToggles: function (value) {
                        globalToggleSection
                            .find('.checkbox-custom .query')
                            .parent()
                            .toggle(!value);
                    },
                };
            }());

            layerSort = (function () {
                var sortableHandle;

                var layerGroupSeparator;
                var reorderLists;

                var onUpdate = function (event, ui) {
                    var layerId = ui.item[0].id;

                    // for each layer list, find its items and reverse their order
                    var idArray = layerGroupList
                            .map(function (i, elm) { return $(elm).find('> li').toArray().reverse(); })
                            .map(function (i, elm) { return elm.id; }); // get ids

                    var cleanIdArray = idArray.filter(function (i, elm) {
                        //check if layer is in error state.  error layers should not be part of the count
                        return (getLayerItem(elm).state !== LayerItem.state.ERROR);
                    });

                    var index = cleanIdArray.toArray().indexOf(layerId);

                    if (index < 0) {
                        return;
                    }

                    topic.publish(EventManager.GUI.SUBPANEL_CLOSE, {
                        origin: 'rampPopup,datagrid',
                    });

                    topic.publish(EventManager.FilterManager.SELECTION_CHANGED, {
                        id: layerId,
                        index: index,
                    });

                    console.log('Layer', layerId, 'moved ->', index);
                };

                var onStop = function () {
                    layerGroupList
                        .removeClass('sort-active')
                        .removeClass('sort-disabled');

                    layerGroupSeparator.removeClass('active');

                    console.log('Layer Reordering complete.');
                };

                var onStart = function (event, ui) {
                    layerGroupList
                        .has(ui.item).addClass('sort-active')
                        .end().filter(':not(.sort-active)').addClass('sort-disabled');
                    ui.item.removeClass('bg-very-light');

                    layerGroupSeparator.addClass('active');

                    console.log('Layer Reordering starts.');
                };

                return {
                    init: function () {
                    },

                    /**
                    * Sets all the events to handle layer reordering with both mouse and keyboard.
                    * @method setLayerReorderingEvents
                    * @private
                    */
                    update: function () {
                        layerGroupSeparator = layerGroupList.parent().find('.layer-group-separator');
                        reorderLists = layerGroupList.filter(function (i, elm) {
                            return $(elm).find('> li').length > 1;
                        });

                        if (sortableHandle) {
                            sortableHandle.sortable('destroy');
                        }

                        sortableHandle = reorderLists
                            .sortable({
                                axis: 'y',
                                handle: '.sort-handle',
                                placeholder: 'sortable-placeholder',
                                update: onUpdate,
                                stop: onStop,
                                start: onStart,
                            });

                        UtilMisc.keyboardSortable(reorderLists, {
                            linkLists: true,
                            onUpdate: onUpdate,
                            onStart: onStart,
                            onStop: onStop,
                        });
                    },
                };
            }());

            layerTooltips = (function () {
                return {
                    /**
                    * initialize a tooltip for each layer, using the layer name.
                    * @method initTooltips
                    * @private
                    */
                    init: function () {
                        //UtilMisc.tooltipster(_filterGlobalToggles_to_remove);
                        UtilMisc.tooltipster(mainList);

                        PopupManager.registerPopup(mainList, 'hoverIntent',
                            function () {
                                if (this.target.attr('title')) {
                                    if (this.target.isOverflowed()) {
                                        this.target.tooltipster({ theme: '.tooltipster-dark' }).tooltipster('show');
                                    } else {
                                        this.target.removeAttr('title');
                                    }
                                }
                            },

                            {
                                handleSelector: '.layer-name span, .layer-details span',
                                useAria: false,
                                timeout: 500,
                            }
                        );
                    },
                };
            }());

            /**
            * Changes the width of the layers pane to accommodate for the scrollbar if it's needed.
            *
            * @method adjustPaneWidth
            * @private
            */
            function adjustPaneWidth() {
                UtilMisc.adjustWidthForSrollbar($('#layerList'), [layerToggles.globalToggleSection()]);
                layerGroupList.find('.nstSlider').each(function () {
                    $(this).nstSlider('refresh');
                });
            }

            /**
            * Sets event handlers for various controls that may be present in the layer items. All event handlers
            * are set on the main list container and are independed of the individual layer items.
            *
            * @method setButtonEvents
            * @private
            */
            function setButtonEvents() {
                // highlight layer item on hover/focus with a light gray background
                PopupManager.registerPopup(mainList, 'hover, focus',
                    function (d) {
                        d.resolve();
                    },

                    {
                        handleSelector: 'li.layerList1:not(.list-item-grabbed):not(.ui-sortable-helper)',
                        targetSelector: ':tabbable',
                        activeClass: 'bg-very-light',
                        useAria: false,
                    }
                );

                // open the settings panel when the settings control is clicked; visibility slider is refreshed;
                PopupManager.registerPopup(mainList, 'click',
                    function (d) {
                        this.target.slideToggle('fast', function () {
                            adjustPaneWidth();
                            d.resolve();
                        });
                        /* Parent node not visible upon slider creation; the slider plugin cannot calculate the
                        slider's proper position. You need to refresh it when the setting section is opened.
                        Otherwise it won't display properly.*/
                        this.target.find('.nstSlider').nstSlider('refresh');
                    },

                    {
                        handleSelector: '.settings-button',
                        containerSelector: 'li.layerList1',
                        targetSelector: '.filter-row-settings',
                        activeClass: 'button-pressed',
                    }
                );

                // reload layer in snapshot mode
                PopupManager.registerPopup(mainList, 'click',
                    function (d) {
                        // TODO: rework hack: for some reason brick kills the event propagation so can't catch
                        // event with proper selector. see below.
                        // disable button manually; idealy it should be done by brick
                        var id = $(this.target).data('layer-id');
                        this.target
                            .addClass('disabled')
                            .attr('aria-disabled', true)
                        ;
                        topic.publish(EventManager.LayerLoader.RELOAD_LAYER, { layerId: id, mode: 'snapshot' });
                        d.resolve();
                    },

                    {
                        handleSelector: '.brick.all-data .btn-choice',

                        //.brick.all-data .btn-choice:not(.button-pressed)
                    }
                );

                // open renderers sections when the renderer button (layer icon) is clicked;
                PopupManager.registerPopup(mainList, 'click',
                    function (d) {
                        var newTooltip = this.isOpen() ? i18n.t('filterManager.showLegend') :
                            i18n.t('filterManager.hideLegend');
                        var _this = this;

                        this.target.slideToggle('fast', function () {
                            adjustPaneWidth();

                            _this.handle
                                .prop('title', newTooltip)
                                .find('> .wb-invisible')
                                .text(newTooltip);

                            UtilMisc.tooltipster(_this.handle.parent(), null, 'update');

                            d.resolve();
                        });
                    },

                    {
                        handleSelector: '.renderer-button',
                        containerSelector: 'li.layerList1',
                        targetSelector: '.renderer-list',
                        activeClass: 'button-pressed',
                    }
                );

                // reload layer when reload button is clicked;
                PopupManager.registerPopup(mainList, 'click',
                    function (d) {
                        //call reload thing here
                        var id = $(this.target).data('layer-id');
                        topic.publish(EventManager.LayerLoader.RELOAD_LAYER, { layerId: id });
                        d.resolve();
                    },

                    {
                        handleSelector: '.reload-button',
                    }
                );

                // remove layer when remove button is clicked;
                PopupManager.registerPopup(mainList, 'click',
                    function (d) {
                        var id = $(this.target).data('layer-id');

                        //call remove thing here
                        topic.publish(EventManager.LayerLoader.REMOVE_LAYER, { layerId: id });
                        d.resolve();
                    },

                    {
                        handleSelector: '.remove-button',
                    }
                );

                // for scale-dependent layers - zoom to data
                PopupManager.registerPopup(mainList, 'click',
                    function (d) {
                        var layerId = this.target.data('layer-id');

                        RampMap.zoomToLayerScale(layerId);

                        d.resolve();
                    },

                    {
                        handleSelector: '.button-none.zoom',
                        activeClass: 'button-pressed',
                    }
                );

                // adjust panel width on load
                adjustPaneWidth();
            }

            /**
            * Adjusts filter style according to the scroll action on the layers.
            * @method initScrollListeners
            * @private
            */
            function initScrollListeners() {
                var globalToggleSection = layerToggles.globalToggleSection();

                mainList.scroll(function () {
                    var currentScroll = mainList.scrollTop();
                    if (currentScroll === 0) {
                        globalToggleSection.removeClass('scroll');
                    } else {
                        globalToggleSection.addClass('scroll');
                    }
                });
            }

            return {
                init: function () {
                    var section;
                    var layerGroup;
                    var _this = this;

                    sectionNode = $('#' + RAMP.config.divNames.filter);
                    section = TmplHelper.template('filter_manager_template2', { config: RAMP.config },
                        JSON.parse(TmplHelper.stringifyTemplate(filterManagerTemplateJson)));

                    sectionNode.empty().append(section);

                    mainList = sectionNode.find('#layerList');
                    layerGroupList = mainList.find('> li > ul');

                    GlobalStorage.layerSelectorGroups.forEach(function (layerType) {
                        layerGroup = new LayerGroup([], {
                            layerType: layerType,
                        });

                        layerGroups[layerType] = layerGroup;
                        _this.addLayerGroup(layerGroup.node);
                    });

                    layerToggles.init();
                    layerTooltips.init();
                    setButtonEvents();
                    initScrollListeners();
                    layerSettings.init();

                    // ui initialization completes
                    console.log(EventManager.FilterManager.UI_COMPLETE);
                    topic.publish(EventManager.FilterManager.UI_COMPLETE);
                    /*},
                    300
                );*/
                },

                /**
                * Updates certain UI aspects like layer settings panel (visibility sliders for now only),
                * layer visibility and bounding box toggles, and layer sorting.
                * @method ui.update
                * @private
                */
                update: function () {
                    layerGroupList = mainList.find('> li > ul');

                    layerSettings.update();
                    layerToggles.update();
                    layerSort.update();
                },

                /**
                * Add the provided layer group node to the layer selector ui.
                * @method ui.addLayerGroup
                * @private
                */
                addLayerGroup: function (layerGroupNode) {
                    mainList.prepend(layerGroupNode);
                },

                // TODO: refactor - temp function
                hideQueryToggles: function (value) {
                    layerToggles.hideQueryToggles(value);
                },
            };
        }());

        /**
        * Returns a LayerItem object with specified layerId.
        * @param {String} layerId a layer id
        * @method getLayerItem
        * @private
        */
        function getLayerItem(layerId) {
            var layerItem = null;

            UtilDict.forEachEntry(layerGroups, function (key, layerGroup) {
                if (!layerItem) {
                    layerItem = layerGroup.getLayerItem(layerId);
                }
            });

            return layerItem;
        }

        /**
        * Set the state of the specified layer to the provided value.
        * @param {String} layerId a layer id
        * @param {String} layerState a state to set the specified layer to
        * @param {Object} [options] additional options to be passed to the layerItem upon setting state
        * @method setLayerState
        * @private
        */
        function setLayerState(layerId, layerState, options) {
            var layerItem;
            var isChanged = false;

            if (!(layerId instanceof Array)) {
                layerId = [layerId];
            }

            layerId.forEach(function (lId) {
                layerItem = getLayerItem(lId);
                if (layerItem && layerItem.setState(layerState, options)) {
                    //if we went to loaded, call a modified version of below function that only updates that one layer.
                    setLayerOffScaleState(lId);
                    isChanged = true;
                }
            });

            // update the toggle groups after changing state since toggles might disappear/be added
            if (isChanged) {
                ui.update();
            }
        }

        /**
        * Checks if any of the layers have data that is not visible and sets the appropriate layer state.
        * @method setLayerOffScaleStates
        * @private
        */
        function setLayerOffScaleStates() {
            var visibleLayers = RampMap.getVisibleLayers();
            var invisibleLayers = RampMap.getInvisibleLayers();

            function filterLayerIds(layers) {
                layers = layers
                    .map(function (l) {
                        if (l.ramp) {
                            if (l.ramp.config) {
                                // we prefer the config id, as the ramp core can sometimes append things to the actual
                                // layer object id to help bind layers
                                return l.ramp.config.id;
                            } else {
                                return l.id;
                            }
                        }
                    })
                    .filter(function (l) {
                        return (l);
                    });

                return layers;
            }

            visibleLayers = filterLayerIds(visibleLayers);
            setLayerState(visibleLayers, LayerItem.state.DEFAULT, true);

            invisibleLayers = filterLayerIds(invisibleLayers);
            setLayerState(invisibleLayers, LayerItem.state.OFF_SCALE, true);
        }

        /**
       * Checks if a specific layer has data that is not visible and sets the appropriate layer state.
       * @method setLayerOffScaleState
       * @param {String} layerId a layer id
       * @private
       */
        function setLayerOffScaleState(layerId) {
            var visibleLayers = RampMap.getVisibleLayers();
            var invisibleLayers = RampMap.getInvisibleLayers();
            var layer = RAMP.layerRegistry[layerId];
            var layerItem;

            function filterLayerIds(layers) {
                layers = layers
                    .map(function (l) {
                        if (l.ramp) {
                            if (l.ramp.config) {
                                // we prefer the config id, as the ramp core can sometimes append things to the actual
                                // layer object id to help bind layers
                                return l.ramp.config.id;
                            } else {
                                return l.id;
                            }
                        }
                    })
                    .filter(function (l) {
                        return (l);
                    });

                return layers;
            }

            visibleLayers = filterLayerIds(visibleLayers);
            invisibleLayers = filterLayerIds(invisibleLayers);
            if (visibleLayers.contains(layerId)) {
                setLayerState(layerId, LayerItem.state.DEFAULT, true);
            }

            if (invisibleLayers.contains(layerId)) {
                if (layer && RampMap.layerInLODRange(layer.maxScale, layer.minScale)) {
                    setLayerState(invisibleLayers, LayerItem.state.OFF_SCALE, true);
                } else {
                    setLayerState(layerId, LayerItem.state.ERROR, {
                        notices: {
                            error: {
                                message: i18n.t('addDataset.error.messageFeatureOutsideZoomRange'),
                            },
                        },
                    });
                    layerItem = layerGroups[GlobalStorage.layerType.feature].getLayerItem(layerId);
                    LayerItem.removeStateMatrixPart(layerItem.stateMatrix, 'controls', LayerItem.controls.RELOAD);
                    layerItem.setState(LayerItem.state.ERROR, null, true);
                }
            }
        }

        /**
        * Initiates a listener to handle tab deselected event
        *
        * @method initListeners
        * @private
        */
        function initListeners() {
            topic.subscribe(EventManager.GUI.TAB_DESELECTED, function (arg) {
                if (arg.tabName === 'filterManager') {
                    topic.publish(EventManager.GUI.SUBPANEL_CLOSE, { origin: 'filterManager' });
                }
            });

            topic.subscribe(EventManager.Map.ZOOM_END, function () {
                setLayerOffScaleStates();
            });

            // Layer loading features
            topic.subscribe(EventManager.LayerLoader.LAYER_UPDATING, function (arg) {
                // Add to list of updating layers and disable sorting handles
                updatingLayers.push(arg.layer);
                $('.sort-handle').hide();
            });

            // Layer done loading features
            topic.subscribe(EventManager.LayerLoader.LAYER_UPDATED, function (arg) {
                // Remove the layer from the array and check if any more layers are loading
                updatingLayers.splice(updatingLayers.indexOf(arg.layer), 1);
                if (updatingLayers.length === 0) {
                    // If no layers are loading re-enable the sorting handles
                    $('.sort-handle').show();
                }
            });

            // Layer removed from list
            topic.subscribe(EventManager.LayerLoader.LAYER_REMOVED, function (arg) {
                // Remove the layer from the array if it was loading, and check if any others are
                var index = updatingLayers.indexOf(arg.layer);
                if (index > -1) {
                    updatingLayers.splice(index, 1);
                    if (updatingLayers.length === 0) {
                        // If no layers are loading re-enable sorting handles
                        $('.sort-handle').show();
                    }
                }
            });

            // subscribe to Layer added event which is fired every time a layer is added to the map through layer loader
            topic.subscribe(EventManager.LayerLoader.LAYER_ADDED, function (args) {
                updateLayersStateMatrix(args.layerCounts, true);
                $('.filter-row-settings:visible').find('.nstSlider').each(function () {
                    $(this).nstSlider('refresh');
                });
            });

            // on each remove check if there are still wms layers in the layer list
            topic.subscribe(EventManager.LayerLoader.LAYER_REMOVED, function (args) {
                updateLayersStateMatrix(args.layerCounts, false);
            });
        }

        // TODO: temp function to be moved to state manager
        // returns an array of wms layers that can be queried
        function getQueryWMSLayers() {
            return Object
                .keys(RAMP.layerRegistry)
                .filter(function (layerId) {
                    var layer = RAMP.layerRegistry[layerId];
                    return layer.ramp.type === GlobalStorage.layerType.wms &&
                        layer.ramp.config.featureInfo;
                });
        }

        // TODO: temp function to be moved to state manager
        // returns true if there are wms layer that can be queries or false if there are no such layers
        function isThereQueryWMSLayers() {
            return getQueryWMSLayers().length > 0;
        }

        // updates layer item state matrixes based on whether any queriable wms layers are present in layer selector
        function updateLayersStateMatrix(layerCounts, isLayerAdded) {
            var featureLayerGroup = layerGroups[GlobalStorage.layerType.feature];
            var wmsLayerGroup = layerGroups[GlobalStorage.layerType.wms];
            var states = [
                LayerItem.state.DEFAULT,
                LayerItem.state.UPDATING,
                LayerItem.state.OFF_SCALE,
            ];

            // if there is at least one queriable wms layer, add placeholder toggles to feature layers and
            if (getQueryWMSLayers().length === 1 && isLayerAdded) {
                featureLayerGroup.layerItems.forEach(function (layerItem) {
                    LayerItem.addStateMatrixParts(layerItem.stateMatrix, LayerItem.partTypes.TOGGLES,
                        [
                            LayerItem.toggles.PLACEHOLDER,
                        ],
                        states
                    );

                    layerItem.refresh();
                });

                wmsLayerGroup.layerItems.forEach(function (layerItem) {
                    LayerItem.addStateMatrixParts(layerItem.stateMatrix, LayerItem.partTypes.TOGGLES,
                        [
                            RAMP.layerRegistry[layerItem.id].ramp.config.featureInfo ? LayerItem.toggles.QUERY :
                            LayerItem.toggles.PLACEHOLDER,
                        ],
                        states
                    );

                    layerItem.refresh();
                });

                ui.hideQueryToggles(false);
            } else if (getQueryWMSLayers().length === 0 && !isLayerAdded) {
                featureLayerGroup.layerItems.forEach(function (layerItem) {
                    LayerItem.removeStateMatrixParts(layerItem.stateMatrix, LayerItem.partTypes.TOGGLES,
                        [
                            LayerItem.toggles.PLACEHOLDER,
                        ],
                        states
                    );

                    layerItem.refresh();
                });

                wmsLayerGroup.layerItems.forEach(function (layerItem) {
                    LayerItem.removeStateMatrixParts(layerItem.stateMatrix, LayerItem.partTypes.TOGGLES,
                        [
                            LayerItem.toggles.PLACEHOLDER,
                        ],
                        states
                    );

                    layerItem.refresh();
                });

                ui.hideQueryToggles(true);
            }
        }

        // updates default layer item state matrix based on whether any queriable wms layers are present
        // in layer selector
        function getStateMatrixTemplate(layerType, layerRamp) {
            var stateMatrix = LayerItem.getStateMatrixTemplate();
            var featureToggles = [
                LayerItem.toggles.EYE,
                LayerItem.toggles.PLACEHOLDER,
            ];
            var wmsToggles = [
                LayerItem.toggles.EYE,
                LayerItem.toggles.PLACEHOLDER,
            ];
            var states = [
                    LayerItem.state.DEFAULT,
                    LayerItem.state.UPDATING,
                    LayerItem.state.OFF_SCALE,
            ];

            switch (layerType) {
                case GlobalStorage.layerType.feature:

                    // remove placeholder toggle if there are wms layers
                    if (!isThereQueryWMSLayers()) {
                        featureToggles.pop();
                    }

                    LayerItem.addStateMatrixParts(stateMatrix, LayerItem.partTypes.TOGGLES,
                        featureToggles,
                        states
                    );

                    // add a bounding box settings to the non-static feature layers only
                    if (!layerRamp.config.isStatic && layerRamp.config.layerExtent) {
                        LayerItem.addStateMatrixParts(stateMatrix, LayerItem.partTypes.SETTINGS,
                          [
                              LayerItem.settings.BOUNDING_BOX,
                          ],
                          states
                      );
                    }

                    // add switch to snapshot mode if it's a service-based feature layer
                    if (layerRamp.config.url) {
                        LayerItem.addStateMatrixParts(stateMatrix, LayerItem.partTypes.SETTINGS,
                          [

                              // if layer is in snapshot mode already, add an already checked switch
                              // TODO: dehardcode layer mode names
                              layerRamp.config.mode === 'snapshot' ? LayerItem.settings.ALL_DATA_CHECKED :
                                LayerItem.settings.ALL_DATA,
                          ],
                          states
                      );
                    }

                    break;

                case GlobalStorage.layerType.wms:
                    if (layerRamp.config.featureInfo) {
                        wmsToggles.pop();
                        wmsToggles.push(LayerItem.toggles.QUERY);
                    } else if (!isThereQueryWMSLayers()) {
                        wmsToggles.pop();
                    }

                    LayerItem.addStateMatrixParts(stateMatrix, LayerItem.partTypes.TOGGLES,
                        wmsToggles,
                        states
                    );

                    break;
            }

            return stateMatrix;
        }

        return {
            /**
            * Reads the application configuration and creates the legend and filter management widget
            * @method init
            * @constructor
            */
            init: function () {
                // Convenience config objects
                config = RAMP.config;

                // reset and load global template
                // TODO: move the following out from generateGlobalCheckboxes() and merge
                // filter_global_row_template_json into filter_row_template
                tmpl.cache = {};
                tmpl.templates = JSON.parse(TmplHelper.stringifyTemplate(filterManagerTemplateJson));

                ui.init();

                initListeners();
                setLayerOffScaleStates();
            },

            /**
            * Add a provided layer to the layer selector.
            * @param {String} layerType layer type - name of the layer group
            * @param {Object} layerRamp ramp object
            * @param {Object} [options] additional options for the layer item
            * @param {String} [options.state] the state to initialize in.  Default value is LOADING
            * @param {String} [options.notices] optional notices, for example error notices if the
            * layer cannot be loaded from the get go
            * @method addLayer
            */
            addLayer: function (layerType, layerRamp, options) {
                var layerGroup = layerGroups[layerType];
                var newLayer;

                options = options || {};

                // TODO: figure out how to handle ordering of the groups - can't have wms group before
                // feature layer group

                if (!layerGroup) {
                    layerGroup = new LayerGroup([], {
                        layerType: layerType,
                        layerState: LayerItem.state.LOADING,
                    });

                    layerGroups[layerType] = layerGroup;
                    ui.addLayerGroup(layerGroup.node);
                }

                // generate a state matrix based on layer type
                options.stateMatrix = getStateMatrixTemplate(layerType, layerRamp);

                // layer is user-added, add an extra notice to all states
                if (layerRamp.user) {
                    LayerItem.addStateMatrixPart(options.stateMatrix, LayerItem.partTypes.NOTICES,
                        LayerItem.notices.USER, [], true);
                    LayerItem.removeStateMatrixPart(options.stateMatrix, LayerItem.partTypes.CONTROLS,
                        LayerItem.controls.METADATA);
                }

                newLayer = layerGroup.addLayerItem(layerRamp.config, options);

                // TODO: check scale in cleaner way
                setLayerOffScaleStates();

                ui.update();
            },

            /**
            * Remove a layer from the layer selector.
            * @param {String} layerType layer type - name of the layer group
            * @param {String} layerId layer id of layer to remove
            * @method removeLayer
            */
            removeLayer: function (layerType, layerId) {
                var layerGroup = layerGroups[layerType];

                if (!layerGroup) {
                    //tried to remove a layer that doesn't exist
                    console.log('tried to remove layer from nonexistent group: ' + layerType);
                } else {
                    layerGroup.removeLayerItem(layerId);

                    //TODO REQUIRED?
                    ui.update();
                }
            },

            /**
            * Returns the state of the layer with the specified layer id.
            * @param {String} layerId a layer id
            * @method getLayerState
            * @private
            */
            getLayerState: function (layerId) {
                var layerItem = getLayerItem(layerId);

                if (layerItem) {
                    return layerItem.state;
                } else {
                    return null;
                }
            },

            /**
            * Set the state of the specified layer to the provided value. Public hook to call internal
            * setLayerState function.
            * @param {String} layerId a layer id
            * @param {String} layerState a state to set the specified layer to
            * @param {Object} [options] additional options to be passed to the layerItem upon setting state
            * @method setLayerState
            */
            setLayerState: function (layerId, layerState, options) {
                setLayerState(layerId, layerState, options);
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

                // query.outFields = outFieldsList;  //note: this list is overridden by fields in
                // featurelayer constructor
                queryTask.where = fl.objectIdField + '>0';

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
                    deferred.resolve(featureSet.features.map(function (feature) {
                        return feature.attributes[field];
                    }));
                });

                return deferred.promise;
            },
        };
    });
