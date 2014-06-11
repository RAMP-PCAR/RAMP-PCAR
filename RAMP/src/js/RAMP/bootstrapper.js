/*global require, window, esri */

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
*

* @uses Util
* @uses Prototype
* @uses FunctionMangler
*/

require([
/* Dojo */
    "dojo/parser", "dojo/on",
    "dojo/request/script",
    "dojo/request/xhr",

/* RAMP */
    "ramp/map", "ramp/basemapselector", "ramp/maptips", "ramp/datagrid",
    "ramp/navigation", "ramp/filterManager", "ramp/bookmarkLink",
    "utils/url", "ramp/featureHighlighter",
    "ramp/ramp", "ramp/globalStorage", "ramp/gui", "ramp/eventManager",

/* Utils */
    "utils/util",

/* Plugins */
    "utils/prototype!", "utils/functionMangler!"],

    function (
    /* Dojo */
    parser, dojoOn, requestScript, xhr,

    /* RAMP */
    RampMap, BasemapSelector, Maptips, Datagrid, NavWidget, FilterManager,
    BookmarkLink, Url, FeatureHighlighter,
    ramp, globalStorage, gui, EventManager,

    /* Utils */
    utilMisc) {
        "use strict";

        function initializeMap() {
            RampMap.init();

            //init only creates the grid, does not populate it with data
            Datagrid.init();

            /* Start - RAMP Events, after map is loaded */

            dojoOn.once(RampMap.getMap(), "update-end", function () {
                // Only initialize the bookmark link after all the UI events of all other modules have
                // finished loading
                // IMPORTANT: for now, only basemapselector and filtermanager have a UI complete event
                // but in the future, if other modules start publishing their own UI complete events, it needs
                // to be subscribe to here so BookmarkLink will not attempt to call the module before its GUI
                // has finished rendering
                utilMisc.subscribeAll([EventManager.BasemapSelector.UI_COMPLETE, EventManager.FilterManager.UI_COMPLETE], function () {
                    BookmarkLink.init(window.location.pathname.split("/").last());
                });
                // Added current leve so slider will know how to adjust the position
                var currentLevel = (RampMap.getMap().__LOD.level) ? RampMap.getMap().__LOD.level : 0;

                NavWidget.init(currentLevel);
                FeatureHighlighter.init();

                Maptips.init();

                //Apply listeners for basemap gallery
                BasemapSelector.init();

                //initialze the filter
                FilterManager.init();
            });

            /* End - RAMP Events */
        }
        /* End - Bootstrapper functions */

        // Check to make sure the console exists, redefines it to the no-op function
        // if it does not (e.g. in IE when the debugger is not on)
        utilMisc.checkConsole();

        // Once all of our modules are loaded and the DOM is ready:

        // call the parser to create the dijit layout dijits
        parser.parse();

        //turn off cors detection to stop cross domain error from happening.
        esri.config.defaults.io.corsDetection = false;

        //To hold values from RAMP service

        var   //siteURL = new Url(require.toUrl(document.location)),
            lang = $("html").attr("lang"); // window.location.href.split("/").last().substring(5, 7); // siteURL.queryObject.lang || window.navigator.userLanguage || window.navigator.language || "en";

        if (lang !== "en" && lang !== "fr") {
            lang = "en";
        }

        //loading config object from JSON file

        var configFile = (lang === "fr") ? "config.fr.json" : "config.en.json";

        // Request the JSON config file
        var defJson = xhr(configFile, {
            handleAs: "json"
        });

        defJson.then(
            function (fileContent) {
                //there is no need to convert the result to an object.  it comes through pre-parsed

                globalStorage.config = fileContent;

                gui.load(null, null, function () { });

                initializeMap();
                ramp.loadStrings();
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
        ramp.loadStrings();

        var handle = window.setTimeout(function () {
        }, 2000);
        },
        function (error) {
        //console.log("An error occurred: " + error);
        }
        );

        */
    });