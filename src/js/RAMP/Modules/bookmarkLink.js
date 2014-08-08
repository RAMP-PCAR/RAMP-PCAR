/*global define */

/**
* BookmarkLink submodule
*
* Keeps track of the current state of the map and updates the GetLinkPanel's textbook accordingly. On page load, if any
* parameters are detected in the URL, this module will attempt to recreate the map according to the parameters. Internally,
* this module subscribes to all events that change the state of the map (e.g. extent-change, layers toggled on/off). It contains
* a dictionary that map event names to an object that contains the minimum information needed to reconstruct the map for that particular
* event. For example, if an extent change occurred, this module will add a key "map/extent-change" (or update if the entry already exists)
* and put an object that contains the minimum information needed to reconstruct the map to that extent (in this case it would be
* xmin, ymin, xmax, ymax. Spatial reference is not needed since the map always has the same spatial reference).
*
* @module RAMP
* @submodule BookmarkLink
* @main BookmarkLink
*/

/**
* BookmarkLink class.
*
*
* ### Steps for making the bookmark link update with an event
*
* 1. Subscribe to the event of interest (e.g. map extent-change)
* 2. Create an object containing fields that will contain the necessary
*    information for reconstructing the map to the same state. (e.g. for
*    map extent-change, a useful object might be one that represents the
*    current extent of the map: `{ xmin : 123, xmax : 456, ymin : 789, ymax : 000}).`
*
*   __IMPORTANT__: the object must be serializable since it will be added to the URL and
*   should serialize to a reasonable length String. If the fields contain
*   non-primitives, e.g. array, object, one must manually serialize the field first.
*   Also only use anonymous objects with custom fields, do not use class objects
*   (e.g. use an anonymous { } object to store map extent instead of ESRI's map
*   {{#crossLink "Esri/geometry/Extent"}}{{/crossLink}} object, since it will contain other fields and methods that will also
*   be serialized).
*
* 3. Call updateURL, passing it a name (e.g. "newExtent") and the object
*    (a name is required for efficiency, this way the URL will only need to
*    serialize and update the given object instead of all objects).
*
* @class BookmarkLink
* @static
* @uses dojo/_base/declare
* @uses require
* @uses dojo/dom-construct
* @uses dojo/io-query
* @uses dojo/_base/lang
* @uses dojo/dom
* @uses dojo/_base/array
* @uses dojo/topic
* @uses dijit/form/TextBox
* @uses dijit/TitlePane
* @uses esri/geometry/Extent
* @uses GlobalStorage
* @uses Map
* @uses EventManager
* @uses Url
* @uses Util
* @uses Dictionary
* @uses PopupManager
*/

