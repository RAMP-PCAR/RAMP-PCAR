/* global RAMP, console */

console.log('loading htmlRawParse');
RAMP.plugins.featureInfoParser.htmlRawParse = function (data) {
    'use strict';

    return '{0}'.format(data);
};
