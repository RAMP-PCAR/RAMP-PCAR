/* global RAMP */

console.log('loading tempParse');
RAMP.plugins.featureInfoParser.tempParse = function (data) {
    "use strict";

    var val = data.match(/value=(-?\d+\.?\d?)\d*\n/),
        unit = data.match(/unit=(.*)\n/);
    val = val ? val[1] : '';
    unit = unit ? unit[1] : '';
    return "<p>{0} &deg;C</p>".format(val, unit);
};