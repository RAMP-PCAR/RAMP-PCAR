/*global require, window, dojoConfig, i18n, document, $, console, RAMP */

/**
* Ramp module
*
* @module RAMP
* @main RAMP
*/

/**
* Bootstrapper class.
* Starting point of RAMP, RAMP modules are loaded here and mapped to a function parameter
* Phase X?: For mobile support, there can be a different mobileBootstrapper with only the mobile modules loaded
*
* ####Imports RAMP Modules:
* {{#crossLink "Map"}}{{/crossLink}}
* {{#crossLink "BaseMapSelector"}}{{/crossLink}}
* {{#crossLink "Maptips"}}{{/crossLink}}
* {{#crossLink "Datagrid"}}{{/crossLink}}
* {{#crossLink "Navigation"}}{{/crossLink}}
* {{#crossLink "FilterManager"}}{{/crossLink}}
* {{#crossLink "BookmarkLink"}}{{/crossLink}}
* {{#crossLink "Url"}}{{/crossLink}}
* {{#crossLink "FeatureHighlighter"}}{{/crossLink}}
* {{#crossLink "RAMP"}}{{/crossLink}}
* {{#crossLink "GlobalStorage"}}{{/crossLink}}
* {{#crossLink "GUI"}}{{/crossLink}}
* {{#crossLink "EventManager"}}{{/crossLink}}
* {{#crossLink "AdvancedToolbar"}}{{/crossLink}}
* {{#crossLink "Util"}}{{/crossLink}}
* {{#crossLink "Prototype"}}{{/crossLink}}
* {{#crossLink "FunctionMangler"}}{{/crossLink}}
* {{#crossLink "LayerLoader"}}{{/crossLink}}
*
* @class Bootstrapper
* @static
*
* @uses dojo/parser
* @uses dojo/on
* @uses dojo/topic
* @uses dojo/request/script
* @uses dojo/request/xhr
*/

