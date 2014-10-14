/* global RAMP, console */

console.log('loading windParse');
RAMP.plugins.featureInfoParser.windParse = function (data) {
    "use strict";

    var val = data.match(/value=(-?\d+\.?\d?)[\d \.]*\n/);
    val = val ? val[1] : '';
    return "<p>{0}</p>".format(val);
};
console.log('loaded windParse');