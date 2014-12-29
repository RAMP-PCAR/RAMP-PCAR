/* global define, i18n, jQuery, console, $, document, RAMP */

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
        "ramp/globalStorage", "ramp/map", "ramp/eventManager", "ramp/ramp",
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
        GlobalStorage, RampMap, EventManager, Ramp,
    // Util
        Url, UtilMisc, UtilDict, UtilArray, PopupManager) {
        "use strict";

        // Using constants so we can have intellisense and not make silly typos
        var EVENT_EXTENT_CHANGE = "extentChange",
            EVENT_FULLSCREEN = "fullscreen",
            EVENT_PANEL_CHANGE = "panelChange",
            EVENT_TAB_CHANGE = "selectedTab",
            EVENT_BASEMAP_CHANGED = "basemapChange",
            PARAM = {
                FILTER: {
                    VISIBLE_LAYERS: "visibleLayers",
                    HIDDEN_LAYERS: "hiddenLayers",
                    VISIBLE_BOXES: "visibleBoxes",
                    HIDDEN_BOXES: "hiddenBoxes"
                }
            },

            // defines any standard url param keys we are expecting
            URL_KEYS = {
                PANEL_VISIBLE: "pv",
                FULL_SCREEN: "fs",
                XMIN: "xmin",
                YMIN: "ymin",
                XMAX: "xmax",
                YMAX: "ymax",
                SPATIAL_REF: "sr",
                BASEMAP: "bm",
                LAYER_TRANSPARENCY: "lt",
                SELECT_TAB: "st",
                VISIBLE_LAYERS: "vl",
                HIDDEN_LAYERS: "hl",
                VISIBLE_BOXES: "vb",
                HIDDEN_BOXES: "hb"
            },

            HREF_MAILTO_TEMPLATE = "mailto:?subject={0}&body={1}%0D%0A%0D%0A{2}",

            config,

            queryObject,

            linkPaneTextbox,

            getlinkPopup,

            getlinkToggle,
            getlinkSectionContainer,
            getlinkSection,

            getlinkShortenButton,
            getlinkShortenButtonLabel,
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
             * A dictionary containing layer id (String) as key and layer visibility (boolean) as value
             *
             * @private
             * @property layerVisibility
             * @type {Object}
             */
            layerVisibility = {},

            /**
             * A dictionary containing layer id (String) as key and bounding box visibility (boolean) as value
             *
             * @private
             * @property boundingBoxVisibility
             * @type {Object}
             */
            boundingBoxVisibility = {},

            /**
             * A dictionary with the layer id as key, and the transparency as value.
             *
             * @private
             * @property layerTransparency
             * @type {Object}
             */
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

                    getlinkShortenButtonLabel = getlinkShortenButton.find("span.on-right");

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
                i18n.t("bookmarkLink.emailUrlSubject"),
                i18n.t("bookmarkLink.emailUrlBody"),
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
            var link = baseUrl,
                delim = "?";

            /* Appends all the query parameters to the link (a query parameter can be
            * excluded by setting it to null) */
            UtilDict.forEachEntry(parameters, function (key, value) {
                if (value) { // Value cannot be null or the empty String
                    link += delim + value;
                    if (delim === "?") {
                        //first param has a question mark in front of it.  all others have an &
                        delim = "&";
                    }
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

            //update lang href with current bookmark url
            updateLangHref(link);

            //trigger event indicating bookmark is complete.  pass bookmark as arg
            topic.publish(EventManager.BookmarkLink.BOOKMARK_GENERATED, {
                link: link
            });
        }

        /**
      * update Href on language button based on link provided from bookmarklink
      *
      * @method updateHref
      * @param {String} link bookmark url
      * @private
      */
        function updateLangHref(link) {
            var pos = link.indexOf('?');
            if (pos <= 0) {
                return;
            }

            var paras = link.split('?')[1],
                element = $("#wb-lng").find("li a"),
                url = element.attr("href");

            url = url.split('?')[0] + "?" + paras;

            element.attr("href", url);
        }

        /**
       * If a co-ordinate has a big value before the decimal point, drop the precision after the decimal
       *
       * @method slimCoord
       * @param {Object} value co-ordinate to potentially slim down
       * @private
       */
        function slimCoord(value) {
            var sVal = value.toString(),
                decIndex = sVal.indexOf("."),
                cutSize;

            if (sVal.substring(0, 1) === "-") {
                cutSize = 7;
            } else {
                cutSize = 6;
            }

            if (decIndex < cutSize) {
                //number has 5 or less numbers before the decimal, or no decimal point.  return input as is
                return sVal;
            } else {
                //trim that decimal!
                return sVal.substring(0, decIndex);
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
            var label;

            isShortLinkMode = value === true ? true : (value === false ? false : !isShortLinkMode);
            label = isShortLinkMode ? i18n.t("bookmarkLink.longLink") : i18n.t("bookmarkLink.shortLink");
            getlinkShortenButtonLabel.text(label);
            updateURL();
        }

        /**
        * Process the URL.  If there are any parameters that came from a short-link, apply them to the config or the RAMP application
        *
        * @method updateConfig
        * @param {String} homePage the page name of the ramp site (e.g. index.html, map.html)
        * @private
        */
        function updateConfig(homePage) {
            var event,
                urlObj = new Url(dojoRequire.toUrl(document.location));

            config = RAMP.config;
            baseUrl = urlObj.uri;
            queryObject = dojoQuery.queryToObject(urlObj.query);

            //adds homePage (e.g. default.aspx or rampmap.aspx) if not present;
            //used in getlink or else the link would be invalid.
            if (baseUrl.indexOf(homePage) === -1) {
                baseUrl += homePage;
            }

            // Move the API key to config.json??
            jQuery.urlShortener.settings.apiKey = 'AIzaSyB52ByjsXrOYlXxc2Q9GVpClLDwt0Lw6pc';

            // Toggle the main panel
            if (queryObject[URL_KEYS.PANEL_VISIBLE]) {
                event = {
                    pv: UtilMisc.parseBool(queryObject[URL_KEYS.PANEL_VISIBLE])
                };

                addParameter(EVENT_PANEL_CHANGE, event);
                RAMP.state.ui.sidePanelOpened = event.pv;
            }

            // Toggle fullscreen mode
            if (queryObject[URL_KEYS.FULL_SCREEN]) {
                event = {
                    fs: UtilMisc.parseBool(queryObject[URL_KEYS.FULL_SCREEN])
                };
                addParameter(EVENT_FULLSCREEN, event);
                RAMP.state.ui.fullscreen = event.fs;
            }

            // Check for map extent queries

            if (queryObject[URL_KEYS.XMIN]) {
                event = {
                    xmin: parseFloat(queryObject[URL_KEYS.XMIN].replace(/,/g, "")),
                    ymin: parseFloat(queryObject[URL_KEYS.YMIN].replace(/,/g, "")),
                    xmax: parseFloat(queryObject[URL_KEYS.XMAX].replace(/,/g, "")),
                    ymax: parseFloat(queryObject[URL_KEYS.YMAX].replace(/,/g, "")),
                    sr: queryObject[URL_KEYS.SPATIAL_REF]
                };

                addParameter(EVENT_EXTENT_CHANGE, event);

                //we call the spatial refernce "sr" in the url to save on characters.  However, the internal config object uses the ESRI standard
                //name of "spatialReference" (so we can serialize to a valid esri SR object)
                var configExtent = {
                    xmin: event.xmin,
                    ymin: event.ymin,
                    xmax: event.xmax,
                    ymax: event.ymax,
                    spatialReference: JSON.parse(event.sr)
                };

                config.extents.defaultExtent = configExtent;

                // Wait for things such as fullscreen or panel collapse
                // to finish before doing an extent change.
            }

            // Select the correct basemap
            if (queryObject[URL_KEYS.BASEMAP]) {
                event = {
                    bm: queryObject[URL_KEYS.BASEMAP]
                };
                addParameter(EVENT_BASEMAP_CHANGED, event);

                config.initialBasemapIndex = parseInt(queryObject[URL_KEYS.BASEMAP]);
            }

            // Modify the layer transparency
            if (queryObject[URL_KEYS.LAYER_TRANSPARENCY]) {
                addParameter(EventManager.FilterManager.LAYER_TRANSPARENCY_CHANGED, {
                    lt: queryObject[URL_KEYS.LAYER_TRANSPARENCY]
                });

                UtilDict.forEachEntry(JSON.parse(queryObject[URL_KEYS.LAYER_TRANSPARENCY]), function (key, value) {
                    var layerConfig = UtilArray.find(config.layers.feature.concat(config.layers.wms), function (layer) {
                        return layer.id === key;
                    });
                    layerConfig.settings.opacity.default = value;
                });
            }

            // check for selected tab queries
            if (queryObject[URL_KEYS.SELECT_TAB]) {
                // Just add the parameter, no need to do anything else
                // since we're using anchor tags
                addParameter(EVENT_TAB_CHANGE, {
                    index: queryObject[URL_KEYS.SELECT_TAB]
                });
            }

            var layerIds;

            if (queryObject[URL_KEYS.VISIBLE_LAYERS]) {
                layerIds = queryObject[URL_KEYS.VISIBLE_LAYERS].split("+");

                layerIds.forEach(function (layerId) {
                    var layerConfig = Ramp.getLayerConfigWithId(layerId);
                    // make sure not null
                    if (layerConfig !== null) {
                        layerConfig.settings.visible = true;

                        layerVisibility[layerId] = true;
                    }
                });

                addParameter(PARAM.FILTER.VISIBLE_LAYERS, {
                    vl: queryObject[URL_KEYS.VISIBLE_LAYERS]
                });
            }

            if (queryObject[URL_KEYS.HIDDEN_LAYERS]) {
                layerIds = queryObject[URL_KEYS.HIDDEN_LAYERS].split("+");

                layerIds.forEach(function (layerId) {
                    var layerConfig = Ramp.getLayerConfigWithId(layerId);

                    if (layerConfig !== null) {
                        layerConfig.settings.visible = false;

                        layerVisibility[layerId] = false;
                    }
                });

                addParameter(PARAM.FILTER.HIDDEN_LAYERS, {
                    hl: queryObject[URL_KEYS.HIDDEN_LAYERS]
                });
            }

            if (queryObject[URL_KEYS.VISIBLE_BOXES]) {
                layerIds = queryObject[URL_KEYS.VISIBLE_BOXES].split("+");

                layerIds.forEach(function (layerId) {
                    var layerConfig = Ramp.getLayerConfigWithId(layerId);
                    if (layerConfig !== null) {
                        layerConfig.settings.boundingBoxVisible = true;
                        boundingBoxVisibility[layerId] = true;
                    }
                });

                addParameter(PARAM.FILTER.VISIBLE_BOXES, {
                    vb: queryObject[URL_KEYS.VISIBLE_BOXES]
                });
            }

            if (queryObject[URL_KEYS.HIDDEN_BOXES]) {
                layerIds = queryObject[URL_KEYS.HIDDEN_BOXES].split("+");

                layerIds.forEach(function (layerId) {
                    var layerConfig = Ramp.getLayerConfigWithId(layerId);

                    if (layerConfig !== null) {
                        layerConfig.settings.boundingBoxVisible = false;
                        boundingBoxVisibility[layerId] = false;
                    }
                });

                addParameter(PARAM.FILTER.HIDDEN_BOXES, {
                    hb: queryObject[URL_KEYS.HIDDEN_BOXES]
                });
            }

            //check for any additional unknown parameters that were on the url.  add them to our URL
            var paramName, paramObj, knownNames = [];
            //get list of known keys in a searchable list
            for (paramName in URL_KEYS) {
                if (URL_KEYS.hasOwnProperty(paramName)) {
                    knownNames.push(URL_KEYS[paramName]);
                }
            }
            for (paramName in queryObject) {
                if (queryObject.hasOwnProperty(paramName)) {
                    if (knownNames.indexOf(paramName) === -1) {
                        //found a param that is not known.  add it to the collection
                        paramObj = {};
                        paramObj[paramName] = queryObject[paramName];
                        addParameter(paramName, paramObj);
                    }
                }
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
                        xmin: slimCoord(event.extent.xmin),
                        ymin: slimCoord(event.extent.ymin),
                        xmax: slimCoord(event.extent.xmax),
                        ymax: slimCoord(event.extent.ymax),
                        sr: JSON.stringify(event.extent.spatialReference)
                    });
                    updateURL();
                });

                topic.subscribe(EventManager.GUI.FULLSCREEN_CHANGE, function (event) {
                    addParameter(EVENT_FULLSCREEN, {
                        fs: event.visible
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
                        pv: event.visible
                    });
                    updateURL();
                });

                topic.subscribe(EventManager.BasemapSelector.BASEMAP_CHANGED, function (event) {
                    //lookup index from config. don't store id

                    addParameter(EVENT_BASEMAP_CHANGED, {
                        bm: RAMP.basemapIndex[event.id]
                    });
                    updateURL();
                });

                topic.subscribe(EventManager.FilterManager.LAYER_VISIBILITY_TOGGLED, function (event) {
                    var layerName = event.id;
                    layerVisibility[layerName] = event.state;

                    // Only keep attributes that are different from the default config
                    var visibleLayers = UtilDict.filter(layerVisibility, function (key, layerVisible) {
                        return layerVisible && !Ramp.getLayerConfigWithId(key).settings.visible;
                    }),
                        hiddenLayers = UtilDict.filter(layerVisibility, function (key, boxVisible) {
                            return !boxVisible && Ramp.getLayerConfigWithId(key).settings.visible;
                        });

                    addParameter(PARAM.FILTER.HIDDEN_LAYERS, UtilDict.isEmpty(hiddenLayers) ? null : {
                        // Convert an array of string into a "+" delimited string
                        hl: Object.keys(hiddenLayers).join("+")
                    });

                    addParameter(PARAM.FILTER.VISIBLE_LAYERS, UtilDict.isEmpty(visibleLayers) ? null : {
                        // Convert an array of string into a "+" delimited string
                        vl: Object.keys(visibleLayers).join("+")
                    });

                    updateURL();
                });

                topic.subscribe(EventManager.FilterManager.BOX_VISIBILITY_TOGGLED, function (event) {
                    var layerName = event.id;
                    boundingBoxVisibility[layerName] = event.state;

                    // Only keep attributes that are different from the default config
                    var visibleBoxes = UtilDict.filter(boundingBoxVisibility, function (key, boxVisible) {
                        return boxVisible && !Ramp.getLayerConfigWithId(key).settings.boundingBoxVisible;
                    }),
                        hiddenBoxes = UtilDict.filter(boundingBoxVisibility, function (key, boxVisible) {
                            return !boxVisible && Ramp.getLayerConfigWithId(key).settings.boundingBoxVisible;
                        });

                    addParameter(PARAM.FILTER.HIDDEN_BOXES, UtilDict.isEmpty(hiddenBoxes) ? null : {
                        // Convert an array of string into a "+" delimited string
                        hb: Object.keys(hiddenBoxes).join("+")
                    });

                    addParameter(PARAM.FILTER.VISIBLE_BOXES, UtilDict.isEmpty(visibleBoxes) ? null : {
                        // Convert an array of string into a "+" delimited string
                        vb: Object.keys(visibleBoxes).join("+")
                    });

                    updateURL();
                });

                topic.subscribe(EventManager.FilterManager.LAYER_TRANSPARENCY_CHANGED, function (event) {
                    addParameter(EventManager.FilterManager.LAYER_TRANSPARENCY_CHANGED, event);
                    layerTransparency[event.layerId] = Math.round(event.value * 100) / 100;

                    addParameter(EventManager.FilterManager.LAYER_TRANSPARENCY_CHANGED, {
                        lt: JSON.stringify(layerTransparency)
                    });

                    updateURL();
                });

                // This call is necessary to fill in the URL in the bookmark link
                // if this call is removed, there will be no URL in the bookmark link
                // until one of the above events fires
                updateURL();
            }
        };
    });