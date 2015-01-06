/**
* A module for loading from web services and local files.  Fetches and prepares data for consumption by the ESRI JS API.
* 
* @module RAMP
* @submodule DataLoader
*/

define([
        "dojo/Deferred", "ersi/request"
    ],
    function (
            Deferred, EsriRequest
        ) {
        "use strict";

        function addGeoJson(args) {
            if (args.file) {
                if (args.url) {
                    throw new Error("Either url or file should be specified, not both");
                }
                throw new Error("to be implemented");
            } else if (args.url) {
                var def = new Deferred(),
                    req = new EsriRequest({ url: args.url });

                req.then(function (result) {
                    var jsonLayer = null;
                    try {
                        jsonLayer = makeGeoJSONLayer(result);
                        def.resolve(jsonLayer);
                    } catch (e) {
                        def.reject(e);
                    }
                }, function (error) {
                    def.reject(e);
                });

                return def.promise;
            }
        }
    });