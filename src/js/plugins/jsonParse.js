/* global RAMP, console */

console.log('loading jsonParse');
RAMP.plugins.featureInfoParser.jsonParse = function (data) {
    'use strict';
    var summary, txArea;

    if (typeof data === 'string') {
        data = JSON.parse(data);
    }

    summary = Object.keys(data).filter(
        function (e) {
            return typeof data[e] !== 'object' && typeof data[e] !== 'undefined';
        }).map(function (e) {
            return '<tr><th>{0}</th><td style="padding-left: 1em">{1}</td></tr>'.format(e, data[e]);
        }).join('');
    txArea = '<textarea class="json-details" style="display: none">{0}</textarea>'.format(JSON.stringify(data));

    return '<table>{0}</table>{1}'.format(summary, txArea);
};
