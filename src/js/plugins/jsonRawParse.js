/* global RAMP, console */

console.log('loading jsonRawParse');
RAMP.plugins.featureInfoParser.jsonRawParse = function (data) {
    'use strict';

    return '<p>{0}</p>'.format(data);
};
