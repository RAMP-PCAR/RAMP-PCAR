/* global define, console, RAMP, escape */

/**
*
*
* @module RAMP
* @submodule GeoSearch
*/

/**
* GeoSearch class.
*
* Handles the querying of the geolocation service
* This includes adding user filters, parsing user input, and packaging return values
* NOTE: the geogratis services treat lat/long as length-2 arrays where longitude comes first
*       e.g. [-77.167641,44.1072025]
*       code in this module will keep to that convention
*
* @class LayerLoader
* @static
* @uses dojo/Deferred
* @uses dojo/request/script
*/

define([
/* Dojo */
 "dojo/request/script", "dojo/Deferred"

/* ESRI */
//"esri/tasks/GeometryService", "esri/tasks/ProjectParameters", "esri/geometry/Extent",
],

    function (
    /* Dojo */
    script, Deferred

        /* ESRI */
        //GeometryService, ProjectParameters, EsriExtent,
) {
        "use strict";

        //types of special inputs by the user
        var parseType = {
            none: "none",
            fsa: "fsa",
            lonlat: "lonlat",
            prov: "prov"
        }, statusType = {
            list: "list",
            none: "none",
            hide: "hide"
        }, provSearch = [],
            provList = [],
            conciseList = [];

        /**
        * Will determine if a value is a valid province identifier (en/fr name or 2-letter abbr)
        *
        * @method isProvince
        * @private
        * @param {String} value value to test
        * @return {Boolean} tells if value is valid province identifier
        */
        function isProvince(value) {
            //this function is slightly redundant, as getProvCode would achieve the same result.
            //the thinking is this is used to quickly do an initial test (usually the test will be false).
            //once it is known the value is a province, the heavier logic can be executed in getProvCode (if needed).
            var lVal = value.toLowerCase();
            return provSearch.indexOf(lVal) > -1;
        }

        /**
        * Convert a provice name to province code
        *
        * @method getProvCode
        * @private
        * @param {String} prov province string
        * @return {String} province code. undefined if no match
        */
        function getProvCode(prov) {
            var lProv = prov.toLowerCase(),
                code;
            provList.every(function (elem) {
                //TODO is there a prettier way to do this IF?
                if (elem.abbr.toLowerCase() === lProv || elem.name.en.toLowerCase() === lProv || elem.name.fr.toLowerCase() === lProv) {
                    code = elem.code;
                    return false;
                }
                return true;
            });

            return code;
        }

        //worker function for sorting named lists
        function nameSorter(a, b) {
            if (a.name > b.name) {
                return 1;
            } else {
                return -1;
            }
        }

        /**
        * Returns a list of provinces and codes for the UI dropdown combo
        *
        * @method getProvList
        * @private
        * @return {Array} a list of province names and codes
        */
        function getProvList() {
            //The return value structure can be modified to best suit the UI when it is implemmented

            return provList.map(function (elem) {
                return {
                    name: elem.name[RAMP.locale],
                    code: elem.code
                };
            }).sort(nameSorter);
        }

        /**
        * Returns a list of concise names and codes for the UI dropdown combo
        *
        * @method getConciseList
        * @private
        * @return {Array} a list of concise names and codes
        */
        function getConciseList() {
            //The return value structure can be modified to best suit the UI when it is implemmented

            return conciseList.map(function (elem) {
                return {
                    name: elem.name[RAMP.locale],
                    code: elem.code
                };
            }).sort(nameSorter);
        }

        /**
        * Will determine if a value is a valid number for a lat/long co-ordinate
        *
        * @method isLatLong
        * @private
        * @param {String} value value to test
        * @return {Boolean} tells if value is valid lat/long
        */
        function isLatLong(value) {
            if (isNaN(value)) {
                return false;
            } else {
                var numType = Number(value);
                return ((numType >= -180) && (numType <= 180));
            }
        }

        /**
        * Will examine the user search string. Returns any special type and related data
        * Valid types are: none, fsa, lonlat, prov
        *
        * @method parseInput
        * @private
        * @param {String} input user search string
        * @return {Object} result of parse.  has .type (string) and .data (object) properties
        */
        function parseInput(input) {
            var ret = {
                type: parseType.none,
                data: input
            },
                fsaReg = /[A-Za-z]\d[A-Za-z]/;

            //check for FSA
            if ((input.length > 2) && (fsaReg.test(input.substring(0, 3)))) {
                //ensure there is a break after first 3 characters
                if (((input.length > 3) && (input.substring(3, 4) === ' ')) || (input.length === 3)) {
                    //tis an FSA
                    ret.type = parseType.fsa;
                    ret.data = input.substring(0, 3);
                    return ret;
                }
            }

            if (input.indexOf(',') > 0) {
                var vals = input.split(',');

                //check lat/long
                if (vals.length === 2) {
                    if (isLatLong(vals[0]) && isLatLong(vals[1])) {
                        ret.type = parseType.lonlat;
                        ret.data = [Number(vals[1]), Number(vals[0])]; //Reverse order to match internal structure of lonlat
                        return ret;
                    }
                }

                //check for trailing province
                //TODO move this into language configs?
                var provTest = vals[vals.length - 1].trim();

                //see if item after last comma is a province
                if (isProvince(provTest)) {
                    ret.type = parseType.prov;
                    ret.data = {
                        prov: getProvCode(provTest),
                        searchVal: input.substring(0, input.lastIndexOf(","))
                    };
                }
            }

            return ret;
        }

        /**
        * Will search for an FSA
        * Promise delivers centroid lat long if FSA is found
        *
        * @method fsaSearch
        * @private
        * @param {String} fsa FSA code
        * @return {Object} promise of results
        */
        function fsaSearch(fsa) {
            //results thing
            //lat long of the FSA centroid. nothing if invalid FSA

            var defResult = new Deferred(),
                //launch the search for the fsa
                defService = script.get(RAMP.config.geolocationUrl + RAMP.locale + '/locate', {
                    query: "q=" + fsa,
                    jsonp: "callback"
                });

            defService.then(
            function (serviceContent) {
                console.log(serviceContent);
                var res = { lonlat: undefined };

                //service returned.  check if we have a result
                if (serviceContent.length > 0) {
                    //find first item that is a postal code
                    serviceContent.every(function (elem) {
                        if (elem.type === "ca.gc.nrcan.geoloc.data.model.PostalCode") {
                            res.lonlat = elem.geometry.coordinates;
                            return false; //will cause the "every" loop to break
                        }
                        return true; //keep looping
                    });
                }

                //resolve the promise
                defResult.resolve(res);
            },
            function (error) {
                console.log("Geolocation search error : " + error);
                defResult.reject(error);
            });

            return defResult.promise;
        }

        /**
        * Will execute a specific search against the geoname service
        *
        * @method executeSearch
        * @private
        * @param {Object} params values to use in the search
        * @return {Object} promise of results
        */
        function executeSearch(params) {
            /*
            input param details
            any missing properties means don't apply it to the search

            .lonlat  array of two decimal degrees, lat and long.  if present, means do area search

            .radius  radius of area filter.  used with lonlat

            */

            //results thing
            //lat long of the FSA centroid. nothing if invalid FSA

            //build up our query string
            //http://www.nrcan.gc.ca/earth-sciences/geography/place-names/tools-applications/9249

            var query = "",
                defResult = new Deferred(),
                listLimit = 10, //TODO should this be defined in the config?
                defService;

            //search around a point
            if (params.lonlat) {
                query += "lat=" + params.lonlat[1].toString() + "&lon=" + params.lonlat[0].toString() + "&";

                if (params.radius) {
                    //should be between 1 and 100, and integer
                    query += "radius=" + params.radius.toString() + "&";
                }
            }

            if (params.q) {
                //inject wildcards after terms
                query += "q=" + escape(params.q.trim().replace('%20', ' ').replace(' ', '* ') + '*') + "&";
            }

            if (params.prov) {
                query += "province=" + params.prov + "&";
            }

            if (params.concise) {
                query += "concise=" + params.concise + "&";
            }

            if (params.showAll) {
                listLimit = 1000; //boost to max allowed by service
            }
            query += "num=" + listLimit + "&";

            console.log("Executing Query: " + query);

            //launch the search
            defService = script.get(RAMP.config.geonameUrl + RAMP.locale + '/geonames.json', {
                query: query,
                jsonp: "callback"
            });

            defService.then(
            function (searchResult) {
                console.log(searchResult);

                //turn complex results into simplified results (can add values as needed).
                //pass simplified result back to promise
                //NOTE: when using JSONP, the search results come back in a parent array.  If not JSONP, there is no array >:'(
                defResult.resolve(searchResult[0].items.map(function (elem) {
                    return {
                        name: elem.name,
                        location: elem.location,
                        province: elem.province.code, //convert to text here (en/fr)?
                        lonlat: [elem.longitude, elem.latitude],
                        type: elem.concise.code  //convert to text here (en/fr)?
                    };
                }));
            },
            function (error) {
                console.log("Geoname search error : " + error);
                defResult.reject(error);
            });

            return defResult.promise;
        }

        /**
        * Will trigger an basic name search, apply filters, and package the results
        *
        *
        * @method generalSearch
        * @private
        * @param {String} name string to search on
        * @param {Object} filters search filters, particarly lonlat and optional radius
        * @param {Object} defResult a Deferred supplied by the caller. areaSearch will resolve or reject it
        */
        function generalSearch(name, filters, defResult) {
            filters.q = name;

            var result = {},
            //do an search on the name
            defSearch = executeSearch(filters);

            defSearch.then(
                function (searchResult) {
                    //service returned.  package results

                    if (searchResult.length > 0) {
                        result.status = statusType.list;
                        result.list = searchResult;
                        result.defItem = searchResult[0].lonlat; //default to first item in the list
                    } else {
                        result.status = statusType.none;
                    }

                    //resolve the promise
                    defResult.resolve(result);
                },
                function (error) {
                    defResult.reject(error);
                });
        }

        /**
        * Will trigger an area search and package the results
        *
        *
        * @method areaSearch
        * @private
        * @param {Object} filters search filters, particarly lonlat and optional radius
        * @param {Object} defResult a Deferred supplied by the caller. areaSearch will resolve or reject it
        */
        function areaSearch(filters, defResult) {
            //set the lonlat as default result
            var result = {
                defItem: filters.lonlat
            },
            //do an area search on FSA centroid
            defArea = executeSearch(filters);

            defArea.then(
                function (searchResult) {
                    //service returned.  package results

                    //TODO debate if no results should be hide or none.  None would visually indicate nothing in FSA radius found, but might confuse user to think FSA was invalid
                    result.status = (searchResult.length > 0) ? statusType.list : statusType.hide;
                    result.list = searchResult;

                    //resolve the promise
                    defResult.resolve(result);
                },
                function (error) {
                    defResult.reject(error);
                });
        }

        /**
        * Will search on user input string.  Public endpoint for searches, will orchestrate the appropriate search calls
        *
        *
        * @method geoSearch
        * @private
        * @param {String} input search item user has entered
        * @param {Object} filters any filters provided from the UI
        * @return {Object} promise of results
        */
        function geoSearch(input, filters) {
            /*
            Filters thing
            .radius -- size of radius search in km.  default 10
            .prov -- province code
            .concise -- concise type code
            .showAll -- show all results or clip to first X.  default false

            */
            /*
            Result thing:

            defItem: lat/long -- the default item to zoom to if a person hits enter  (default is a reserved word, hence the lousy name)
            status: list, none, hide  -- status of the search. list means results. none means no results. hide means nothing should be shown (e.g. 1 char string, bad postal code)
            list: array of search results
                  - name
                  - location
                  - province
                  - lonlat
                  - type (concise type)

            */

            var defResult = new Deferred();

            //is search too short?
            if (input.length < 3) {
                defResult.resolve({
                    status: statusType.hide
                });
            }

            var parse = parseInput(input);

            switch (parse.type) {
                case parseType.none:
                    //add all the valid filter things, plus wildcards

                    generalSearch(parse.data, filters, defResult);

                    break;

                case parseType.fsa:
                    //search for the FSA
                    var fsaPromise = fsaSearch(parse.data);

                    fsaPromise.then(
                        function (fsaResult) {
                            //did we find an FSA?
                            if (fsaResult.lonlat) {
                                //get results around the FSA
                                areaSearch({
                                    lonlat: fsaResult.lonlat,
                                    radius: filters.radius
                                }, defResult);
                            } else {
                                //fsa not found.  return none result
                                defResult.resolve({
                                    status: statusType.none
                                });
                            }
                        },
                        function (error) {
                            defResult.reject(error);
                        }
                    );

                    break;

                case parseType.lonlat:
                    //package parsed lat/long for search
                    areaSearch({
                        lonlat: parse.data,
                        radius: filters.radius
                    }, defResult);

                    break;

                case parseType.prov:
                    //add the province filter
                    filters.prov = parse.data.prov;
                    generalSearch(parse.data.searchVal, filters, defResult);

                    break;
            }

            //after getting result, apply local extent filter if required

            return defResult.promise;
        }

        /**
        * Will initialize the module. Download provice keys & info. Download concise types keys & info.
        *
        * @method isLatLong
        * @private
        */
        function init() {
            //TODO do we need to worry about ensuring these calls return before the caller continues?
            //     they should be really fast, and if service is down geosearch is broken anyways.
            //     Init is called after the config loads, so should be plenty of time before a user starts geosearching

            //get provinces english
            var provUrl = '/codes/province.json',
                conciseUrl = '/codes/concise.json',
                defEnProv = script.get(RAMP.config.geonameUrl + 'en' + provUrl, {
                    jsonp: "callback"
                });

            defEnProv.then(
            function (result) {
                //service returned.  turn result into a formatted array
                provList = result[0].definitions.map(function (provEn) {
                    return {
                        code: provEn.code,
                        abbr: provEn.term,
                        name: {
                            en: provEn.description,
                            fr: ''
                        }
                    };
                });

                //now load the french provinces
                var defFrProv = script.get(RAMP.config.geonameUrl + 'fr' + provUrl, {
                    jsonp: "callback"
                });

                defFrProv.then(
                    function (result) {
                        //match up province IDs of the french data to the global province list.
                        //update the french names when a match is made
                        result[0].definitions.forEach(function (provFr) {
                            provList.every(function (elem) {
                                if (elem.code === provFr.code) {
                                    elem.name.fr = provFr.description;
                                    return false; //will cause the "every" loop to break
                                }
                                return true; //keep looping
                            });
                        });

                        //now that we have a full dataset of province info, make a quick-find array for determining if strings are provinces
                        provList.forEach(function (elem) {
                            provSearch.splice(0, 0, elem.abbr.toLowerCase(), elem.name.en.toLowerCase(), elem.name.fr.toLowerCase());
                        });
                    },
                     function (error) {
                         console.log("Fail to load french province codes : " + error);
                     });
            },
            function (error) {
                console.log("Fail to load english province codes : " + error);
            });

            //get geonames concise codes list english
            var defEnCon = script.get(RAMP.config.geonameUrl + 'en' + conciseUrl, {
                jsonp: "callback"
            });

            defEnCon.then(
             function (result) {
                 //service returned.  turn result into a formatted array
                 conciseList = result[0].definitions.map(function (conEn) {
                     return {
                         code: conEn.code,
                         name: {
                             en: conEn.term,
                             fr: ''
                         }
                     };
                 });

                 //now load the french concise codes
                 var defFrCon = script.get(RAMP.config.geonameUrl + 'fr' + conciseUrl, {
                     jsonp: "callback"
                 });

                 defFrCon.then(
                     function (result) {
                         //match up concise IDs of the french data to the global concise list.
                         //update the french names when a match is made
                         result[0].definitions.forEach(function (conFr) {
                             conciseList.every(function (elem) {
                                 if (elem.code === conFr.code) {
                                     elem.name.fr = conFr.term;
                                     return false; //will cause the "every" loop to break
                                 }
                                 return true; //keep looping
                             });
                         });
                     },
                      function (error) {
                          console.log("Fail to load french concise codes : " + error);
                      });
             },
             function (error) {
                 console.log("Fail to load english concise codes : " + error);
             });
        }

        return {
            geoSearch: geoSearch,
            init: init,
            getProvList: getProvList,
            getConciseList: getConciseList
        };
    });