define([
// Dojo
        "dojo/_base/declare", "require", "dojo/dom-construct", "dojo/io-query", "dojo/_base/lang",
        "dojo/dom", "dojo/_base/array", "dojo/topic", "dijit/form/TextBox", "dijit/TitlePane",
// Esri
        "esri/geometry/Extent",
// Ramp
        "ramp/globalStorage", "ramp/map", "ramp/eventManager",
// Util
        "utils/url", "utils/util", "utils/dictionary", "utils/array", "utils/popupManager"
],

    function (
    // Dojo
        declare, dojoRequire, dojoDomConstruct, dojoQuery, dojoLang,
        dojoDom, dojoArray, topic, TextBox, TitlePane,
    // Esri
        Extent,
    // Ramp
        GlobalStorage, RampMap, EventManager,
    // Util
        Url, UtilMisc, UtilDict, UtilArray, PopupManager) {
        "use strict";

        // Using constants so we can have intellisense and not make silly typos
        var EVENT_EXTENT_CHANGE = "extentChange",
            EVENT_FULLSCREEN = "fullscreen",
            EVENT_PANEL_CHANGE = "panelChange",
            EVENT_TAB_CHANGE = "selectedTab",
            EVENT_BASEMAP_CHANGED = "basemapChange",
            EVENT_FILTER_VISIBLE_LAYERS = "activeLayers",
            EVENT_FILTER_VISIBLE_BOXES = "activeBoxes",
            HREF_MAILTO_TEMPLATE = "mailto:?subject={0}&body={1}%0D%0A%0D%0A{2}",

            config,

            queryObject,

            linkPaneTextbox,

            getlinkPopup,

            getlinkToggle,
            getlinkSectionContainer,
            getlinkSection,

            getlinkShortenButton,
            getlinkEmailButton,

            getlinkloadinganimation,

            cssButtonPressedClass = "button-pressed",

            isShortLinkMode = false,

            baseUrl,

        /**
        * A dictionary mapping names (String) to query parameter (String) of the URL. The query parameter is
        * what ends up in the url. The key can be any arbitrary name (best to name them to describe the query
        * parameter).
        *
        * @private
        * @property parameters
        * @type {Object}
        */
            parameters = {},

        /**
        * A dictionary mapping names (String) to anchors (String) used at the end of the URL.
        *
        * @private
        * @property anchors
        * @type {Object}
        */
            anchors = {},

        /**
        * A dictionary mapping layer id (String) to layer objects (FeatureLayer) that are currently visible on the map.
        *
        * @private
        * @property hiddenLayers
        * @type {Object}
        */
            hiddenLayers = {},

        /**
        * A set containing the names of all the layers that currently have their bounding boxes
        * toggled on (the key is the name and the value is arbitrary, currently set to "true").
        *
        * @private
        * @property visibleBoxes
        * @type {Object}
        */
            visibleBoxes = {},

            layerTransparency = {},

            ui = {
                /**
                * Initiates additional UI components of the widget, setting listeners and other stuff.
                *
                * @method init
                * @private
                * @constructor
                */
                init: function () {
                    getlinkloadinganimation = $("#getlink-section .loadingAnimation");

                    getlinkEmailButton = $(".getlink-email-button");

                    getlinkToggle = $("#getlink-toggle");
                    getlinkSectionContainer = $("#getlink-section-container");
                    getlinkSection = $("#getlink-section");

                    // select link when user focuses on the textbox http://stackoverflow.com/a/22102081
                    linkPaneTextbox =
                        $("#getlink-input")
                        .on('focus', function () {
                            var $this = $(this)
                                .one('mouseup.mouseupSelect', function () {
                                    $this.select();
                                    return false;
                                })
                                .one('mousedown', function () {
                                    // compensate for untriggered 'mouseup' caused by focus via tab
                                    $this.off('mouseup.mouseupSelect');
                                })
                                .select();
                        });

                    // toggle short/long link mode on click
                    getlinkShortenButton =
                        $(".getlink-shorten-button")
                        .on("click", toggleShortLinkMode);

                    getlinkPopup = PopupManager.registerPopup(getlinkToggle, "click",
                        function (d) {
                            topic.publish(EventManager.BookmarkLink.GETLINK_PANEL_CHANGED, { visible: true });
                            topic.publish(EventManager.GUI.TOOLBAR_SECTION_OPEN, { id: "get-link-section" });
                            console.log(EventManager.BookmarkLink.GETLINK_PANEL_CHANGED + " visible:", true);

                            // close this panel if any other panel is opened
                            UtilMisc.subscribeOnce(EventManager.GUI.TOOLBAR_SECTION_OPEN, dojoLang.hitch(this,
                                function () {
                                    if (this.isOpen()) {
                                        this.close();
                                    }
                                })
                            );

                            getlinkSectionContainer.slideDown("fast", function () {
                                d.resolve();
                            });
                        },
                        {
                            activeClass: cssButtonPressedClass,
                            target: getlinkSectionContainer,
                            closeHandler: function (d) {
                                topic.publish(EventManager.BookmarkLink.GETLINK_PANEL_CHANGED, { visible: false });
                                topic.publish(EventManager.GUI.TOOLBAR_SECTION_CLOSE, { id: "get-link-section" });
                                console.log(EventManager.BookmarkLink.GETLINK_PANEL_CHANGED + " visible:", false);

                                getlinkSectionContainer.slideUp("fast", function () {
                                    toggleShortLinkMode(false);
                                    d.resolve();
                                });
                            },
                            resetFocusOnClose: true
                        }
                    );

                    /*topic.subscribe(EventManager.GUI.HELP_PANEL_CHANGE, function (attr) {
                        if (getlinkPopup.isOpen() && attr.visible) {
                            getlinkPopup.close();
                        }
                    });*/
                }
            };

        /**
        * Update the parameter dictionary with the new values for the parameter. If paramObj is set to null,
        * essentially removes the given paramKey from the URL.
        *
        * @method addParameter
        * @private
        * @param {String} paramKey  the parameter (e.g. extent) that was changed
        * @param {Object} paramObj an object representing data that can be serialized into the query parameter
        * of the URL (can be null, in which case the parameter will NOT be included in the URL)
        *
        */
        function addParameter(paramKey, paramObj) {
            if (paramObj === null) {
                parameters[paramKey] = null;
            } else {
                parameters[paramKey] = dojoQuery.objectToQuery(paramObj);
            }
        }

        /*
        * Adds an anchor object to a tracking array
        * @method addAnchor
        * @param {String} anchorName a key value for the anchor
        * @param {Object} anchorObj an anchor object
        */
        function addAnchor(anchorName, anchorObj) {
            anchors[anchorName] = anchorObj;
        }

        /*
        * Appends information to the current map's URL to create a mail-to link. Set the email buttons target URL.
        * @method setNewUrl
        * @param {String} url the base URL that defines the current state of the map
        */
        function setNewUrl(url) {
            var mailToHref = String.format(HREF_MAILTO_TEMPLATE,
                config.stringResources.txtEmailUrlSubject,
                config.stringResources.txtEmailUrlBody,
                encodeURIComponent(url));

            linkPaneTextbox.val(url);
            getlinkEmailButton.attr("href", mailToHref);
        }

        /**
        * Updates the link displayed in the textbox. This function should be called whenever
        * one of the objects that are in the URL query is modified.
        *
        * @method updateURL
        * @private
        */
        function updateURL() {
            var link = baseUrl;

            /* Appends all the query parameters to the link (a query parameter can be
            * excluded by setting it to null) */
            UtilDict.forEachEntry(parameters, function (key, value) {
                if (value) { // Value cannot be null or the empty String
                    link += "&" + value;
                }
            });

            // Need to add an extra "&" to the query if we have an anchor, otherwise
            // the last query will contain the anchors
            if (!UtilDict.isEmpty(anchors)) {
                link += "&";
            }

            // Anchors have to be at the end
            UtilDict.forEachEntry(anchors, function (key, value) {
                link += "#" + value;
            });

            if (isShortLinkMode) {
                if (linkPaneTextbox.is(":visible")) {
                    getlinkloadinganimation.show();

                    jQuery.urlShortener({
                        longUrl: link,
                        success: function (shortUrl) {
                            setNewUrl(shortUrl);
                            getlinkloadinganimation.hide();
                        },
                        error: function (err) {
                            console.error(JSON.stringify(err));
                            getlinkloadinganimation.hide();
                        }
                    });
                }
            } else {
                setNewUrl(link);
            }
        }

        /**
        * Toggle the short/long link mode and change the label accordingly
        *
        * @method toggleShortLinkMode
        * @param {Object} value true - shortLinkMode; false - !shortlinkMore; undefined - toggle;
        * @private
        */
        function toggleShortLinkMode(value) {
            var label,
                localStrings = config.stringResources;

            isShortLinkMode = value === true ? true : (value === false ? false : !isShortLinkMode);
            label = isShortLinkMode ? localStrings.txtGetLinkLong : localStrings.txtGetLinkShort;
            getlinkShortenButton.text(label);
            updateURL();
        }

        function updateConfig(homePage) {
            var event,
                urlObj = new Url(dojoRequire.toUrl(document.location));

            config = GlobalStorage.config;
            baseUrl = urlObj.uri;
            queryObject = dojoQuery.queryToObject(urlObj.query);

            //adds homePage (e.g. default.aspx or rampmap.aspx) if not present;
            //used in getlink or else the link would be invalid.
            if (baseUrl.indexOf(homePage) === -1) {
                baseUrl += homePage;
            }
            baseUrl += "?lang=" + config.lang;

            // Move the API key to config.json??
            jQuery.urlShortener.settings.apiKey = 'AIzaSyB52ByjsXrOYlXxc2Q9GVpClLDwt0Lw6pc';

            // Toggle the main panel
            if (queryObject.panelVisible) {
                event = {
                    visible: UtilMisc.parseBool(queryObject.panelVisible)
                };

                addParameter(EVENT_PANEL_CHANGE, event);
                config.ui.sidePanelOpened = event.visible;
            }

            // Toggle fullscreen mode
            if (queryObject.fullscreen) {
                event = {
                    fullscreen: UtilMisc.parseBool(queryObject.fullscreen)
                };
                addParameter(EVENT_FULLSCREEN, event);
                config.ui.fullscreen = event.fullscreen;
            }

            // Check for map extent queries
            if (queryObject.xmin) {
                event = {
                    xmin: parseFloat(queryObject.xmin.replace(/,/g, "")),
                    ymin: parseFloat(queryObject.ymin.replace(/,/g, "")),
                    xmax: parseFloat(queryObject.xmax.replace(/,/g, "")),
                    ymax: parseFloat(queryObject.ymax.replace(/,/g, "")),
                    sr: queryObject.sr
                };

                addParameter(EVENT_EXTENT_CHANGE, event);

                config.extents.defaultExtent = event;
                config.spatialReference = JSON.parse(queryObject.sr);

                // Wait for things such as fullscreen or panel collapse
                // to finish before doing an extent change.
            }

            // Select the correct basemap
            if (queryObject.baseMap) {
                event = {
                    baseMap: queryObject.baseMap
                };
                addParameter(EVENT_BASEMAP_CHANGED, event);

                dojoArray.forEach(config.basemaps, function (basemap) {
                    basemap.showOnInit = (basemap.id === event.baseMap);
                });
            }

            // Modify the layer transparency
            if (queryObject.layerTransparency) {
                addParameter(EventManager.FilterManager.LAYER_TRANSPARENCY_CHANGED, {
                    layerTransparency: queryObject.layerTransparency
                });

                UtilDict.forEachEntry(JSON.parse(queryObject.layerTransparency), function (key, value) {
                    var layerConfig = UtilArray.find(config.featureLayers, function (layer) {
                        return layer.id === key;
                    }) || UtilArray.find(config.wmsLayers, function (layer) {
                        return String.format("wmsLayer_{0}", layer.layerInfo.title) === key;
                    });
                    layerConfig.settings.opacity.default = value;
                });
            }

            // check for selected tab queries
            if (queryObject.selectedTab) {
                // Just add the parameter, no need to do anything else
                // since we're using anchor tags
                addParameter(EVENT_TAB_CHANGE, {
                    index: queryObject.selectedTab
                });
            }
        }

        return {
            /**
            * Instantiates a BookmarkLink. Subscribes to all the events that causes
            * the bookmark link to update (e.g. map extent change or feature layer visibility
            * change).
            *
            * @method init
            * {String} homePage a string denoting the name of the homePage (e.g. usually "Default.aspx" or "index.html")
            */
            createUI: function () {
                ui.init();
            },

            updateConfig: updateConfig,

            /**
            * Subscribe to map state changes so the URL displayed can be changed accordingly.
            *  SUBSCRIBES TO:
            * map "extent-change"
            *   Updates URL when map extent changes
            *
            * EventManager.GUI.FULLSCREEN_CHANGE
            *   Updates URL when map goes into fullscreen mode
            *
            * EventManager.GUI.TAB_SELECTED
            *   Updates URL when tabs are selected
            *
            * EventManager.GUI.PANEL_CHANGE
            *   Updates URL when panel opens/closes
            *
            * EventManager.BasemapSelector.BASEMAP_CHANGED
            *   Updates URL when basemap changed
            *
            * * ================================================================
            * Subscribe to updates
            * ================================================================
            * To include more information into the query string, do not get the information
            * directly from the object/module of interest, but rather make it publish an
            * event with data to include and subscribe to this event here.
            * @method subscribeAndUpdate
            * @private
            */
            subscribeAndUpdate: function () {
                topic.subscribe(EventManager.Map.EXTENT_CHANGE, function (event) {
                    // Event fields: extent, delta, levelChange, lod;
                    addParameter(EVENT_EXTENT_CHANGE, {
                        xmin: event.extent.xmin,
                        ymin: event.extent.ymin,
                        xmax: event.extent.xmax,
                        ymax: event.extent.ymax,
                        sr: JSON.stringify(event.extent.spatialReference)
                    });
                    updateURL();
                });

                topic.subscribe(EventManager.GUI.FULLSCREEN_CHANGE, function (event) {
                    addParameter(EVENT_FULLSCREEN, {
                        fullscreen: event.visible
                    });
                    updateURL();
                });

                topic.subscribe(EventManager.GUI.TAB_SELECTED, function (event) {
                    // Need to remove the "-link" part for the id to work
                    // since when the page first loads, if the tab is deselected,
                    // it's id will be missing the "-link" at the end.
                    addAnchor(EVENT_TAB_CHANGE, event.id.replace("-link", ""));
                    updateURL();
                });

                topic.subscribe(EventManager.GUI.PANEL_CHANGE, function (event) {
                    addParameter(EVENT_PANEL_CHANGE, {
                        panelVisible: event.visible
                    });
                    updateURL();
                });

                topic.subscribe(EventManager.BasemapSelector.BASEMAP_CHANGED, function (event) {
                    addParameter(EVENT_BASEMAP_CHANGED, {
                        baseMap: event.id
                    });
                    updateURL();
                });

                topic.subscribe(EventManager.FilterManager.LAYER_VISIBILITY_TOGGLED, function (event) {
                    var layerName = event.id;

                    if (event.state) {
                        delete hiddenLayers[layerName];
                    } else {
                        hiddenLayers[layerName] = true;
                    }

                    if (UtilDict.isEmpty(hiddenLayers)) {
                        // If we have no hidden layers, remove both parameters (since it's status quo)
                        addParameter(EVENT_FILTER_VISIBLE_LAYERS, null);
                    } else {
                        // Otherwise add the hidden layers parameter and remove the global layer
                        // parameter
                        addParameter(EVENT_FILTER_VISIBLE_LAYERS, {
                            // Convert an array of string into a "+" delimited string
                            hiddenLayers: Object.keys(hiddenLayers).join("+")
                        });
                    }

                    updateURL();
                });

                topic.subscribe(EventManager.FilterManager.BOX_VISIBILITY_TOGGLED, function (event) {
                    var layerName = event.id;

                    if (event.state) {
                        visibleBoxes[layerName] = true;
                    } else {
                        delete visibleBoxes[layerName];
                    }

                    if (UtilDict.isEmpty(visibleBoxes)) {
                        // If we have no visible boxes, remove the visible boxes parameter
                        // and set global box to false
                        addParameter(EVENT_FILTER_VISIBLE_BOXES, null);
                    } else {
                        // Otherwise add the visible boxes parameter and remove the global box
                        // parameter
                        addParameter(EVENT_FILTER_VISIBLE_BOXES, {
                            // Convert an array of string into a "+" delimited string
                            visibleBoxes: Object.keys(visibleBoxes).join("+")
                        });
                    }

                    updateURL();
                });

                topic.subscribe(EventManager.FilterManager.LAYER_TRANSPARENCY_CHANGED, function (event) {
                    addParameter(EventManager.FilterManager.LAYER_TRANSPARENCY_CHANGED, event);
                    layerTransparency[event.layerId] = event.value;

                    addParameter(EventManager.FilterManager.LAYER_TRANSPARENCY_CHANGED, {
                        layerTransparency: JSON.stringify(layerTransparency)
                    });

                    updateURL();
                });

                // This call is necessary to fill in the URL in the bookmark link
                // if this call is removed, there will be no URL in the bookmark link
                // until one of the above events fires
                updateURL();
            },

            /**
            * Publish events based on the query parameter (if any) in the URL.
            *
            * @method updateMap
            */
            updateMap: function () {
                // If there is no query just return
                if (!queryObject) {
                    return;
                }

                var layerIds;

                if (queryObject.hiddenLayers) {
                    // Doing "else if" here instead of "if" because these two options are exclusive

                    layerIds = queryObject.hiddenLayers.split("+");

                    // Selectively turn off the ones that were in the query (the rest will be
                    // turned on)
                    layerIds.forEach(function (layerId) {
                        topic.publish(EventManager.FilterManager.TOGGLE_LAYER_VISIBILITY, {
                            layerId: layerId,
                            state: false
                        });

                        hiddenLayers[layerId] = false;
                    });

                    addParameter(EVENT_FILTER_VISIBLE_LAYERS, {
                        hiddenLayers: queryObject.hiddenLayers
                    });
                }

                if (queryObject.visibleBoxes) {
                    // Doing "else if" here instead of "if" because these two options are exclusive

                    // Selective turn on the bounding boxes, no need to turn off all bounding boxes
                    // first since all bounding boxes are off by default

                    layerIds = queryObject.visibleBoxes.split("+");

                    layerIds.forEach(function (layerId) {
                        topic.publish(EventManager.FilterManager.TOGGLE_BOX_VISIBILITY, {
                            layerId: layerId,
                            state: true
                        });

                        visibleBoxes[layerId] = true;
                    });

                    addParameter(EVENT_FILTER_VISIBLE_BOXES, {
                        visibleBoxes: queryObject.visibleBoxes
                    });
                }
            }
        };
    });