/*global location, $, document */

/**
*
*
* @module RAMP
*/

/**
* RAMPStarter class.
* Performs initial configuration of the dojo config object specifying path to the RAMP modules, detecting locale, and loading the {{#crossLink "Bootstrapper"}}{{/crossLink}} module.
* pipe the locale to dojo.
*
* @class RAMPStarter
* @static
*/

//required to get draw bar to show in French
var RAMP,
    jsFolderPath = "js/",
    pathname = location.pathname.replace(/\/[^/]+$/, "") + "/",
    htmlNode = $("html"),
    dojoConfig;

/**
* RAMP global class.
* A general globally available class to hold any RAMP global data. Currently houses any plugins which are not loaded via AMD.
*
* @class RAMP
*/
RAMP = {
    /**
     * Contains a URL that points to the application configuration (JSON format) if it's hosted on a web service.
     * This is not required if the application has a JSON config file in the website's folder
     * @property configServiceURL
     * @type String
     */
    configServiceURL: "http://localhost:5000/",

    /**
     * The RAMP application config, it should be treated as read only by all modules other than globalStorage and bootstrapper
     *
     * @property config
     * @type Object
     */
    config: {},

    /**
     * A registry of plugins for RAMP code to reference, these should be loaded and registered by bootstrapper.js
     *
     * @property plugins
     * @type Object
     */
    plugins: {
        featureInfoParser: {}
    }
};

dojoConfig = {
    parseOnLoad: false,
    locale: htmlNode.attr("lang"),
    async: true,
    packages: [
        {
            name: "ramp",
            location: pathname + jsFolderPath + "RAMP/Modules"
        },
        {
            name: "utils",
            location: pathname + jsFolderPath + "RAMP/Utils"
        },
        {
            name: "tools",
            location: pathname + jsFolderPath + "RAMP/Tools/"
        }
    ],
    fullPluginPath: pathname + jsFolderPath + 'plugins/'
};

$(document).ready(function () {
    "use strict";
    // when loading js file this way, it will NOT show up in the debug panel in Firebug
    /*$.getScript(pathname + jsFolderPath + state + "RAMP/bootstrapper.js",
        function( data, textStatus, jqxhr ) {
            console.log( jqxhr.status ); // 200
    });*/

    // when loading js file this way, it will show up in the debug panel in Firebug
    var head = document.getElementsByTagName('head')[0],
        script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = pathname + jsFolderPath + "RAMP/bootstrapper.js";
    head.appendChild(script);
});