require([
/* Dojo */
    "dojo/parser", "dojo/topic", "dojo/request/script", "dojo/request/xhr", "dojo/number", "dojo/dom", "dojo/dom-construct", "dojo/query",
    "esri/config", "esri/urlUtils",

/* RAMP */
    "ramp/map", "ramp/basemapSelector", "ramp/maptips", "ramp/datagrid",
    "ramp/navigation", "ramp/filterManager", "ramp/imageExport", "ramp/bookmarkLink",
    "utils/url", "ramp/featureHighlighter",
    "ramp/globalStorage", "ramp/gui", "ramp/eventManager",
    "ramp/advancedToolbar", "ramp/geoSearch",
    "ramp/theme", "ramp/layerLoader", "ramp/dataLoaderGui", "ramp/metadataHandler",

/* Utils */
    "utils/util",

/* Plugins */
    "utils/prototype!", "utils/functionMangler!", "dojo/domReady!"],

    function (
    /* Dojo */
    parser, topic, requestScript, xhr, number, dom, domConstruct, query,
    esriConfig, esriUrlUtils,

    /* RAMP */
    RampMap, BasemapSelector, Maptips, Datagrid, NavWidget, FilterManager, ImageExport,
    BookmarkLink, Url, FeatureHighlighter,
    GlobalStorage, gui, EventManager, AdvancedToolbar, GeoSearch,
    theme, LayerLoader, DataLoaderGui, MetadataHandler,

    /* Utils */
    UtilMisc
    ) {
        "use strict";

        /**
        * loadPlugin takes a plugin file and loads it into the DOM.
        * Creates a dynamic script tag to load the script at runtime.
        *
        * @method loadPlugin
        * @private
        * @param {String} pluginName, the file name of the plugin to be loaded (should be in the plugins folder)
        */
        function loadPlugin(pluginName) {
            var head = document.getElementsByTagName('head')[0],
                script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = dojoConfig.fullPluginPath + pluginName;
            console.log('loading plugin: ' + script.src);
            head.appendChild(script);
        }

        function initializeMap() {
            /* Start - RAMP Events, after map is loaded */

            function initScale() {
                var map = RAMP.map,
                    scaleDiv = domConstruct.create("div", {
                        id: "scaleDiv",
                        class: "esriScalebarLabel"
                    }),
                    currentScale,
                    scaleLabelText;

                $(scaleDiv).html("<span>" + i18n.t('map.scale') + "</span><br><span id='scaleLabel'><span/>");
                currentScale = number.format(map.getScale());
                scaleLabelText = "1 : " + currentScale;

                domConstruct.place(scaleDiv, query(".esriScalebarRuler")[0], "before");
                domConstruct.empty('scaleLabel');
                $("#scaleLabel").text(scaleLabelText);

                // Change the css class of the scale bar so it shows up against
                // the map
                topic.subscribe(EventManager.BasemapSelector.BASEMAP_CHANGED, function (attr) {
                    $(".esriScalebar > div").removeClass().addClass(attr.cssStyle);
                });
            }

            // this split exists solely to separate out the parts that IE9 is
            // bad at handling there is a DOM race condition somewhere in here,
            // we've given up on trying to find it
            function guiInits() {
                //initialize the filter
                FilterManager.init();
                MetadataHandler.init();

                // Initialize the advanced toolbar and tools.
                if (RAMP.config.advancedToolbar.enabled) {
                    AdvancedToolbar.init();
                }

                Datagrid.init();
                theme.tooltipster();

                //start loading the layers
                RAMP.startupLayers.forEach(function (layer) {
                    LayerLoader.loadLayer(layer);
                });
            }

            topic.subscribe(EventManager.Map.INITIAL_BASEMAP_LOADED, function () {
                console.log("map - >> first update-end; init the rest");

                initScale();

                // Only initialize the bookmark link after all the UI events of all other modules have
                // finished loading
                // IMPORTANT: for now, only basemapselector and filtermanager have a UI complete event
                // but in the future, if other modules start publishing their own UI complete events, it needs
                // to be subscribe to here so BookmarkLink will not attempt to call the module before its GUI
                // has finished rendering
                UtilMisc.subscribeAll(
                    [
                        EventManager.BasemapSelector.UI_COMPLETE,
                        EventManager.FilterManager.UI_COMPLETE
                    ], function () {
                        BookmarkLink.subscribeAndUpdate();

                        //initialize the map export after everything is done
                        ImageExport.init();

                        DataLoaderGui.init();
                    });
                // Added current level so slider will know how to adjust the position
                var currentLevel = (RampMap.getMap().__LOD.level) ? RampMap.getMap().__LOD.level : 0;

                NavWidget.init(currentLevel);
                FeatureHighlighter.init();

                Maptips.init();

                //Apply listeners for basemap gallery
                BasemapSelector.init();

                if (RAMP.flags.brokenWebBrowser || RAMP.flags.ie10client) {
                    console.log('delaying for IE9 and IE10 to catch up with the group');
                    window.setTimeout(guiInits, 2000);
                } else {
                    guiInits();
                }
            });

            RampMap.init();
            NavWidget.construct();

            // a workaround for bug#3460; ideally each module's ui component would call tooltipster on its own; probably a good idea would to implement this when working on mobile view
            theme.tooltipster();

            /* End - RAMP Events */
        }
        /* End - Bootstrapper functions */

        // Check to make sure the console exists, redefines it to the no-op function
        // if it does not (e.g. in IE when the debugger is not on)
        UtilMisc.checkConsole();

        // Once all of our modules are loaded and the DOM is ready:

        // call the parser to create the dijit layout dijits
        parser.parse();

        //To hold values from RAMP service

        var lang = $("html").attr("lang"),
            configFile,
            defJson;

        if (lang !== "en" && lang !== "fr") {
            lang = "en";
        }

        RAMP.locale = lang;

        i18n.init(
        {
            lng: lang + "-CA",
            load: "current",
            fallbackLng: false
        });

        //loading config object from JSON file
        configFile = (lang === "fr") ? "config.fr.json" : "config.en.json";

        // Request the JSON config file
        defJson = xhr(configFile, {
            handleAs: "json"
        });

        defJson.then(
            function (fileConfig) {
                //there is no need to convert the result to an object.  it comes through pre-parsed
                if (!RAMP.configServiceURL) {
                    //no config service.  we just use the file provided
                    configReady(fileConfig);
                } else {
                    //get additional config stuff from the config service.  mash it into our primary object

                    // pull smallkeys from URL
                    var siteURL = new Url(require.toUrl(document.location)),
                        smallkeys = siteURL.queryObject.keys;

                    if (!smallkeys || smallkeys === "") {
                        //no keys.  no point hitting the service.  jump to next step
                        configReady(fileConfig);
                    } else {
                        //TODO verify endpoint is correct
                        var serviceUrl = RAMP.configServiceURL + "docs/" + $("html").attr("lang") + "/" + smallkeys,
                            defService = requestScript.get(serviceUrl, { jsonp: 'callback', timeout: 5000 });

                        //Request the JSON snippets from the RAMP Config Service

                        //NOTE: XHR cannot be used here for cross domain purposes (primarily when running thru visual studio).
                        //      we use request/script instead to get the config as jsonp
                        //      we may consider looking into ways to mitiate the cross domain issue (Aly had some ideas)

                        defService.then(
                            function (serviceContent) {
                                console.log(serviceContent);

                                //we are expecting an array of JSON config fragments
                                //merge each fragment into the file config

                                serviceContent.forEach(function (configFragment) {
                                    UtilMisc.mergeRecursive(fileConfig, configFragment);
                                });

                                //fragments are now in fileConfig.  carry on.
                                configReady(fileConfig);
                            },
                            function (error) {
                                console.log("An error occurred: " + error);
                            }
                        );
                    }
                }
            },
            function (error) {
                console.log("An error occurred when retrieving the JSON Config: " + error);
            }
        );

        /**
        * once the config file has been retrieved, proceed with the loading of the site
        *
        * @method configReady
        * @private
        * @param {Object} configObject the configuration object
        */
        function configReady(configObject) {
            var pluginConfig,
                advancedToolbarToggle = $("li.map-toolbar-item #advanced-toggle").parent(),
                brokenWebBrowser = document.getElementsByTagName('html')[0].className.indexOf('dj_ie9') > -1,
                annoyingWebBrowser = document.getElementsByTagName('html')[0].className.indexOf('dj_ie10') > -1;

            console.log("Bootstrapper: config loaded");

            GlobalStorage.init(configObject);
            GlobalStorage.defineProjections(window.proj4);
            GeoSearch.init();

            esriConfig.defaults.io.proxyUrl = RAMP.config.proxyUrl;
            // try to avoid the proxy if possible, but this will cause network errors if CORS is not allowed by the target server
            esriConfig.defaults.io.corsDetection = !brokenWebBrowser;
            // really IE9???  (╯°□°）╯︵ ┻━┻
            if (brokenWebBrowser && RAMP.config.exportProxyUrl !== undefined) {
                esriUrlUtils.addProxyRule({ proxyUrl: RAMP.config.exportProxyUrl, urlPrefix: RAMP.config.exportMapUrl });
            }
            RAMP.flags.brokenWebBrowser = brokenWebBrowser;
            RAMP.flags.ie10client = annoyingWebBrowser;

            // Show or remove advanced toolbar toggle based on the config value
            if (RAMP.config.advancedToolbar.enabled) {
                advancedToolbarToggle.removeClass("wb-invisible");
            } else {
                advancedToolbarToggle.remove();
            }

            pluginConfig = RAMP.config.plugins;
            if (pluginConfig) {
                pluginConfig.map(function (pName) { loadPlugin(pName); });
            }

            // apply defaulting of extents (must be done prior to bookmark link updates)
            RampMap.applyExtentDefaulting();

            // Modify the config based on the url
            // needs to do this before the gui loads because the gui module
            // also reads from the config
            BookmarkLink.updateConfig(window.location.pathname.split("/").last());

            //other initilizations must wait until our extents have been projected to our active basemap
            topic.subscribe(EventManager.Map.EXTENTS_REPROJECTED, function () {
                // Initialize the map only after the gui loads
                // if we do it beforehand, the map extent may get messed up since
                // the available screen size may still be changing (e.g. due to fullscreen
                // or subpanel closing)
                topic.subscribe(EventManager.GUI.UPDATE_COMPLETE, function () {
                    // Create the panel that the bookmark link sits in
                    // can only do this after the gui loads
                    BookmarkLink.createUI();

                    LayerLoader.init();
                    initializeMap();
                });

                gui.load(null, null, function () { });
            });

            //project extents to basemap
            RampMap.projectConfigExtents();
        }
    });
