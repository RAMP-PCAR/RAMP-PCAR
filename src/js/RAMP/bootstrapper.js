/*global require, window, esri, dojoConfig, i18n, document, $, console */

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
* @uses PopulationTool
* @uses MeasureTool
* @uses BufferTool
*

* @uses Util
* @uses Prototype
* @uses FunctionMangler
*/

require([
/* Dojo */
    "dojo/parser", "dojo/on", "dojo/topic",
    "dojo/request/script",
    "dojo/request/xhr", "dojo/_base/array",

/* RAMP */
    "ramp/map", "ramp/basemapSelector", "ramp/maptips", "ramp/datagrid",
    "ramp/navigation", "ramp/filterManager", "ramp/bookmarkLink",
    "utils/url", "ramp/featureHighlighter",
    "ramp/ramp", "ramp/globalStorage", "ramp/gui", "ramp/eventManager",
    "ramp/advancedToolbar",
    "ramp/theme",

/* Utils */
    "utils/util",

/* Tools */
    //"tools/populationTool", "tools/measureTool", "tools/bufferTool",

/* Plugins */
    "utils/prototype!", "utils/functionMangler!"],

    //"dojo/domReady!"],

    function (
    /* Dojo */
    parser, dojoOn, topic, requestScript, xhr, dojoArray,

    /* RAMP */
    RampMap, BasemapSelector, Maptips, Datagrid, NavWidget, FilterManager,
    BookmarkLink, Url, FeatureHighlighter,
    Ramp, globalStorage, gui, EventManager, AdvancedToolbar, theme,

    /* Utils */
    UtilMisc//,

        /* Tools */
        //PopulationTool, MeasureTool, BufferTool
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

            topic.subscribe(EventManager.Map.ALL_LAYERS_LOADED, function () {
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

                // Initialize the advanced toolbar and tools.
                if (globalStorage.config.advancedToolbar.enabled) {
                    AdvancedToolbar.init();
                }

                Datagrid.init();

                theme.tooltipster();
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

        //turn off cors detection to stop cross domain error from happening.
        esri.config.defaults.io.corsDetection = false;

        //To hold values from RAMP service

        var   //siteURL = new Url(require.toUrl(document.location)),
            lang = $("html").attr("lang"), // window.location.href.split("/").last().substring(5, 7); // siteURL.queryObject.lang || window.navigator.userLanguage || window.navigator.language || "en";
            configFile,
            defJson;

        if (lang !== "en" && lang !== "fr") {
            lang = "en";
        }

        i18n.init(
        {
            lng: lang + "-CA",
            load: "current",
            fallbackLng: false
        }/*,
        function (t) {
            // tests
            // translate nav
            $(".mb-menu").i18n();

            var bname = "baseNrCan";

            console.log(t("basemaps." + bname, { context: "name" }));
            console.log(t("basemaps." + bname, { context: "description" }));

            console.log(t("basemaps" + "." + bname + "." + "name"));
            console.log(t("basemaps" + "." + bname + "." + "description"));

            console.log("->", t("translation2.measure"));

            i18n.loadNamespace('tools/translation2', function () {
                console.log("--->", i18n.t("tools/translation2.measure"));
                console.log("-->", i18n.t("tools/translation2:measure", { defaultValue: "my text" }));
            });

            window.setTimeout(function () {
                console.log("---->", i18n.t("tools/translation2:measure", { defaultValue: "my text" }));
            }, 1000);
            
        }*/
        );

        //loading config object from JSON file
        configFile = (lang === "fr") ? "config.fr.json" : "config.en.json";

        // Request the JSON config file
        defJson = xhr(configFile, {
            handleAs: "json"
        });

        defJson.then(
            function (fileContent) {
                var pluginConfig,
                    advancedToolbarToggle = $("li.map-toolbar-item #advanced-toggle").parent();
                //there is no need to convert the result to an object.  it comes through pre-parsed

                console.log("Bootstrapper: config loaded");

                globalStorage.config = fileContent;

                // Show or remove advanced toolbar toggle based on the config value
                if (globalStorage.config.advancedToolbar.enabled) {
                    advancedToolbarToggle.removeClass("wb-invisible");
                } else {
                    advancedToolbarToggle.remove();
                }

                pluginConfig = globalStorage.config.plugins;
                if (pluginConfig) {
                    dojoArray.map(pluginConfig, function (pName) {
                        loadPlugin(pName);
                    });
                }
                // Modify the config based on the url
                // needs to do this before the gui loads because the gui module
                // also reads from the config
                BookmarkLink.updateConfig(window.location.pathname.split("/").last());

                // Initialize the map only after the gui loads
                // if we do it beforehand, the map extent may get messed up since
                // the available screen size may still be changing (e.g. due to fullscreen
                // or subpanel closing)
                topic.subscribe(EventManager.GUI.UPDATE_COMPLETE, function () {
                    initializeMap();
                });

                gui.load(null, null, function () { });

                // Create the panel that the bookmark link sits in
                // can only do this after the gui loads
                BookmarkLink.createUI();

                Ramp.loadStrings();
            },
            function (error) {
                console.log("An error occurred when retrieving the JSON Config: " + error);
            }
        );

        //------------------------------

        //loading config object from web service

        /*
        var serviceUrl = globalStorage.getConfigUrl() + "getConfig/" + $("html").attr("lang") + "/?keys=" + smallkeys;

        // Request the JSON config file
        //NOTE: XHR cannot be used here for cross domain purposes (primarily when running thru visual studio).
        //      we use request/script instead to get the config as jsonp

        var defJson = requestScript.get(serviceUrl, { jsonp: "callback" });

        defJson.then(
        function (fileContent) {
        //there is no need to convert the result to an object.  it comes through pre-parsed
        // Global config object

        gui.load(null, null, function () { });

        //NOTE: ECDMP service has the json config file stored in an object property called "json" in string format.
        //      This is to avoid strongly typing the JSON config in the VB.Net Service.

        globalStorage.config = json.fromJson(fileContent.json);
        initializeMap();
        Ramp.loadStrings();

        var handle = window.setTimeout(function () {
        }, 2000);
        },
        function (error) {
        //console.log("An error occurred: " + error);
        }
        );

        */
    });