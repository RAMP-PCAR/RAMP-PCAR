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

//required to get draw bar to show in french
var //sPath = window.location.href,
    //sPage = sPath.substring(sPath.lastIndexOf('/') + 1).toLowerCase(),
    RAMP,
    jsFolderPath = "js/",
    cssFolderPath = "css/",
    state = "src/", // replace with "build" upon release,
    pathname = location.pathname.replace(/\/[^/]+$/, "") + "/",
    htmlNode = $("html"),
    themeName = (htmlNode
                    .attr("class")
                    .split(" ")
                    .filter(function (one) {
                        "use strict";
                        return one.indexOf("ramp-") === 0;
                    }
                    )[0] || "ramp-base"),
    dojoConfig;

/**
* RAMP global class.
* A general globally available class to hold any RAMP global data.  Currently houses any plugins which are not loaded via AMD.
*
* @class RAMP
*/
RAMP = {
    plugins: {
        featureInfoParser: {}
    }
};

dojoConfig = {
    parseOnLoad: false,
    //locale: sPage.indexOf('lang=fr') > -1 ? "fr" : "en",
    locale: htmlNode.attr("lang") === "fr" ? "fr" : "en",
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
            name: "defaultTheme",
            location: pathname + jsFolderPath + "RAMP/Themes/ramp-base"
        },
        {
            name: "themes",
            location: pathname + jsFolderPath + "RAMP/Themes/" + themeName
        },
        {
            name: "tools",
            location: pathname + jsFolderPath + "RAMP/Tools/"
        }
    ],
    jsFolderPath: jsFolderPath,
    cssFolderPath: cssFolderPath,
    fullPluginPath: pathname + jsFolderPath + 'plugins/',
    extensionPrefix: state === "build/" ? ".min" : "",
    buildState: state
};

$(document).ready(function () {
    "use strict";
    // when loading js file that way, it will NOT show up in the debug panel in Firebug
    /*$.getScript(pathname + jsFolderPath + state + "RAMP/bootstrapper.js",
        function( data, textStatus, jqxhr ) {
            console.log( jqxhr.status ); // 200
    });*/

    // when loading js file that way, it will show up in the debug panel in Firebug
    var head = document.getElementsByTagName('head')[0],
        script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = pathname + jsFolderPath + "RAMP/bootstrapper.js";
    head.appendChild(script);
});