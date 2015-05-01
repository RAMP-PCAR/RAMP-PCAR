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
    jsPrefix = pathname + jsFolderPath,
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
    configServiceURL: "http://sncr01wbingsdv1.ncr.int.ec.gc.ca:8000/v1/",
    // FIXME move the config service URL out of this file since it is now minified and appended to lib.js in the build

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
        featureInfoParser: {},
        projectionLookup: {}
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
            fullscreen: false,
            wmsQuery: true
        }
    },

    /**
     * Store global flags.  Should only contain boolean entries.
     *
     * @property flags
     * @type Object
     */
    flags: {},

    /**
     * Scripts to be loaded after dojo config is prepared.  Loaded in order (works around an IE9 issue).
     *
     * @property scripts
     * @type array
     */
    scripts: ['http://js.arcgis.com/3.13/', jsPrefix + 'lib/wet-boew/js/wet-boew.js', jsPrefix + 'RAMP/bootstrapper.js']
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
            location: jsPrefix + "RAMP/Modules"
        },
        {
            name: "utils",
            location: jsPrefix + "RAMP/Utils"
        },
        {
            name: "tools",
            location: jsPrefix + "RAMP/Tools/"
        }
    ],
    fullPluginPath: jsPrefix + 'plugins/'
};

(function loadRampScripts(scripts) {
    'use strict';
    if (scripts.length === 0) { return; }
    importScript(scripts[0], function () { loadRampScripts(scripts.slice(1)); });
})(RAMP.scripts);
