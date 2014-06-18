/*global window, location */

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
var sPath = window.location.href,
    sPage = sPath.substring(sPath.lastIndexOf('/') + 1).toLowerCase(),
    jsFolderPath = "js/",
    cssFolderPath = "css/",
    state = "src/", // replace with "build" upon release,
    pathname = location.pathname.replace(/\/[^/]+$/, "") + "/",
    themeName = ($("html")
                    .attr("class")
                    .split(" ")
                    .filter(function(one)
                        {
                            "use strict";
                            return one.indexOf("ramp-") === 0;
                        }
                    )[0] || "ramp-base"),
    dojoConfig;

dojoConfig = {
    parseOnLoad: false,
    locale: sPage.indexOf('lang=fr') > -1 ? "fr" : "en",
    async: true,
    packages:[{
            "name" : "ramp",
            "location" : pathname + jsFolderPath + "RAMP/Modules"
        },
        {
            "name" : "utils",
            "location" : pathname + jsFolderPath + "RAMP/Utils"
        },
        {
            "name" : "themes",
            "location" : pathname + jsFolderPath + "RAMP/Themes/" + themeName
        }],
    jsFolderPath: jsFolderPath,
    cssFolderPath: cssFolderPath,
    extensionPrefix: state === "build/" ? ".min" : "",
    buildState: state
};

$(document).ready(function(){
    "use strict";
    // when loadin js file that way, it will NOT show up in the debug panel in Firebug
    /*$.getScript(pathname + jsFolderPath + state + "RAMP/bootstrapper.js",
        function( data, textStatus, jqxhr ) {
            console.log( jqxhr.status ); // 200
    });*/

    // when loadin js file that way, it will show up in the debug panel in Firebug
    var head = document.getElementsByTagName('head')[0],
        script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = pathname + jsFolderPath + "RAMP/bootstrapper.js";
    head.appendChild(script);
});

console.log("\n        ___               _    _        ______              \n       / _ \\             | |  (_)       |  ___|             \n      / /_\\ \\ _ __   ___ | |_  _   ___  | |_     ___  __  __\n      |  _  || '__| / __|| __|| | / __| |  _|   / _ \\ \\ \\/ /             ,-,\n      | | | || |   | (__ | |_ | || (__  | |    | (_) | >  <        _.-=;~ /_\n      \\_| |_/|_|    \\___| \\__||_| \\___| \\_|     \\___/ /_/\\_\\    _-~   '     ;.\n                                                            _.-~     '   .-~-~`-._\n                                                      _.--~~:.             --.____88\n                                    ____.........--~~~. .' .  .        _..-------~~\n                           _..--~~~~               .' .'             ,'\n                       _.-~                        .       .     ` ,'\n                     .'                                    :.    ./\n                   .:     ,/          `                   ::.   ,'\n                 .:'     ,(            ;.                ::. ,-'\n                .'     ./'.`.     . . /:::._______.... _/:.o/\n               /     ./'. . .)  . _.,'               `88;?88|\n             ,'  . .,/'._,-~ /_.o8P'                  88P ?8b\n          _,'' . .,/',-~    d888P'                    88'  88|\n       _.'~  . .,:oP'        ?88b              _..--- 88.--'8b.--..__\n      :     ...' 88o __,------.88o ...__..._.=~- .    `~~   `~~      ~-._ v0.1 _.\n      `.;;;:='    ~~            ~~~                ~-    -       -   -\n\n");