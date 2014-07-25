/* global define */

/**
* @module Tools
*/

/**
* [Description]
*
*
*
* @class BaseTool
* @static
* @uses dojo/Evented
* @uses dojo/_base/lang
* @uses Checkbox
*/

define(["dojo/Evented", "dojo/_base/lang"],
    function (Evented, dojoLang) {
        "use strict";

        return dojoLang.mixin(new Evented(),
            {
            }
        );
    }
);