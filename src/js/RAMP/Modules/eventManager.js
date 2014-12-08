/*global define */

/**
*
*
* @module UI
*/

/**
* EventManager class.
* A dictionary containing the names of all the events published and subscribed by this module.
* Users should publish and subscribe to events of this module using this dictionary instead of
* typing the name of the event.
*
* @class EventManager
* @static
*/

define([],
    function () {
        "use strict";
        return {
            FilterManager: {
                /**
                * Published whenever the "eye" button for a layer is clicked
                *
                * @event FilterManager.LAYER_VISIBILITY_TOGGLED
                * @for FilterManager
                * @param event {Object}
                * @param event.checked {boolean} true if the "eye" button is checked, false otherwise
                * @param event.node {Object} the input dom node that represents the checkbox
                */
                LAYER_VISIBILITY_TOGGLED: "filterManager/layer-visibility-toggled",

                /**
                * Published each time the transparency of a layer is modified.
                *
                * @event FilterManager.LAYER_TRANSPARENCY_CHANGED
                * @for FilterManager
                * @param event {Object}
                * @param event.layerId {String} the id of the layer
                * @param event.value {int} the value of the slider
                */
                LAYER_TRANSPARENCY_CHANGED: "filterManager/layer-transparency-changed",

                /**
                * Published whenever the "box" button for a layer is clicked
                *
                * @event FilterManager.BOX_VISIBILITY_TOGGLED
                * @for FilterManager
                * @param event {Object}
                * @param event.checked {Boolean} true if the "box" button is checked, false otherwise
                * @param event.node {Object} the input dom node that represents the checkbox
                */
                BOX_VISIBILITY_TOGGLED: "filterManager/box-visibility-toggled",

                /**
                * Published whenever the layer list is rearranged
                *
                * @event FilterManager.SELECTION_CHANGED
                * @for FilterManager
                * @param event {Object}
                * @param event.id {String} the layer Id
                * @param event.index {Integer} index of the layer that moved.  index is relative to the control,
                * not the layer stack in the map
                */
                SELECTION_CHANGED: "filtermanager/selection-changed",

                /**
                * Published after the ui for the filter manager finishes initializing.
                *
                * @event FilterManager.UI_COMPLETE
                * @for FilterManager
                */
                UI_COMPLETE: "filterManager/UIComplete",

                // SUBSCRIBED EVENTS
                /**
                * Tells the filter manager to toggle a layer on or off
                *
                * @event FilterManager.TOGGLE_LAYER_VISIBILITY [subscribed]
                * @for FilterManager
                * @param event {Object}
                * @param event.layerId {String} the name of the layer to toggle
                * @param event.state {boolean} true if the layer should be visible, false otherwise
                */
                TOGGLE_LAYER_VISIBILITY: "filterManager/toggle-layer-visibility",

                /**
                * Tells the filter manager to toggle a layer on or off
                *
                * @event FilterManager.TOGGLE_BOX_VISIBILITY [subscribed]
                * @for FilterManager
                * @param event {Object}
                * @param event.layerId {String} the name of the layer to toggle
                * @param event.state {boolean} true if the layer should be visible, false otherwise
                */
                TOGGLE_BOX_VISIBILITY: "filterManager/toggle-box-visibility"
            },

            GUI: {
                /**
                * Fires whenever the extended grid button is clicked
                *
                * @event GUI.DATAGRID_EXPAND
                * @for GUI
                */
                DATAGRID_EXPAND: "gui/datagrid-expand",

                /**
                * Fires whenever a tab has been deselected in the main panel
                *
                * @event gui.TAB_DESELECTED
                * @for GUI
                * @param {Object} evt the event Object
                * @param {String} evt.id  the id of the deselected tab
                * @param {String} evt.tabName the name of the deselected tab
                */
                TAB_DESELECTED: "gui/tab-deselected",

                /**
                * Fires whenever a tab has been selected in the main panel
                *
                * @event gui.TAB_SELECTED
                * @for GUI
                * @param {Object} evt the event Object
                * @param {String} evt.id the id of the selected tab
                * @param {String} evt.tabName the name of the selected tab
                */
                TAB_SELECTED: "gui/tab-selected",

                /**
                * Published each time the subpanel opens/closes
                *
                * @event gui.SUBPANEL_CHANGE
                * @for GUI
                * @param {Object} evt the event Object
                * @param {boolean} evt.visible true if the subpanel is opened, false otherwise
                * @param {String} evt.origin
                * @param {JObject} evt.container jQuery reference to the sub-panel container
                */
                SUBPANEL_CHANGE: "gui/subpanel-change",

                /**
                * Published each time the panel opens/closes
                *
                * @event gui.PANEL_CHANGE
                * @for GUI
                * @param {Object} evt the event Object
                * @param {boolean} evt.visible true if the panel is opened, false otherwise
                */
                PANEL_CHANGE: "gui/panel-change",

                /**
                * Published each time the help panel opens or closes.
                *
                * @event gui.HELP_PANEL_CHANGE
                * @for GUI
                * @param evt {Object} the event Object
                * @param evt.visible {boolean} true if the help panel is opened, false if the help panel is closed
                */
                HELP_PANEL_CHANGE: "gui/help-panel-change",

                /**
                * Published each time fullscreen is toggled
                *
                * @event gui.FULLSCREEN_CHANGE
                * @for GUI
                * @param evt {Object} the event Object
                * @param evt.fullscreen {boolean} true if fullscreen is on, false if fullscreen is off.
                */
                FULLSCREEN_CHANGE: "gui/fullscreen-change",

                /**
                * Published each time the layout changes.
                *
                * @event gui.LAYOUT_CHANGE
                * @for GUI
                */
                LAYOUT_CHANGE: "gui/layout-change",

                // SUBSCRIBED EVENTS
                /**
                * Toggles the main panel (i.e. collapses it if was expanded, and expands it if it was collapsed)
                *
                * @event gui.PANEL_TOGGLE [subscribed]
                * @for GUI
                */
                PANEL_TOGGLE: "gui/panel-toggle",

                /**
                * Opens the subpanel
                *
                * @event gui.SUBPANEL_OPEN [subscribed]
                * @for GUI
                * @param {SubPanelSettings} attr Settings for the SubPanel
                */
                SUBPANEL_OPEN: "gui/subpanel-open",

                /**
                * Closes the sub panel
                *
                * @event gui.SUBPANEL_CLOSE [subscribed]
                * @for GUI
                * @param origin {String} the name of the module that requested to close the subPanel (e.g. "filterManager")
                */
                SUBPANEL_CLOSE: "gui/subpanel-close",

                /**
                * Moves the panel up DOM hierarchy next to the sidePanel, or to other target
                *
                * @event gui.SUBPANEL_DOCK [subscribed]
                * @for GUI
                * @param origin {String} the name of the module that requested to dock the subPanel (e.g. "filterManager")
                * @param target {jNode} where to move the subPanel; if not supplied; sidePanel is used
                */
                SUBPANEL_DOCK: "gui/subpanel-dock",

                /**
                * Attaches subPanel node to the module that calls it in the DOM hierarchy
                *
                * @event gui.SUBPANEL_CAPTURE [subscribed]
                * @for GUI
                * @param consumeOrigin {}
                */
                SUBPANEL_CAPTURE: "gui/subpanel-capture",

                /**
                * Toggles the fullscreen
                *
                * @event gui.TOGGLE_FULLSCREEN [subscribed]
                * @for GUI
                * @param {Object} evt the event Object
                * @param {boolean} evt.expand true if we should go into fullscreen mode, false if we wish to
                * collapse to normal mode. If undefined, it toggles the fullscreen (i.e. make it fullscreen
                * if it was not, make it collapse to regard mode if it was fullscreen).
                */
                TOGGLE_FULLSCREEN: "gui/toggle-fullscreen",

                /**
                * Published each time the Add Layer panel opens or closes.
                *
                * @event gui/add-layer-panel-change
                * @for GUI
                * @param evt {Object} the event Object
                * @param evt.visible {boolean} true if the AddLayer panel is opened, false if the AddLayer panel is closed
                */
                ADD_LAYER_PANEL_CHANGE: "gui/add-layer-panel-change",

                /**
                 * Published each time a toolbar section / widget is opened. Used to close other toolbar sections / widgets.
                 *
                 * @event gui/toolbar-section-open
                 * @for GUI
                 * @param evt {Object} the event Object
                 * @param evt.id {String} id of the source section / widget
                 */
                TOOLBAR_SECTION_OPEN: "gui/toolbar-section-open",

                /**
                 * Published each time a toolbar section / widget is closed.
                 *
                 * @event gui/toolbar-section-close
                 * @for GUI
                 * @param evt {Object} the event Object
                 * @param evt.id {String} id of the source section / widget
                 */
                TOOLBAR_SECTION_CLOSE: "gui/toolbar-section-close",

                /**
                * Published when the gui module has completely finished rendering the UI.
                * The bootstrapper should wait for this event to fire before initializing map.
                * 
                * @event gui/toolbar-section-closegui/update-complete
                * @for GUI
                */
                UPDATE_COMPLETE: "gui/update-complete"
            },

            FeatureHighlighter: {
                /**
                * Permanently highlights a given feature on the map; display an interactive tooltip for this feature; reduces opacity of the `graphicGroup` layers.
                * Even when the user moves the cursor away, the feature stays highlighted; tooltip stays put.
                * Only one feature can be highlighted like this at a time.
                *
                * @event featureHighlighter.HIGHLIGHT_SHOW [subscribed]
                * @for FeatureHighlighter
                * @param {Object} eventAttr ESRI feature click even attributes
                */
                HIGHLIGHT_SHOW: "highlighter/highlight-show",

                /**
                * Dehighlights a currently highlighted feature on the map and restores opacity of the rest of the layers;
                * hides the interactive tooltip.
                *
                * @event featureHighlighter.HIGHLIGHT_HIDE [subscribed]
                * @for FeatureHighlighter
                */
                HIGHLIGHT_HIDE: "highlighter/highlight-hide",

                /**
                * Temporarilly highlights (hoverlights) a given feature on the map. Intended to be dehighlighted when the user moves the cursor away; to do that, publish HOVERLIGHT_HIDE event.
                * Effect is only visible when another feature is already permanently highlighted.
                * Only one feature can be highlighted like this at a time.
                *
                * @event featureHighlighter.HOVERLIGHT_SHOW [subscribed]
                * @for FeatureHighlighter
                * @param {Object} eventAttr ESRI feature click even attributes
                */
                HOVERLIGHT_SHOW: "highlighter/hoverlight-show",

                /**
                * Dehighlights a currently highlighted (hoverlighted) feature on the map without restoring opacity of the rest of the layers;
                *
                * @event featureHighlighter.HOVERLIGHT_HIDE [subscribed]
                * @for FeatureHighlighter
                */
                HOVERLIGHT_HIDE: "highlighter/hoverlight-hide",

                /**
                * Temporarilly highlights (zoomlightes) a given feature on the map.
                * Intended to be dehighlighted when the user makes an action like panning or zooming the map, publish ZOOMLIGHT_HIDE event.
                * Displays a temporary tooltip for this feature;
                * Only one feature can be highlighted (zoomlighted) like this at a time.
                *
                * @event featureHighlighter.ZOOMLIGHT_SHOW [subscribed]
                * @for FeatureHighlighter
                * @param {Object} eventAttr ESRI feature click even attributes
                */
                ZOOMLIGHT_SHOW: "highlighter/zoomlight-show",

                /**
                * Dehighlights a currently highlighted (zoomlighted) feature on the map;
                * Removes the tooltip.
                * Restores the opacity of the graphicGroup layers if no feature is highlighted at present.
                *
                * @event featureHighlighter.ZOOMLIGHT_HIDE [subscribed]
                * @for FeatureHighlighter
                */
                ZOOMLIGHT_HIDE: "highlighter/zoomlight-hide"
            },

            Maptips: {
                /**
                * Displays a simple, temporary maptip, positioning it over the `target` jObject; the content of the maptip is build from the
                * contents of the `graphic` object and the mapTip template specified in the config object.
                *
                * @event maptips.SHOW [subscribed]
                * @for Maptips
                * @param {jObject} target a node/svg object the user hovered over
                * @param graphic {Object} ESRI graphic object belonging to the target
                */
                SHOW: "maptips/show",

                /**
                * Displays an permanent, interactive maptip with a close button, positioning it over the `target` jObject; the content of the maptip is build from the
                * contents of the `graphic` object and the mapTip template specified in the config object.
                * The maptip will not be shown if it's covered by the open {{#crossLink "SubPanel"}}{{/crossLink}}.
                *
                * @event maptips.SHOW_INTERACTIVE [subscribed]
                * @param {jObject} target a node/svg object the user hovered over
                * @param graphic {Object} ESRI graphic object belonging to the target
                */
                SHOW_INTERACTIVE: "maptips/showInteractive",

                /**
                * Is fired when an interactive maptip is shown and {{#crossLink "Maptip"}}{{/crossLink}} detects if the maptip is hidden behind the
                * {{#crossLink "SubPanel"}}{{/crossLink}} and extent change is needed. Sets the `scroll` payload attribute to true if the extent change is not needed
                * and the {{#crossLink "Datagrid"}}{{/crossLink}} should scroll to the currently highlighted row.
                *
                * @event maptips.EXTENT_CHANGE [subscribed]
                * @param {Boolean} scroll indicates if the {{#crossLink "Datagrid"}}{{/crossLink}} should scroll to the currently highlighted row
                */
                EXTENT_CHANGE: "maptip/extent-change",

                /**
                * Repositions the interactive tooltip that is already displayed when the user pans or zooms the map, or the map is otherwise
                * adjusted. If the tooltip is hidden from the view by the {{#crossLink "SubPanel"}}{{/crossLink}} or the edge of the map container,
                * it is hidden from the page.
                *
                * @event maptips.REPOSITION_INTERACTIVE [subscribed]
                * @for Maptips
                * @param {Number} offset New tooltip offset relative to the shape it's attached too; when zooming, the shape changes its size and the
                * offset needs to be recalculated to keep the tooltip in relative center
                */
                REPOSITION_INTERACTIVE: "maptips/repositionInteractive"
            },

            Map: {
                // NOTE: Map events fall into two categories.  There are native RAMP events and others which republish events from the ESRI API.
                // Events which are native to RAMP are prefixed with rampMap/ while ESRI republished events should be prefixed with map/

                /**
                 * Indicates that all the map layers are loaded.
                 *
                 * @event RampMap.ALL_LAYERS_LOADED
                 * @for RampMap
                 *
                 */
                ALL_LAYERS_LOADED: "rampMap/all-layers-loaded",

                /**
                * Centers the map at the given point.
                *
                * @event RampMap.CENTER_AT [subscribed]
                * @for RampMap
                * @param event {Object}
                * @param event.x {number}
                * @param event.y {number}
                * @param event.spatialReference {Object}
                * @param event.spatialReference.wkid {Integer}
                */
                CENTER_AT: "rampMap/center-at",

                /**
                * Center and zoom the map to the given point.
                *
                * @type {String}
                * @event RampMap.CENTER_AND_ZOOM [subscribed]
                * @for RampMap
                * @param event {Object}
                * @param event.graphic {esri/graphic} the graphic object to center the map on
                * @param event.level {Integer} the zoom level
                * @param event.callback {function} the function to call after the center and zoom action is complete
                */
                CENTER_AND_ZOOM: "rampMap/center-and-zoom",

                /**
                * Changes the current extent of the map.
                *
                * @event RampMap.SET_EXTENT [subscribed]
                * @for RampMap
                * @param event {Object}
                * @param event.extent.xmin {number}
                * @param event.extent.ymin {number}
                * @param event.extent.xmax {number}
                * @param event.extent.ymax {number}
                * @param event.callback {function} the function to call after the extent change is complete
                */
                SET_EXTENT: "rampMap/set-extent",

                /**
                * Republishes a standard ESRI map click event 'click'.
                *
                * @event RampMap.CLICK
                * @for RampMap
                */
                CLICK: "map/click",

                /**
                * Fires when the reorder of the layers in the layer managers has completed finished.
                *
                * @event RampMap.REORDER_END
                * @for RampMap
                */
                REORDER_END: "map/reorder-end",

                /**
                * Republishes a standard ESRI map compnent event `update-end`.
                *
                * @event RampMap.UPDATE_END
                * @for RampMap
                */
                UPDATE_END: "map/update-end",

                /**
                * Republishes a standard ESRI map compnent event `extent-change`.
                *
                * @event RampMap.EXTENT_CHANGE
                * @for RampMap
                */
                EXTENT_CHANGE: "map/extent-change",

                /**
                * Republishes a standard ESRI map compnent event `zoom-start`.
                *
                * @event RampMap.ZOOM_START
                * @for RampMap
                */
                ZOOM_START: "map/zoom-start",

                /**
                * Republishes a standard ESRI map compnent event `zoom-end`.
                *
                * @event RampMap.ZOOM_END
                * @for RampMap
                */
                ZOOM_END: "map/zoom-end",

                /**
                * Republishes a standard ESRI map compnent event `pan-start`.
                *
                * @event RampMap.PAN_START
                * @for RampMap
                */
                PAN_START: "map/pan-start",

                /**
                * Republishes a standard ESRI map compnent event `pan-end`.
                *
                * @event RampMap.PAN_END
                * @for RampMap
                */
                PAN_END: "map/pan-end",

                /**
                * Fires when a layer is added by a user
                *
                * @event RampMap.ADD_LAYER
                * @for RampMap
                */
                ADD_LAYER: "map/add-layer",

                /**
                * Fires when a layer added by a user is ready to view
                *
                * @event RampMap.ADD_LAYER_READY
                * @for RampMap
                */
                ADD_LAYER_READY: "map/add-layer-ready"
            },

            BasemapSelector: {
                /**
                * Fires whenever the basemap changes
                *
                * @event baseMapSelector/basemap-changed
                * @for BaseMapSelector
                * @param {Object} evt the event object
                * @param {String} evt.id the id of the selected basemap
                * @param {String} evt.title the title of the selected basemap
                * @param {String} evt.cssStyle
                */
                BASEMAP_CHANGED: "basemapSelector/basemap-changed",

                /**
                * Fires after the basemap selector finished updating its UI (on page load)
                *
                * @event baseMapSelector/UIComplete
                * @for BaseMapSelector
                * @param {Object} evt the event object
                * @param {String} evt.title the title of the basemap that is selected
                */
                UI_COMPLETE: "basemapSelector/UIComplete",

                // SUBSCRIBED EVENTS
                /**
                * Changes the selected basemap
                *
                * @event baseMapSelector/toggle [subscribed]
                * @for BaseMapSelector
                * @param {Object} evt the event object
                * @param {String} evt.id the id of the basemap that is to be selected
                */
                TOGGLE: "basemapSelector/toggle"
            },

            Datagrid: {
                /**
                * Applies a spatial filter to the datagrid (i.e. only visible points in the current
                * extent will be displayed in the datagrid)
                *
                * @event datagrid.APPLY_EXTENT_FILTER [subscribed]
                * @for Datagrid
                */
                APPLY_EXTENT_FILTER: "datagrid/applyExtentFilter",

                /**
                * Fires when the table has finished drawing
                *
                * @event datagrid.DRAW_COMPLETE
                */
                DRAW_COMPLETE: "datagrid/draw-complete",

                /**
                * Fires when the extent-filter has finished updating
                *
                * @event datagrid.EXTENT_FILTER_END
                */
                EXTENT_FILTER_END: "datagrid/extent-filter-end",

                /**
                * Highlights the row corresponding to the given `graphic` object of the selected feature.
                *
                * @event datagrid.HIGHLIGHTROW_SHOW
                * @param event {Object}
                * @param event.graphic {Object} ESRI graphic object corresponding to the selected feature
                */
                HIGHLIGHTROW_SHOW: "datagrid/highlightrow-show",

                /**
                * Dehighlights the currently highlighted row.
                *
                * @event datagrid.HIGHLIGHTROW_HIDE
                */
                HIGHLIGHTROW_HIDE: "datagrid/highlightrow-hide",
                /**
                * Zoomlights the row corresponding to the given `graphic` object of the zoomed to feature.
                *
                * @event datagrid.ZOOMLIGHTROW_SHOW
                * @param event {Object}
                * @param event.graphic {Object} ESRI graphic object corresponding to the zoomed to feature
                */
                ZOOMLIGHTROW_SHOW: "datagrid/zoomlightrow-show",

                /**
                * Dehighlights the currently zoomlighted row.
                *
                * @event datagrid.ZOOMLIGHTROW_HIDE
                *
                * @for Datagrid
                */
                ZOOMLIGHTROW_HIDE: "datagrid/zoomlightrow-hide"
            },

            Navigation: {
                /**
                * Published whenever the user clicks on the pan buttons.
                *
                * @event Navigation.PAN
                */
                PAN: "navigation/pan",

                /**
                * Published whenever the user tries to zoom using the arrow buttons.
                *
                * @event Navigation.ZOOM_STEP
                */
                ZOOM_STEP: "navigation/zoom-step",

                /**
                * Published whenever the user tries to zoom using the slider.
                *
                * @event Navigation.ZOOM
                */
                ZOOM: "navigation/zoom",

                /**
                * Published whenever the user clicks on the full extent button in the
                * navigation widget.
                *
                * @event Navigation.FULL_EXTENT
                */
                FULL_EXTENT: "navigation/full-extent"
            },

            BookmarkLink: {
                /**
               * Published whenever the user clicks on the get link button in the
               * map toolbar.
               *
               * @event bookmark.GETLINK_PANEL_CHANGED
               */
                GETLINK_PANEL_CHANGED: "bookmark/getlinkpanel-changed"
            },

            Advanced: {
                /**
                * Published whenever the user clicks on the get link button in the
                * map toolbar.
                *
                * @event advanced.ADVANCED_PANEL_CHANGED
                */
                ADVANCED_PANEL_CHANGED: "advanced/advancedpanel-changed"
            }
        };
    });
