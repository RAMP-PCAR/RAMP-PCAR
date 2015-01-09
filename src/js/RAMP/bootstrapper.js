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
* @class Bootstrapper
* @static
*
* @uses dojo/parser
* @uses dojo/on
* @uses dojo/topic
* @uses dojo/request/script
* @uses dojo/request/xhr
*
* @uses Map
* @uses Basemapselector
* @uses Maptips
* @uses Datagrid
* @uses Navigation
* @uses FilterManager
* @uses BookmarkLink
* @uses Url
* @uses FeatureHighlighter
* @uses Ramp
* @uses GlobalStorage
* @uses GUI
* @uses EventManager
* @uses AdvancedToolbar
* @uses Util
* @uses Prototype
* @uses FunctionMangler
* @uses LayerLoader
*/

require([
/* Dojo */
    "dojo/parser", "dojo/on", "dojo/topic",
    "dojo/request/script",
    "dojo/request/xhr", "dojo/_base/array",
    "esri/config",

/* RAMP */
    "ramp/map", "ramp/basemapSelector", "ramp/maptips", "ramp/datagrid",
    "ramp/navigation", "ramp/filterManager", "ramp/bookmarkLink",
    "utils/url", "ramp/featureHighlighter",
    "ramp/ramp", "ramp/GlobalStorage", "ramp/gui", "ramp/eventManager",
    "ramp/advancedToolbar",
    "ramp/theme", "ramp/layerLoader",

/* Utils */
    "utils/util", "utils/dictionary",

/* Plugins */
    "utils/prototype!", "utils/functionMangler!"],

    //"dojo/domReady!"],

    function (
    /* Dojo */
    parser, dojoOn, topic, requestScript, xhr, dojoArray,
    esriConfig,

    /* RAMP */
    RampMap, BasemapSelector, Maptips, Datagrid, NavWidget, FilterManager,
    BookmarkLink, Url, FeatureHighlighter,
    Ramp, GlobalStorage, gui, EventManager, AdvancedToolbar, theme, LayerLoader,

    /* Utils */
        UtilMisc, UtilDict
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

            topic.subscribe(EventManager.Map.INITIAL_BASEMAP_LOADED, function () {
                console.log("map - >> first update-end; init the rest");

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

                        //RampMap.zoomToLayerScale();
                    });
                // Added current level so slider will know how to adjust the position
                var currentLevel = (RampMap.getMap().__LOD.level) ? RampMap.getMap().__LOD.level : 0;

                NavWidget.init(currentLevel);
                FeatureHighlighter.init();

                Maptips.init();

                //Apply listeners for basemap gallery
                BasemapSelector.init();

                //initialize the filter
                FilterManager.init();
                // TODO : remove this hack after James finishes layer loader
                UtilDict.forEachEntry(RAMP.config.layers, function (key, value) {
                    value.forEach(function (v) {
                        FilterManager.addLayer(GlobalStorage.layerType[key], v);
                    });
                });

                // Initialize the advanced toolbar and tools.
                if (RAMP.config.advancedToolbar.enabled) {
                    AdvancedToolbar.init();
                }

                Datagrid.init();
                theme.tooltipster();                

                //start loading the layers
                dojoArray.forEach(RAMP.startupLayers, function (layer) {
                    LayerLoader.loadLayer(layer);
                });
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
                            defService = requestScript.get(serviceUrl, { jsonp: 'callback', timeout: 2000 });

                        //Request the JSON snippets from the RAMP Config Service

                        //NOTE: XHR cannot be used here for cross domain purposes (primarily when running thru visual studio).
                        //      we use request/script instead to get the config as jsonp
                        //      we may consider looking into ways to mitiate the cross domain issue (Aly had some ideas)

                        defService.then(
                            function (serviceContent) {
                                console.log(serviceContent);

                                //we are expecting an array of JSON config fragments
                                //merge each fragment into the file config

                                dojoArray.forEach(serviceContent, function (configFragment) {
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
                advancedToolbarToggle = $("li.map-toolbar-item #advanced-toggle").parent();

            console.log("Bootstrapper: config loaded");

            GlobalStorage.init(configObject);

            esriConfig.defaults.io.proxyUrl = RAMP.config.proxyUrl;// "/proxy/proxy.ashx";
            // try to avoid the proxy if possible, but this will cause network errors if CORS is not allowed by the target server
            esriConfig.defaults.io.corsDetection = true;

            // Show or remove advanced toolbar toggle based on the config value
            if (RAMP.config.advancedToolbar.enabled) {
                advancedToolbarToggle.removeClass("wb-invisible");
            } else {
                advancedToolbarToggle.remove();
            }

            pluginConfig = RAMP.config.plugins;
            if (pluginConfig) {
                dojoArray.map(pluginConfig, function (pName) {
                    loadPlugin(pName);
                });
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
                    LayerLoader.init();
                    initializeMap();
                });

                gui.load(null, null, function () { });

                // Create the panel that the bookmark link sits in
                // can only do this after the gui loads
                BookmarkLink.createUI();

                Ramp.loadStrings();
            });

            //project extents to basemap
            RampMap.projectConfigExtents();
        }
    });