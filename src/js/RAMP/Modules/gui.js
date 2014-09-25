/*global define, $, window, TweenLite, TimelineLite, tmpl, i18n, console, jQuery */
/*jslint white: true */

/**
* UI submodule
*
* @module RAMP
* @submodule UI
* @main UI
*/

/**
* A class for handling most of the GUI on the page.
*
* @class GUI
* @static
* @uses dojo/_base/array
* @uses dojo/topic
* @uses dojo/_base/lang
* @uses dojo/Deferred
* @uses dojo/domReady!
* @uses GlobalStorage
* @uses EventManager
* @uses Theme
* @uses templates/sub_panel_Template.html
* @uses templates/sub_panel_template.json
* @uses templates/sub_panel_content_Template.html
* @uses Util
* @uses Dictionary
* @uses PopupManager
* @uses TmplHelper
* @uses dojo/domReady!
*/
define([
// Dojo
        "dojo/_base/array", "dojo/topic", "dojo/_base/lang", "dojo/Deferred",

// Ramp
        "ramp/globalStorage", "ramp/eventManager",

        "themes/theme",

// Text
        "dojo/text!./templates/sub_panel_template.json",

// Util
        "utils/util", "utils/dictionary", "utils/popupManager", "utils/tmplHelper",

// Dom Ready
        "dojo/domReady!"
],

    function (
    // Dojo
        dojoArray, topic, dojoLang, Deferred,

    // Ramp
        GlobalStorage, EventManager,

        Theme,

    // Text
        subPanelTemplate,

    // Util
        UtilMisc, utilDict, popupManager, tmplHelper) {
        "use strict";

        var jWindow = $(window),

            panelTabs = $("ul#tabs"),

            mapContent = $("#mapContent"),
            loadIndicator = mapContent.find("#map-load-indicator"),

            subPanels = {},

        // subPanelAttribute definition

        /**
        * A class holding properties of the SubPanel.
        *
        * @class SubPanelSettings
        * @for SubPanel
        */
            subPanelAttr = {
                /**
                * A name used to identify the subpanel being opened (e.g. "Details", "Metadata")
                *
                * @property panelName
                * @for SubPanelSettings
                * @type {String}
                * @default ""
                */

                panelName: "",
                /**
                * Title of the content to be displayed on the SubPanel (e.g. "CESI Water Quality Indicators")
                *
                * @property title
                * @type {String}
                * @default ""
                */

                title: "",
                /**
                * The text inside the subpanel. Can be String or a jQuery object. All nodes sporting CSS class
                * ".shorten-candidate" are treated to the shortening procedure - long strings are curtailed, and [more/less] links are placed at their ends.
                *
                * @property content
                * @type {String | jObject}
                * @default null
                */

                content: null,

                templateKey: "summary_sub_panel_container",
                /**
                * The node after which the panel will be inserted (e.g. node.find(".layer-details")).
                *
                * @property target
                * @type {jObject}
                * @default null
                */

                target: null,
                /**
                * The name of the module that requested to open the SubPanel (e.g. "filterManager"). Used for identification of the panel's loyalty.
                *
                * @property origin
                * @type {String}
                * @default ""
                */

                origin: "",
                /**
                * A unique id of the SubPanel. If none provided, a random one is generated. It is used to determine the animation and update function
                * to run on content update.
                *
                * @property guid
                * @type {String}
                * @default ""
                */

                guid: "",
                /**
                * Indicates that the open SubPanel request is a content update to the already opened SubPanel.
                * Does not trigger any of the `doOn-` or `doAfter-` functions.
                *
                * __Use case:__ the uses clicks on the metadata button.
                * 1. A request to open a SubPanel is sent with only the title since the metadata content is not yet available
                * 2. Metadata is fetched from the server
                * 3. A second request to open a SubPanel is sent having `update` set to `true` and featuring the __same__ `guid` as the first request
                * 4. Only the content of the SubPanel is updated; no extra animations are triggered
                *
                * @property update
                * @type {Boolean}
                * @default false
                */

                update: false,
                /**
                * The callback function when the panel starts the opening animation; also triggered by updating panel content; can be triggered many times.
                *
                * @property doOnOpen
                * @type {Function}
                * @default null
                */

                doOnOpen: null,
                /**
                * The callback function when the panel finishes the opening animation; also triggered by updating panel content; can be triggered many times.
                *
                * @property doAfterOpen
                * @type {Function}
                * @default null
                */

                doAfterOpen: null,
                /**
                * The callback function when the panel starts the closing animation; also triggered by updating panel content; can be triggered many times.
                *
                * @property doOnHide
                * @type {Function}
                * @default null
                */

                doOnHide: null,
                /**
                * The callback function when the panel becomes hidden; also triggered by updating panel content; can be triggered many times.
                *
                * @property doAfterHide
                * @type {Function}
                * @default null
                */

                doAfterHide: null,
                /**
                * The callback function when the panel is completely closed, its nodes destroyed; can be triggered only once in a lifespan of the panel.
                *
                * @property doOnDestroy
                * @type {Function}
                * @default null
                */

                doOnDestroy: null,
                /**
                * The callback function executed after the SubPanel content is updated.
                * __Doesn't work correctly yet.__
                *
                * @property doAfterUpdate
                * @type {Function}
                * @default null
                */

                doAfterUpdate: null,
                /**
                * The target number of chars after which a content text node will be shortened.
                *
                * @property showChars
                * @type {Number}
                * @default 170
                */

                showChars: 170
            },

        // Panel Prototype

        /**
        * [subPanelPrototype description]
        *
        * @class SubPanel
        * @constructor
        * @for GUI
        */
            subPanelPrototype = {
                /**
                * Indicates if the closing animation is under way.
                *
                * @property _closing
                * @private
                * @for SubPanel
                * @type {Boolean}
                * @default false
                */

                _closing: false,
                /**
                * Holds a deferred that would destroy the panel after the closing animation completes. May be interrupted.
                *
                * @property _destroyDeferred
                * @type {Deferred}
                * @private
                * @default null
                */

                _destroyDeferred: null,
                /**
                * SubPanel attributes
                *
                * @property _attr
                * @private
                * @default null
                * @type {SubPanelSettings}
                */

                _attr: null,
                /**
                * Indicates if the SubPanel is visible at the moment. Doesn't make the panel visible or invisible, just prevents animations on the content
                * to run when it is set to `true`.
                *
                * @property _visible
                * @private
                * @default false
                * @type {Boolean}
                */

                _visible: false,
                /**
                * The outermost `div` of the SubPanel.
                *
                * @property container
                * @default null
                * @type {jObject}
                */

                container: null,
                /**
                * The inner `div` of the SubPanel. Closing and opening animations are run on this `div`.
                *
                * @property panel
                * @default null
                * @type {jQobject}
                */

                panel: null,
                /**
                * `div` housing the content of the SubPanel, including its title.
                *
                * @property _subPanelContentDiv
                * @private
                * @default null
                * @type {jObject}
                */

                _subPanelContentDiv: null,
                /**
                * Heading of the content in the SubPanel.
                *
                * @property _panelTitle
                * @private
                * @default null
                * @type {jObject}
                */

                _panelTitle: null,
                /**
                * `div` housing the content of the SubPanel, excluding its title.
                *
                * @property _panelContentDiv
                * @private
                * @default null
                * @type {jObject}
                */

                _panelContentDiv: null,
                /**
                * Default duration of the SubPanel animation in milliseconds.
                *
                * @property _animatePanelDuration
                * @private
                * @default 0.5
                * @type {Number}
                */

                _animatePanelDuration: 0.5, //0.4,

                timeLine: null,

                /**
                * Apply the shortening plugin to the panel data
                *
                * @method parseContent
                * @param  {jObject} data Content to be shortened
                * @return {jObject} Content with after shortening long text nodes
                */
                parseContent: function (data) {
                    //console.log(this._attr.showChars, jQuery.type(data), data);
                    return (jQuery.type(data) === "object" ? data : $(data))
                        .find(".shorten-candidate").shorten({
                            showChars: this._attr.showChars
                        })
                        .removeClass("shorten-candidate").end();
                },
                /**
                * Returns this SubPanel's settings object.
                *
                * @method getAttributes
                * @return {SubPanelSettings} This SubPanel's settings
                */
                getAttributes: function () {
                    return this._attr;
                },
                /**
                * Returns this SubPanel's container `div`.
                *
                * @method getContainer
                * @return {jobject} This SubPanel's `div`
                */
                getContainer: function () {
                    return this.container;
                },
                /**
                * Returns the inner `div` of the SubPanel
                *
                * @method getPanel
                * @return {jObject} The inner `div` of the SubPanel
                */
                getPanel: function () {
                    return this.panel;
                },
                /**
                * Returns the `origin` of this SubPanel.
                *
                * @method getOrigin
                * @return {String} The `origin` of this SubPanel
                */
                getOrigin: function () {
                    return this._attr.origin;
                },
                /**
                * Returns the `guid` of this SubPanel.
                *
                * @method getOrigin
                * @return {String} The `guid` of this SubPanel
                */
                getGuid: function () {
                    return this._attr.guid;
                },
                /**
                * Destroys this SubPanel.
                *
                * @method destroy
                * @param  {Number} speed    The duration of the animation in milliseconds
                * @param  {Deferred} deferred The deferred to be resolved after the SubPanel is destroyed
                */
                destroy: function (speed, deferred) {
                    if (this._attr.doOnHide) {
                        this._attr.doOnHide();
                    }

                    this._closing = true;
                    this._destroyDeferred = deferred;

                    // remove CSS animation class to prevent flickering
                    this._subPanelContentDiv.find(".fadeInDown").removeClass("fadeInDown");

                    //sidePanel.getContainer().after(this.container);
                    layoutController.getPanelContainer().before(this.container);
                    //adjutSubPanelDimensions(this);

                    layoutController.subPanelChange(false, this._attr.origin, this.container, false);

                    this.timeLine.eventCallback("onReverseComplete",
                        function () {
                            if (this._attr.doAfterHide) {
                                this._attr.doAfterHide();
                            }
                            if (this._attr.doOnDestroy) {
                                this._attr.doOnDestroy();
                            }
                            this._visible = false;
                            layoutController.subPanelChange(false, this._attr.origin, null, true);

                            this.container.remove();

                            if (deferred) {
                                deferred.resolve(true);
                            }
                        }, [], this);

                    this.timeLine.reverse();
                },

                /**
                * Reopens the SubPanel - stops the closing animation and initiates the opening animation.
                *
                * @method reopen
                */
                reopen: function () {
                    //this.panel.stop();
                    this.timeLine.pause();
                    this._closing = false;
                    if (this._destroyDeferred) {
                        this._destroyDeferred.cancel();
                        this._destroyDeferred = null;
                    }

                    this.open();
                },

                /**
                * Opens the SubPanel. Sends out `EventManager.GUI.SUBPANEL_CHANGE` event.
                *
                * @method open
                */
                open: function () {
                    if (this._attr.doOnOpen) {
                        this._attr.doOnOpen();
                    }
                    this._visible = true;
                    layoutController.subPanelChange(true, this._attr.origin, this.container, false);

                    this.timeLine.play();
                },

                /**
                * Assigns a new origin to the SubPanel.
                *
                * @method changeOrigin
                * @param  {String} newOrigin The new origin of the SubPanel.
                */
                changeOrigin: function (newOrigin) {
                    this._attr.origin = newOrigin;
                },

                /**
                * Shifts the SubPanel to the new node in the DOM.
                *
                * @method shiftTarget
                * @param  {jObject} newTarget A node in the DOM to shift the SubPanel to
                */
                shiftTarget: function (newTarget) {
                    if (this._attr.target !== newTarget) {
                        // remove animation class to prevent flickering of data
                        this._subPanelContentDiv.find(".fadeInDown").removeClass("fadeInDown");
                        newTarget.after(this.container);
                        this._attr.target = newTarget;
                    }
                },

                /**
                * Creates a new instance of SubPanel.
                *
                * @method create
                * @param  {SubPanelSettings} a Settings for the SubPanel
                */
                create: function (a) {
                    var //subPanelContent,
                        subPanelString,
                        parsedContent;

                    console.log("create panel, ", a.origin);

                    a.guid = a.guid || UtilMisc.guid();

                    dojoLang.mixin(this._attr, a);

                    tmpl.cache = {};
                    tmpl.templates = subPanelTemplate;

                    subPanelString = tmpl(this._attr.templateKey,
                        dojoLang.mixin(
                            this._attr,
                            {
                                closeTitle: i18n.t('gui.actions.close')
                            }
                        )
                    );

                    //subPanelContent = String.format(subPanelContentTemplate, this._attr.panelName, this._attr.title);
                    //subPanelString = String.format(subPanelTemplate2, this._attr.containerClass, subPanelContent);

                    this.container = $(subPanelString).insertAfter(this._attr.target);
                    this.panel = this.container.find(".sub-panel");

                    this._subPanelContentDiv = this.panel.find(".sub-panel-content");
                    this._panelTitle = this.panel.find(".panel-title");
                    this._panelContentDiv = this.panel.find(".panel-content-div");

                    // set content
                    parsedContent = this.parseContent(this._attr.content);
                    this._panelContentDiv.empty().append(parsedContent);

                    this.timeLine = new TimelineLite(
                        {
                            paused: true,
                            onComplete: function () {
                                if (this._attr.doAfterOpen) {
                                    this._attr.doAfterOpen();
                                }

                                layoutController.subPanelChange(true, this._attr.origin, this.container, true);
                            },
                            onCompleteScope: this
                        })
                        .to(this.panel, this._animatePanelDuration,
                            {
                                left: 0,
                                ease: "easeOutCirc"
                            });

                    Theme.tooltipster(this.container);

                    this.update(this._attr);
                },

                /**
                * Performs an update of the content and title of the SubPanel, running appropriate animation and `doOn-` / `doAfter-` functions.
                *
                * @method update
                * @param  {SubPanelSettings} a New settings for the SubPanel
                */
                update: function (a) {
                    // helper functions
                    var animateContentDuration = 300,
                        sOut = '<ul class="loadingAnimation"><li></li><li></li><li></li><li></li><li></li><li></li></ul>',

                        updateDefered = [new Deferred(), new Deferred()],

                        animateContent = function (node, newData, d) {
                            if (newData) {
                                node.addClass('animated fadeOutDown');
                                window.setTimeout(dojoLang.hitch(this,
                                        function () {
                                            node
                                            //.html(newData)
                                            .empty().append(newData)
                                                .removeClass("fadeOutDown")
                                                .addClass('animated fadeInDown'); //.find(".shorten-candidate").shorten();

                                            d.resolve();
                                        }),
                                    animateContentDuration);
                            }
                        },

                        setContent = function (node, oldData, newData, parsedData, visible, d) {
                            newData = (newData === null) ? parsedData = sOut : newData;
                            if (newData) {
                                if (newData !== oldData) {
                                    if (visible) {
                                        //ideally, need to wait until the animation completes before proceeding?
                                        animateContent(node, parsedData, d);
                                    } else {
                                        node.empty().append(parsedData);
                                        d.resolve();
                                    }
                                } else {
                                    d.resolve();
                                }
                            } else {
                                d.resolve();
                            }
                        },

                        updateContent = dojoLang.hitch(this,
                            function (a) {
                                /*this._subPanelContentDiv.animate({
                                    scrollTop: 0
                                }, animateContentDuration, "easeOutCirc");*/

                                TweenLite.to(this._subPanelContentDiv, animateContentDuration / 1000,
                                    {scrollTop: 0, ease: "easeOutCirc"});

                                setContent(this._panelTitle, this._attr.title, a.title, a.title, this._visible, updateDefered[0]);
                                setContent(this._panelContentDiv, this._attr.content, a.content, this.parseContent(a.content), this._visible, updateDefered[1]);

                                dojoLang.mixin(this._attr, a);
                            }
                        );

                    // doAfterUpdate should be called AFTER update (animation) completes...
                    UtilMisc.afterAll(updateDefered, function () {
                        if (a.doAfterUpdate) {
                            a.doAfterUpdate();
                        }
                    });

                    // panel is closing; new data is not an update
                    if (this._closing && !a.update) {
                        //
                        if (this._attr.guid !== a.guid) {
                            if (this._attr.doOnHide) {
                                this._attr.doOnHide();
                            }
                            if (this._attr.doAfterHide) {
                                this._attr.doAfterHide();
                            }

                            // move panel to the new target
                            a.target.after(this.container);
                            updateContent(a);
                        }

                        this.reopen();

                        // panel is not closing
                    } else if (!this._closing) {
                        // data is not an update
                        if (!a.update && this._attr.guid !== a.guid) {
                            if (this._attr.doOnHide) {
                                this._attr.doOnHide();
                            }
                            if (this._attr.doAfterHide) {
                                this._attr.doAfterHide();
                            }

                            // move panel to the new target
                            a.target.after(this.container);
                            updateContent(a);

                            if (a.doOnOpen) {
                                a.doOnOpen();
                            }
                            if (a.doAfterOpen) {
                                a.doAfterOpen();
                            }
                        }

                        // guid is the same - data can update or not (should be an update)
                        //if (a.update && attr.guid === a.guid) {
                        if (this._attr.guid === a.guid) {
                            updateContent(a);
                        }
                    }
                }
            },

            helpToggle = $("#helpToggle"),
            helpSectionContainer = $("#help-section-container"),
            helpSection = $("#help-section"),

            addLayerToggle = $("#addLayer-toggle"),
            addLayerSectionContainer = $("#addLayer-section-container"),
        //AddLayerSection = $("#addLayer-section"),

        //viewPortHeight,

            cssButtonPressedClass = "button-pressed",
            cssExpandedClass = "state-expanded",

            helpPanelPopup,
            addLayerPanelPopup,

            transitionDuration = 0.5,

            layoutController;

        layoutController = (function () {
            var viewport = $(".viewport"),
                mapDiv = $("#map-div"),
                mapContent = $("#mapContent"),
                fullScreenToggle = $("#fullScreenToggle"),
                fullScreenPopup,

                mapToolbar = $("#map-toolbar"),
                basemapControls = $("#basemapControls"),

                panelDiv = $("#panel-div"),
                panelToggle = $("#panel-toggle"),
                panelPopup,
                panelWidthDefault,

                windowWidth,

                duration = 0.5,

                layoutChange,

                _isFullData = false,
                fullDataTimeLine = new TimelineLite({
                    paused: true,
                    onComplete: function () {
                        adjustHeight();
                        layoutChange();
                        console.log("finished", EventManager.Datagrid.APPLY_EXTENT_FILTER);
                        //topic.publish(EventManager.Datagrid.APPLY_EXTENT_FILTER);
                    },
                    onReverseComplete: function () {
                        adjustHeight();
                        layoutChange();
                        console.log("reverse finished", EventManager.Datagrid.APPLY_EXTENT_FILTER);
                        //topic.publish(EventManager.Datagrid.APPLY_EXTENT_FILTER);
                    }
                }),

                panelToggleTimeLine = new TimelineLite({ paused: true }),
                fullDataSubpanelChangeTimeLine = new TimelineLite({ paused: true });

            /**
            * Fires an event when the layout of the page changes.
            *
            * @method layoutChange
            * @private
            */
            layoutChange = function () {
                if (!_isFullData) {
                    console.log("GUI --> EventManager.GUI.LAYOUT_CHANGE");
                    topic.publish(EventManager.GUI.LAYOUT_CHANGE);
                }
            };

            function adjustHeight() {
                helpSection.css({
                    "max-height": jWindow.height() - (_isFullData ? jWindow.height() * 0.2 : mapToolbar.offset().top) - 90 // 56 is an arbitrary-wide gap between the help panel and the upper toolbar
                });
            }

            function onFullScreenComplete() {
                adjustHeight();
                layoutChange();
                
                topic.publish(EventManager.GUI.FULLSCREEN_CHANGE, {
                    visible: Theme.isFullScreen()
                });
            }

            /**
            * Return the default width of the SidePanel.
            *
            * @method getPanelWidthDefault
            * @private
            * @return {Number} The default width of the SidePanel
            */
            function getPanelWidthDefault() {
                if (!panelWidthDefault) {
                    panelWidthDefault = panelDiv.width();
                }

                return panelWidthDefault;
            }

            function createTimelines() {
                // fullDataTransition
                fullDataTimeLine
                    .set(viewport, { className: "+=full-data-mode" })
                    .fromTo(mapDiv, transitionDuration, { width: "auto" }, { right: "auto", width: 35, ease: "easeOutCirc" }, 0)

                    .fromTo(mapContent, transitionDuration, { opacity: 1 }, { opacity: 0, ease: "easeOutCirc" }, 0)
                    .set(mapContent, { top: "500px" })

                    .to(panelToggle, transitionDuration, { right: -13, ease: "easeOutCirc" }, 0)
                    .set(panelToggle, { display: "none" })

                    .to(basemapControls, transitionDuration / 2, { opacity: 0, ease: "easeOutCirc" }, 0)
                    .to(basemapControls, 0, { display: "none" }, transitionDuration / 2)
                    .fromTo(mapToolbar, transitionDuration / 2,
                        { width: "100%", height: "32px" },
                        { width: "32px", height: $("#map-div").height(), ease: "easeOutCirc" }, duration / 2)

                    .to(mapToolbar.find(".map-toolbar-item-button span"), transitionDuration / 2, { width: 0, ease: "easeOutCirc" }, 0)
                    .set(mapToolbar.find(".map-toolbar-item-button span"), { display: "none" }, transitionDuration / 2)

                    .fromTo(panelDiv.find(".tabs li:first"), transitionDuration, { width: "50%" }, { width: "0%", ease: "easeOutCirc" }, 0)
                    .fromTo(panelDiv.find(".tabs li:last"), transitionDuration, { width: "50%" }, { width: "100%", className: "+=font-large", ease: "easeOutCirc" }, 0);

                // panelToggleTransition
                panelToggleTimeLine
                    .fromTo(panelDiv, transitionDuration, { right: 0 }, { right: -getPanelWidthDefault(), ease: "easeOutCirc" }, 0)
                    .set(panelDiv, { display: "none" }, transitionDuration)
                    .fromTo(mapDiv, transitionDuration, { right: getPanelWidthDefault() }, { right: 0, ease: "easeOutCirc" }, 0);

                fullDataSubpanelChangeTimeLine
                    .fromTo(panelDiv, transitionDuration,
                        { right: "0px", left: "35px" },
                        { left: "35px", right: getPanelWidthDefault(), ease: "easeOutCirc", immediateRender: false });
                    
            }

            function killTimelines() {
                fullDataSubpanelChangeTimeLine.kill();
                panelToggleTimeLine.kill();
                fullDataTimeLine.kill();
            }

            function recreateTimelines() {
                panelWidthDefault = null;
                killTimelines();
                createTimelines();
            }
            
            /**
            * Publishes `PANEL_CHANGE` event when the visibility of the SidePanel changes.
            *
            * @method panelChange
            * @param  {Boolean} visible Indicates whether the SidePanel is visible or not
            * @for SidePanel
            * @private
            */
            function panelChange(visible) {
                topic.publish(EventManager.GUI.PANEL_CHANGE, {
                    visible: visible
                });
            }

            /**
            * Slides the SidePanel open.
            *
            * @method openPanel
            * @private
            * @param  {Deferred} d A deferred to be resolved upon completion of the animation
            */
            function openPanel(d) {
                /*jshint validthis: true */
                panelToggleTimeLine.eventCallback("onReverseComplete",
                        function () {
                            layoutChange();
                            panelChange(true);

                            panelToggle
                                .tooltipster("content", i18n.t("gui.actions.close"))
                                .find("span.wb-invisible").text(i18n.t("gui.actions.close"));

                            d.resolve();
                        }, [], this);

                panelToggleTimeLine.reverse();
            }

            /**
            * Slide the SidePanel close
            *
            * @method closePanel
            * @private
            * @param  {Deferred} d A deferred to be resolved upon completion of the animation
            */
            function closePanel(d) {
                /*jshint validthis: true */
                panelToggleTimeLine.eventCallback("onComplete",
                        function () {
                            console.log("GUI <-- map/update-end from gui");
                            layoutChange();
                            panelChange(false);

                            panelToggle
                                .tooltipster("content", i18n.t("gui.actions.open"))
                                .find("span.wb-invisible").text(i18n.t("gui.actions.open"));

                            d.resolve();
                        }, [], this);

                panelToggleTimeLine.play();
            }

            function _toggleFullDataMode(fullData) {
                _isFullData = UtilMisc.isUndefined(fullData) ? !_isFullData : fullData;

                if (_isFullData) {
                    TweenLite.fromTo(panelDiv, transitionDuration,
                        { width: getPanelWidthDefault(), right: 0, left: "auto" },
                        { left: 35, right: 0, width: "auto", ease: "easeOutCirc" });

                    fullDataTimeLine.play();
                } else {
                    TweenLite.fromTo(panelDiv, transitionDuration,
                        { left: 35, width: "auto", right: panelDiv.css("right") },
                        { right: 0, width: getPanelWidthDefault(), ease: "easeInCirc" });

                    fullDataTimeLine.reverse();
                }

                utilDict.forEachEntry(subPanels, function (key) {
                    hideSubPanel({
                        origin: key
                    });
                });
            }

            function optimizeLayout() {
                if ((windowWidth < 1200 && jWindow.width() > 1200) || 
                    (windowWidth > 1200 && jWindow.width() < 1200)) {                  
                    recreateTimelines();

                    windowWidth = jWindow.width();
                }                
            }

            return {
                init: function () {
                    createTimelines();

                    windowWidth = jWindow.width();
                    jWindow.on("resize", optimizeLayout);

                    Theme
                        .fullScreenCallback("onComplete", onFullScreenComplete)
                        .fullScreenCallback("onReverseComplete", onFullScreenComplete);

                    // initialize the panel popup
                    panelPopup = popupManager.registerPopup(panelToggle, "click",
                        openPanel, {
                            activeClass: cssExpandedClass,
                            closeHandler: closePanel
                        }
                    );

                    // set listener to the panel toggle
                    topic.subscribe(EventManager.GUI.PANEL_TOGGLE, function (event) {
                        panelPopup.toggle(null, event.visible);
                    });
                    
                    // set listener to the full-screen toggle
                    fullScreenPopup = popupManager.registerPopup(fullScreenToggle, "click",
                        function (d) {
                            Theme.toggleFullScreenMode();
                            d.resolve();
                        }, {
                            activeClass: "button-pressed",
                            setClassBefore: true
                        }
                    );                    

                    // if the vertical space is too small, trigger the full-screen
                    if (mapContent.height() < jWindow.height() * 0.6) {
                        fullScreenPopup.open();
                    }

                    adjustHeight();
                },

                /**
                * Toggles the FullScreen mode of the application
                *
                * @method toggleFullScreenMode
                * @private
                * @param  {boolean} fullscreen true - expand; false - collapse; undefined - toggle;
                */
                toggleFullScreenMode: function (fullscreen) {
                    fullScreenPopup.toggle(null, fullscreen);
                },

                isFullData: function () {
                    return _isFullData;
                },

                toggleFullDataMode: function (fullData) {
                    _toggleFullDataMode(fullData);
                },

                /**
                * Fires an event when the subpanel closes or opens.
                *
                * @method subPanelChange
                * @private
                * @param {Boolean} visible indicates whether the panel is visible or not
                * @param {String} origin origin of the subpanel
                * @param {JObject} container subpanel container
                * @param {Boolean} isComplete indicates if subPanel transition has completed or just started
                */
                subPanelChange: function (visible, origin, container, isComplete) {
                    // check if the fullData transition is already underway
                    if (!fullDataTimeLine.isActive() && _isFullData && !isComplete) {
                        // adjust the sidePanel position shifting the right edge to the left, making space for the subpanel to open at
                        if (visible) {
                            fullDataSubpanelChangeTimeLine.play(0);
                        } else if (!visible) {
                            fullDataSubpanelChangeTimeLine.reverse();
                        }
                    }

                    // hide the sidepanel toggle when a subpanel is opened to prevent the user from closing sidepanel with subpanel still opened
                    if (!isComplete) {
                        if (visible) {
                            panelToggle.hide();
                        } else {
                            panelToggle.show();
                        }
                    }

                    topic.publish(EventManager.GUI.SUBPANEL_CHANGE, {
                        visible: visible,
                        origin: origin,
                        container: container,
                        offsetLeft: (container) ? container.width() + 25 + layoutController.getPanelWidth() : layoutController.getPanelWidth(),
                        isComplete: isComplete
                    });
                },

                /**
                * Returns the outer most `div` of this SidePanel.
                *
                * @method getContainer
                * @return {jObject} The outer most `div` of this SidePanel
                */
                getPanelContainer: function () {
                    return panelDiv;
                },

                /**
                * Gets the width of this SidePanel.
                *
                * @method width
                * @return {Number} The width of this SidePanel
                */
                getPanelWidth: function () {
                    return panelDiv.filter(":visible").width();
                }
            };
        }());

        /**
        * Create a new SubPanel with the settings provided.
        *
        * @private
        * @method newSubPanel
        * @param  {SubPanelSettings} attr SubPanel settings
        * @return {SubPanel}      A newly created SubPanel
        * @for GUI
        */
        function newSubPanel(attr) {
            var subPanel = Object.create(subPanelPrototype);
            subPanel._attr = Object.create(subPanelAttr);
            subPanel.create(attr);
            //adjutSubPanelDimensions(subPanel);

            return subPanel;
        }

        /**
        * Adjusts dimensions of the help panel relative to the mapContent `div`.
        *
        * @method adjustHelpDimensions
        * @private
        */
        /*function adjustHelpDimensions() {
        helpSection.css({
        "max-height": mapContent.height() - 56 // 56 is an arbitrary-wide gap between the help panel and the upper toolbar
        });
        }*/

        /**
        * Adjusts the dimensions and position of the SubPanel when layout of the page is changing.
        *
        * @method adjutSubPanelDimensions
        * @private
        * @param  {SubPanel} subPanel SubPanel whose dimensions and position need to be adjusted
        */
        /*function adjutSubPanelDimensions(subPanel) {
        function adjust(p, d) {
        if (p) {
        p.getContainer()
        .height(viewPortHeight - $("#map-toolbar").height()); //mapToolbar.height());

        //.position({
        //my: "right top",
        //at: "right top+32",
        //of: "#map-div" // mapContent
        //});
        if (d) {
        d.resolve(true);
        }
        }
        }

        if (subPanel) {
        adjust(subPanel);
        } else {
        UtilMisc.executeOnDone(subPanels, adjust);
        }
        }*/

        /**
        * Creates and opens a new SubPanel with given settings.
        * If the SubPanel with the requested `origin` is already present, updates its content.
        *
        * @method showSubPanel
        * @private
        * @param  {SubPanelSettings} attr Settings for the SubPanel instance
        */
        function showSubPanel(attr) {
            var deferred = new Deferred(),
                subPanel;

            deferred.then(function () {
                attr = subPanel.getAttributes();
                subPanel = subPanels[attr.origin];

                subPanel.open();
                subPanel.getPanel().find(".sub-panel-toggle")
                    .on("click", dojoLang.hitch(this, function () {
                        hideSubPanel(attr);

                        // reset focus back to link where the subpanel was created from
                        if (attr.target.selector !== "#map-div") {
                            $(attr.target).find(":tabbable").first().focus();
                        }
                    }));

                loadIndicator.animate({
                    right: subPanel.getPanel().width() + 6
                }, "easeOutCirc");
            });

            // take over the panel spawned by other components
            if (attr.consumeOrigin && subPanels[attr.consumeOrigin]) {
                subPanel = subPanels[attr.consumeOrigin];
                subPanel.changeOrigin(attr.origin);
                subPanel.shiftTarget(attr.target);

                delete subPanels[attr.consumeOrigin];
                subPanels[attr.origin] = subPanel;
            }

            if (subPanels[attr.origin]) {
                // if the panel exists, just update it
                subPanels[attr.origin].update(attr);
            } else if (!attr.update) {
                // create if doesn't
                subPanel = newSubPanel(attr);
                subPanels[attr.origin] = subPanel;

                // close all other panels; and open the newly created one after all others are closed
                UtilMisc.executeOnDone(subPanels,
                    function (p, d) {
                        if (p && p.getOrigin() !== attr.origin) {
                            hideSubPanel({
                                origin: p.getOrigin()
                            }, 200, d);
                        } else {
                            d.resolve(true);
                        }
                    },
                    deferred);
            }
        }

        /**
        * Closes the SubPanel whose `origin` is specified in the `attr` parameter.
        *
        * @method hideSubPanel
        * @private
        * @param  {SubPanelSettings} attr  only `origin` attribute is required here
        * @param  {Number} speed Duration of the closing animation
        * @param  {Deferred} d     The deferred object to be resolved upon successful closing of the panel
        */
        function hideSubPanel(attr, speed, d) {
            var deferred = new Deferred(function () {
                if (d) {
                    d.cancel();
                }
            });

            deferred.then(function () {
                // remove the panel from the object after it closes
                delete subPanels[attr.origin]; // more on delete: http://perfectionkills.com/understanding-delete/
                if (d) {
                    d.resolve(true);
                }
            });

            if (subPanels[attr.origin]) {
                subPanels[attr.origin].destroy(speed, deferred);

                loadIndicator.animate({
                    right: 3
                }, "easeOutCirc");
            }
        }

        /**
        * Moves the SubPanel with the specified `origin` in the DOM hierarchy to the new specified `target`; if `target` is not specified, the SubPanel is attached to the SidePanel.
        *
        * @method dockSubPanel
        * @private
        * @param  {SubPanelSettings} attr Settings for the SubPanel; only `target` and `origin` are required here
        */
        function dockSubPanel(attr) {
            var target = attr.target || layoutController.getPanelContainer(),
                subPanel = subPanels[attr.origin];

            if (subPanel) {
                //console.log("docking subpanel");
                subPanel.shiftTarget(target);
            }
        }

        /**
        * Finds a SubPanel with `origin` equal to the supplied `consumeOrigin` and
        * + changes its `origin` to the supplied `origin`
        * + moves the SubPanel in the DOM hierarchy and attaches it to the specified target
        *
        * @method captureSubPanel
        * @private
        * @param  {SubPanelSettings} attr Settings for the SubPanel; only `origin`, `consumeOrigin` and `target` are required here
        */
        function captureSubPanel(attr) {
            var subPanel;

            if (attr.consumeOrigin === attr.origin && subPanels[attr.consumeOrigin]) {
                subPanel = subPanels[attr.origin];
                subPanel.shiftTarget(attr.target);
            } else if (attr.consumeOrigin && subPanels[attr.consumeOrigin]) {
                subPanel = subPanels[attr.consumeOrigin];
                subPanel.changeOrigin(attr.origin);
                subPanel.shiftTarget(attr.target);

                delete subPanels[attr.consumeOrigin];
                subPanels[attr.origin] = subPanel;
            }
        }

        return {
            /**
            * Call load to initialize the GUI module.
            *
            * @method load
            * @param  {Number} id   ID of this module
            * @param  {?} req  ???
            * @param  {Function} load The callback function
            */
            load: function (id, req, load) {
                // measure available space on every page resize

                subPanelTemplate = JSON.parse(tmplHelper.stringifyTemplate(subPanelTemplate));

                layoutController.init();

                // registering help popup
                helpPanelPopup = popupManager.registerPopup(helpToggle, "click",
                    function (d) {
                        topic.publish(EventManager.GUI.HELP_PANEL_CHANGE, { visible: true });
                        topic.publish(EventManager.GUI.TOOLBAR_SECTION_OPEN, { id: "help-section" });
                        console.log(EventManager.GUI.HELP_PANEL_CHANGE + "; visible:", true);

                        // close this panel if any other panel is opened
                        UtilMisc.subscribeOnce(EventManager.GUI.TOOLBAR_SECTION_OPEN, dojoLang.hitch(this,
                            function () {
                                if (this.isOpen()) {
                                    this.close();
                                }
                            })
                        );

                        helpSectionContainer.slideToggle("fast", function () {
                            d.resolve();
                        });
                    }, {
                        activeClass: cssButtonPressedClass,
                        target: helpSectionContainer,
                        closeHandler: function (d) {
                            topic.publish(EventManager.GUI.HELP_PANEL_CHANGE, { visible: false });
                            topic.publish(EventManager.GUI.TOOLBAR_SECTION_CLOSE, { id: "help-section" });
                            console.log(EventManager.GUI.HELP_PANEL_CHANGE + "; visible:", false);

                            helpSectionContainer.slideToggle("fast", function () {
                                d.resolve();
                            });
                        },
                        resetFocusOnClose: true
                    }
                );

                //Start AddLayer popup controller
                addLayerPanelPopup = popupManager.registerPopup(addLayerToggle, "click",
                    function (d) {
                        topic.publish(EventManager.GUI.ADD_LAYER_PANEL_CHANGE, { visible: true });
                        topic.publish(EventManager.GUI.TOOLBAR_SECTION_OPEN, { id: "add-layer-section" });
                        console.log(EventManager.GUI.ADD_LAYER_PANEL_CHANGE + " visible:", true);

                        // close this panel if any other panel is opened
                        UtilMisc.subscribeOnce(EventManager.GUI.TOOLBAR_SECTION_OPEN, dojoLang.hitch(this,
                            function () {
                                if (this.isOpen()) {
                                    this.close();
                                }
                            })
                        );

                        addLayerSectionContainer.slideToggle("fast", function () {
                            d.resolve();
                        });
                    }, {
                        activeClass: cssButtonPressedClass,
                        target: addLayerSectionContainer,
                        closeHandler: function (d) {
                            topic.publish(EventManager.GUI.ADD_LAYER_PANEL_CHANGE, { visible: false });
                            topic.publish(EventManager.GUI.TOOLBAR_SECTION_CLOSE, { id: "add-layer-section" });
                            console.log(EventManager.GUI.ADD_LAYER_PANEL_CHANGE + " visible:", false);

                            addLayerSectionContainer.slideToggle("fast", function () {
                                d.resolve();
                            });
                        },
                        resetFocusOnClose: true
                    }
                );

                $("#addLayer-add").on("click", function () {
                    topic.publish(EventManager.Map.ADD_LAYER, null);

                    addLayerPanelPopup.close();
                });
                //End Add Layer

                //start extended grid
                topic.subscribe(EventManager.GUI.DATAGRID_EXPAND, function () {
                    layoutController.toggleFullDataMode();
                });
                //end extended grid

                topic.subscribe(EventManager.GUI.TOGGLE_FULLSCREEN, function (evt) {
                    layoutController.toggleFullScreenMode(evt.expand);
                });

                topic.subscribe(EventManager.GUI.SUBPANEL_OPEN, function (attr) {
                    showSubPanel(attr);
                });

                topic.subscribe(EventManager.GUI.SUBPANEL_CLOSE, function (attr) {
                    if (attr.origin === "all") {
                        utilDict.forEachEntry(subPanels, function (key) {
                            //attr.origin = key;
                            hideSubPanel({
                                origin: key
                            });
                        });
                    } else {
                        dojoArray.forEach(attr.origin.split(","), function (element) {
                            //attr.origin = element;
                            hideSubPanel({
                                origin: element
                            });
                        });
                    }
                });

                topic.subscribe(EventManager.GUI.SUBPANEL_DOCK, function (attr) {
                    var na;
                    if (attr.origin === "all") {
                        utilDict.forEachEntry(subPanels, function (key) {
                            na = Object.create(attr);
                            na.origin = key;
                            dockSubPanel(na);
                        });
                    } else {
                        dojoArray.forEach(attr.origin.split(","), function (element) {
                            na = Object.create(attr);
                            na.origin = element;
                            dockSubPanel(na);
                        });
                    }
                    console.log(EventManager.GUI.SUBPANEL_DOCK);
                });

                topic.subscribe(EventManager.GUI.SUBPANEL_CAPTURE, function (attr) {
                    var na;
                    if (attr.consumeOrigin === "all") {
                        utilDict.forEachEntry(subPanels, function (key) {
                            na = Object.create(attr);
                            na.consumeOrigin = key;
                            captureSubPanel(na);
                        });
                    } else {
                        dojoArray.forEach(attr.consumeOrigin.split(","), function (element) {
                            na = Object.create(attr);
                            na.consumeOrigin = element;
                            captureSubPanel(na);
                        });
                    }
                    console.log(EventManager.GUI.SUBPANEL_CAPTURE);
                });

                panelTabs.find("li a").click(function () {
                    topic.publish(EventManager.GUI.TAB_SELECTED, {
                        id: this.id,
                        tabName: this.attributes["data-panel-name"].value
                    });

                    panelTabs.find("li:not(.active) a").each(
                        function () {
                            topic.publish(EventManager.GUI.TAB_DESELECTED, {
                                id: this.id,
                                tabName: this.attributes["data-panel-name"].value
                            });
                        });
                });

                // List of objects containing an event name and an event argument. The events should
                // be anything to wait for before publishing a map extent change, it should include
                // anything that will change the size of the map (e.g. fullscreen, closing the panel).
                // If the map extent change occurs BEFORE something that changes the size of the map (e.g. fullscreen)
                // then the map extent will change again.
                var waitList = [];

                if (!GlobalStorage.config.ui.sidePanelOpened) {
                    // NOTE: panel change not triggered here (see map extent change below)
                    waitList.push({
                        publishName: EventManager.GUI.PANEL_TOGGLE,
                        eventArg: {
                            origin: "bootstrapper",
                            visible: GlobalStorage.config.ui.sidePanelOpened
                        },
                        subscribeName: EventManager.GUI.PANEL_CHANGE
                    });
                }

                if (GlobalStorage.config.ui.fullscreen) {
                    // NOTE: fullscreen not triggered here (see map extent change below)
                    waitList.push({
                        publishName: EventManager.GUI.TOGGLE_FULLSCREEN,
                        eventArg: {
                            expand: true
                        },
                        subscribeName: EventManager.GUI.FULLSCREEN_CHANGE
                    });
                }

                // return the callback
                load();

                // This should be the last thing that happens
                if (waitList.isEmpty()) {
                    topic.publish(EventManager.GUI.UPDATE_COMPLETE);
                } else {
                    // Wait for things such as fullscreen or panel collapse
                    // to finish before publishing the UPDATE_COMPLETE.

                    // Note it's important to subscribe to the events, then
                    // publish them, that's why it was done in such an obscure way
                    // using the waitList (otherwise if we just publish the
                    // event like above, then subscribe to it here, the event
                    // might have completed before reaching this point)
                    var eventNames = dojoArray.map(waitList, function (obj) {
                        return obj.subscribeName;
                    });

                    UtilMisc.subscribeAll(eventNames, function () {
                        topic.publish(EventManager.GUI.UPDATE_COMPLETE);
                    });

                    dojoArray.forEach(waitList, function (obj) {
                        topic.publish(obj.publishName, obj.eventArg);
                    });
                }
            }
        };
    }
);