/* global RAMP, console, $ */

console.log('Loading epsgio.js');
RAMP.plugins.projectionLookup.epsgio = function (crsString) {
    'use strict';

    var urnRegex = /urn:ogc:def:crs:EPSG::(\d+)/;
    var epsgRegex = /EPSG:(\d+)/;
    var urnMatches;
    var epsgMatches;
    var epsgCode;
    var def = $.Deferred();

    urnMatches = crsString.match(urnRegex);
    if (urnMatches) {
        epsgCode = urnMatches[1];
    } else {
        epsgMatches = crsString.match(epsgRegex);
        if (epsgMatches) {
            epsgCode = epsgMatches[1];
        }
    }

    if (!epsgCode) {
        def.reject('No EPSG code found');
        return def.promise();
    }

    $.get('http://epsg.io/' + epsgCode + '.proj4')
        .done(function (data) {
            console.log('epsg io lookup success');
            console.log(data);
            def.resolve(data);
        })
        .fail(function (err) {
            console.log(err);
            def.reject(null);
        });

    return def.promise();
};
