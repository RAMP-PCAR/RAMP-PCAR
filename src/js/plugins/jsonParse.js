/* global RAMP, console */

console.log('loading jsonParse');
RAMP.plugins.featureInfoParser.jsonParse = function (data) {
    'use strict';
    var summary;

    data = { a: 1, b: '2', c: true, d: [1, 2, 3], e: { f: 1, g: 2 }, h: null };

    summary = Object.keys(data).filter(function (e) { return typeof data[e] !== 'object' && typeof data[e] !== 'undefined'; }).map(function (e) { return '<tr><th>{0}</th><td>{1}</td></tr>'.format(e, data[e]); }).join('');

    return "<table>{0}</table>".format(summary);
};