/* global RAMP, console */

console.log('loading stringParse');
RAMP.plugins.featureInfoParser.stringParse = function (data) {
    "use strict";

    return "<p>{0}</p>".format(data);
};