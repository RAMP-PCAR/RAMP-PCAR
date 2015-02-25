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
    },

    /**
    * A temporary solution to state management.  Will be changed
    *
    * @property state
    * @type Object
    */
    state: {
        ui: {
            sidePanelOpened: true,
            fullscreen: false
        }
    }
};

var importScript = (function (oHead) {
	'use strict';

	function loadError (oError) {
		throw new URIError("The script " + oError.target.src + " is not accessible.");
    }

    return function (sSrc, fOnload) {
        var oScript = document.createElement("script");
        oScript.type = "text\/javascript";
        oScript.onerror = loadError;
        if (fOnload) { oScript.onload = fOnload; }
            oHead.appendChild(oScript);
            oScript.src = sSrc;
        };

    })(document.head || document.getElementsByTagName("head")[0]);

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

importScript('http://js.arcgis.com/3.10/', function () {
	'use strict';
	importScript(pathname + jsFolderPath + "RAMP/bootstrapper.js");
});