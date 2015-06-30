/* global define, console, RAMP, escape, angular, document */

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
 'dojo/request/script', 'dojo/Deferred', "dojo/topic",

 /* RAMP */
 'ramp/eventManager', 'utils/util'

/* ESRI */
//'esri/tasks/GeometryService', 'esri/tasks/ProjectParameters', 'esri/geometry/Extent',
],

    function (
    /* Dojo */
    script, Deferred, topic,

    /*RAMP*/
    EventManager, UtilMisc

        /* ESRI */
        //GeometryService, ProjectParameters, EsriExtent,
) {
        'use strict';

        //types of special inputs by the user
        var parseType = {
            none: 'none',
            fsa: 'fsa',
            lonlat: 'lonlat',
            prov: 'prov'
        }, statusType = {
            list: 'list',
            none: 'none',
            hide: 'hide'
        }, provSearch = [],
            provList = [],
            conciseList = [],

            map;

        /**
        * Will determine if a value is a valid province identifier (en/fr name or 2-letter br)
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
        * Convert a province name to province code
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
            //The return value structure can be modified to best suit the UI when it is implemented

            return provList.map(function (elem) {
                return {
                    name: elem.name,
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
            //The return value structure can be modified to best suit the UI when it is implemented

            return conciseList.map(function (elem) {
                return {
                    name: elem.name,
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
        * Will determine if a point is inside an extent
        *
        * @method isInExtent
        * @private
        * @param {Array} point co-ordinates in [lon, lat] format
        * @param {Array} extent co-ordinates in [lon_min, lat_min, lon_max, lat_max] format
        * @return {Boolean} tells if the point is inside the extent
        */
        function isInExtent(point, extent) {
            return (point[0] >= extent[0]) && (point[0] <= extent[2]) && (point[1] >= extent[1]) && (point[1] <= extent[3]);
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
                        searchVal: input.substring(0, input.lastIndexOf(','))
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
                    query: 'q=' + fsa,
                    jsonp: 'callback'
                });

            defService.then(
            function (serviceContent) {
                console.log(serviceContent);
                var res = { lonlat: undefined };

                //service returned.  check if we have a result
                if (serviceContent.length > 0) {
                    //find first item that is a postal code
                    serviceContent.every(function (elem) {
                        if (elem.type === 'ca.gc.nrcan.geoloc.data.model.PostalCode') {
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
                console.log('Geolocation search error : ' + error);
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

            var query = '',
                defResult = new Deferred(),
                listLimit = 10, //TODO should this be defined in the config?
                defService;

            //search around a point
            if (params.lonlat) {
                query += 'lat=' + params.lonlat[1].toString() + '&lon=' + params.lonlat[0].toString() + '&';

                if (params.radius) {
                    //should be between 1 and 100, and integer
                    query += 'radius=' + params.radius.toString() + '&';
                }
            }

            if (params.q) {
                //inject wildcards after terms
                query += 'q=' + escape(params.q.trim().replace('%20', ' ').replace(' ', '* ') + '*') + '&';
            }

            if (params.prov) {
                query += 'province=' + params.prov + '&';
            }

            if (params.concise) {
                query += 'concise=' + params.concise + '&';
            }

            if (params.showAll) {
                listLimit = 1000; //boost to max allowed by service
            }
            query += 'num=' + listLimit + '&';

            console.log('Executing Query: ' + query);

            //launch the search
            defService = script.get(RAMP.config.geonameUrl + RAMP.locale + '/geonames.json', {
                query: query,
                jsonp: 'callback'
            });

            defService.then(
            function (searchResult) {
                console.log(searchResult);

                //turn complex results into simplified results (can add values as needed).
                //pass simplified result back to promise
                //NOTE: when using JSONP, the search results come back in a parent array.  If not JSONP, there is no array >:'(

                var returnList = searchResult[0].items.map(function (elem) {
                    return {
                        name: elem.name,
                        location: elem.location,
                        province: elem.province.code, //convert to text here (en/fr)?
                        lonlat: [elem.longitude, elem.latitude],
                        type: elem.concise.code  //convert to text here (en/fr)?
                    };
                });

                //note the bbox parameter on the geonames service does not work well.
                //will do a manual extent filter here, if there is one.
                if (params.extent) {
                    defResult.resolve(returnList.filter(function (elem) {
                        return isInExtent(elem.lonlat, params.extent);
                    }));
                } else {
                    //no extent filter.  pass back entire list
                    defResult.resolve(returnList);
                }
            },
            function (error) {
                console.log('Geoname search error : ' + error);
                defResult.reject(error);
            });

            return defResult.promise;
        }

        /**
        * Will trigger a basic name search, apply filters, and package the results
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
        * Will give suggestions on what to search based on the given input.
        *
        * @method geoSuggestions
        * @private
        * @param {String} input search item user has entered
        * @return {Object} array of suggested searches
        */
        /*function getSuggestions(input) {
            var defRequest,
                queryUrl = RAMP.config.geolocationUrl + RAMP.locale + "/suggest?q=",
                province;

            if (input.lastIndexOf(',') > -1) {
                province = input.substring(input.lastIndexOf(',') + 1).trim();
            }

            // take part of string after the last comma;
            // remove from string iff it is a province
            ///if (isProvince(province)) {
            ///    input = input.substring(0, input.lastIndexOf(',') - 1);
            ///}

            defRequest = script.get(queryUrl + input, {
                jsonp: 'callback'
            });

            return defRequest;

            //defRequest.then(
            //    function (searchResult) {
            //        return searchResult.suggestions;
            //    });
        }*/

        /**
        * Will search on user input string.  Public endpoint for searches, will orchestrate the appropriate search calls.
        * Accepts the following filter properties
        *   - radius: size of search radius search in km.  default 10. only used with lat/long or FSA searches
        *   - prov: province code (numeric, e.g. 35, not 'ON')
        *   - concise: concise type code
        *   - showAll: show all results or clip to first 10.  default false
        *   - extent: extent of search area in lat/long [xmin, ymin, xmax, ymax].  caller will project from basemap to latlong.  reasoning: caller can project once then cache until extent changes
        *
        * Result object can have the following properties
        *   - status: status of the search. values are list, none, hide. list means results are present. none means no results. hide means nothing should be shown (e.g. 1 char search string, bad postal code)
        *   - defItem: a lonlat array of the default result to zoom to if a person hits enter. for FSA, it is FSA centroid; for lat/long, it is the lat/long point; otherwise it is the first result
        *   - list: array of search results
        *       - name: name of the result
        *       - location: general area where the result is situated
        *       - province: province code where the result is found (numeric, e.g. 35, not 'ON')
        *       - lonlat: co-ordinate where the result is located. array of [longitude, latitude]
        *       - type: concise type code for the result
        *
        * @method geoSearch
        * @private
        * @param {String} input search item user has entered
        * @param {Object} filters any filters provided from the UI
        * @return {Object} promise of results
        */
        function geoSearch(input, filters) {
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
        * Will initialize the module. Download province keys & info. Download concise types keys & info.
        *
        * @method isLatLong
        * @private
        */
        function init() {
            map = RAMP.map;

            angular
                .module('gs.service', [])
                .factory('geoService', ['$q',
                    function ($q) {
                        var currentSearchTerm;

                        // just a wrapper around geoSearch function for now
                        function search(searchTerm, filters) {
                            var deferred = $q.defer();
                            currentSearchTerm = searchTerm;

                            geoSearch(searchTerm, filters)
                                .then(function (data) {
                                    data.searchTerm = searchTerm;
                                    console.log('data received', data, searchTerm, currentSearchTerm);

                                    // old request returned
                                    if (searchTerm !== currentSearchTerm) {
                                        deferred.reject({ reason: 'old' });
                                    } else if (data.status === 'list') {
                                        deferred.resolve(data);
                                    } else {
                                        deferred.reject({ reason: 'no results' });
                                    }
                                },
                                    function (error) {
                                        deferred.reject(error);
                                    });

                            return deferred.promise;
                        }

                        // suggestions don't work right now.
                        /*function suggest(searchTerm) {
                            return getSuggestions(searchTerm)
                                .then(function (data) {
                                    if (data.suggestions.length > 0) {
                                        return data.suggestions;
                                    } else {
                                        return $q.reject('no suggestions');
                                    }
                                });
                        }*/

                        return {
                            search: search//,
                            //suggest: suggest
                        };
                    }
                ])
                .factory('filterService', ['$q', '$http', 'extents',
                    function ($q, $http, extents) {
                        var provUrl = '/codes/province.json',
                            conciseUrl = '/codes/concise.json',
                            data;

                        // sort items by term
                        function termSort(a, b) {
                            if (a.term < b.term) {
                                return -1;
                            }
                            if (a.term > b.term) {
                                return 1;
                            }
                            return 0;
                        }

                        // default and init data for filters
                        data = {
                            provinceList: [],
                            typeList: [],
                            extentList: extents.data,
                            distanceList: [
                                {
                                    code: '-1',
                                    name: 'Distance'
                                },
                                {
                                    code: '0',
                                    name: '5km'
                                },
                                {
                                    code: '1',
                                    name: '10km'
                                },
                                {
                                    code: '2',
                                    name: '15km'
                                },
                                {
                                    code: '3',
                                    name: '30km'
                                }
                            ],

                            currentProvince: {},
                            currentType: {},
                            currentExtent: {},
                            currentDistance: {}
                        };

                        // wait for all gets since if one fails and return the derived promise to be resolved by the stateProvider before injection
                        $q
                            .all([
                                //get provinces English
                                $http.get(RAMP.config.geonameUrl + 'en' + provUrl),
                                $http.get(RAMP.config.geonameUrl + 'fr' + provUrl),
                                //get geonames concise codes list English
                                $http.get(RAMP.config.geonameUrl + RAMP.locale + conciseUrl)
                            ])
                            .then(function (result) {
                                var iEn = RAMP.locale === 'en' ? 0 : 1,
                                    iFr = RAMP.locale === 'fr' ? 0 : 1,
                                    provincesMainLocale = result[iEn].data.definitions.sort(termSort),
                                    provincesOtherLocale = result[iFr].data.definitions.sort(termSort),
                                    concise = result[2].data.definitions.sort(termSort);

                                // "zip" up province en and fr lists so we have an array with both en and fr province names
                                data.provinceList = provincesMainLocale.map(function (p, i) {
                                    //now that we have a full dataset of province info, make a quick-find array for determining if strings are provinces
                                    provSearch.push(p.term.toLowerCase(), p.description.toLowerCase(), provincesOtherLocale[i].description.toLowerCase());

                                    return {
                                        code: p.code,
                                        abbr: p.term,
                                        name: p.description
                                    };
                                });

                                // TODO: refactor; temp - needed for non-ng search
                                angular.copy(data.provinceList, provList);

                                // add default province option
                                data.provinceList.unshift({
                                    code: '-1',
                                    abbr: '',
                                    name: 'Province'
                                });

                                data.currentProvince = data.provinceList[0];

                                // "zip" up concise en and fr lists so we have an array with both en and fr concise names
                                data.typeList = concise.map(function (c) {
                                    return {
                                        code: c.code,
                                        name: c.term
                                    };
                                });

                                // TODO: refactor; temp - needed for non-ng search
                                angular.copy(data.typeList, conciseList);

                                // add default type option
                                data.typeList.unshift({
                                    code: '-1',
                                    name: 'Type'
                                });

                                data.currentType = data.typeList[0];

                                data.currentExtent = data.extentList[0];
                                data.currentDistance = data.distanceList[0];

                            },
                            function (result, status) {
                                console.error('Fail to load province or concise codes', result, status);
                                return $q.reject('Fail to load province or concise codes', result, status);
                            });

                        return {
                            data: data,

                            // set filters to their defaults
                            clearFilters: function () {
                                data.currentProvince = data.provinceList[0];
                                data.currentType = data.typeList[0];
                                data.currentExtent = data.extentList[0];
                                data.currentDistance = data.distanceList[0];
                            },

                            getFilters: function () {
                                // need to assign current extent explicitly
                                //data.extentList[2].extent = extents.data.currentExtent;

                                return {
                                    prov: data.currentProvince.code !== '-1' ? data.currentProvince.code : undefined,
                                    concise: data.currentType.code !== '-1' ? data.currentType.code : undefined,
                                    extent: data.currentExtent.extent,
                                    radius: data.currentDistance.code !== '-1' ? data.currentDistance.code : undefined
                                };
                            }
                        };
                    }]
                )
                .factory('lookupService', ['filterService',
                    function (filterService) {
                        var data = filterService.data;

                        function findName(list, code) {
                            return list
                                .filter(function (p) {
                                    return p.code === code;
                                })[0]
                                .name;
                        }

                        return {
                            provinceName: function (provinceCode) {
                                return findName(data.provinceList, provinceCode);
                            },

                            typeName: function (typeCode) {
                                return findName(data.typeList, typeCode);
                            }
                        };
                    }]
                )
                .factory('extents', function () {
                    var data;

                    function extentToArray(ext) {
                        var xyminPoint,
                            xymaxPoint;

                        xyminPoint = UtilMisc.mapPointToLatLong({
                            x: ext.xmin,
                            y: ext.ymin,
                            spatialReference: {
                                wkid: ext.spatialReference.wkid
                            }
                        });
                        xymaxPoint = UtilMisc.mapPointToLatLong({
                            x: ext.xmax,
                            y: ext.ymax,
                            spatialReference: {
                                wkid: ext.spatialReference.wkid
                            }
                        });

                        /*return [
                            ext.xmin,
                            ext.ymin,
                            ext.xmax,
                            ext.ymax
                        ];*/

                        return [
                            xyminPoint[0],
                            xyminPoint[1],
                            xymaxPoint[0],
                            xymaxPoint[1]
                        ];
                    }

                    data = [
                        {
                            code: '-1',
                            name: 'Extent',
                            extent: undefined
                        },
                        {
                            code: '0',
                            name: 'All',
                            extent: extentToArray(RAMP.config.extents.fullExtent)
                        },
                        {
                            code: '1',
                            name: 'Visible',
                            extent: undefined
                        }
                    ];

                    topic.subscribe(EventManager.Map.EXTENT_CHANGE, function (event) {
                        // cache changed extent; this change will not trigger digest cycle - need to call $apply or soemthing like that
                        data[2].extent = extentToArray(event.extent);
                        console.log('factory:extents - extent changed', data[2].extent);
                    });

                    return {
                        data: data
                    };
                });

            angular
                .module('gs.directive', ['gs.service'])
                .directive('rpGeosearchFilter', function () {
                    return {
                        restrict: 'E',
                        scope: {
                            filterChange: '&'
                        },
                        templateUrl: 'js/RAMP/Modules/partials/rp-geosearch-filter.html',
                        controller: ['$scope', 'filterService',
                            function ($scope, filterService) {
                                // bind filterdata
                                $scope.filterData = filterService.data;

                                // call onChange when one of the filters changes
                                // this calls a search function on the main controller
                                $scope.onChange = $scope.filterChange;
                                $scope.clearFilters = function () {
                                    filterService.clearFilters();
                                    $scope.onChange();
                                };
                            }
                        ]
                    };
                })
                .directive('rpGeosearchResults', function () {
                    return {
                        restrict: 'E',
                        scope: {
                            results: '=',
                            state: '=',
                            parentSelect: '&select'
                        },
                        templateUrl: 'js/RAMP/Modules/partials/rp-geosearch-results.html',
                        controller: ['$scope', 'lookupService',
                            function ($scope, lookupService) {
                                /* jshint validthis: true */
                                var vm = this;

                                vm.lookup = lookupService; // bind lookupservice to resolve province and type names
                                vm.select = function (result) {
                                    vm.results.forEach(function (r) {
                                        r.selected = false;
                                    });

                                    result.selected = true;
                                    vm.parentSelect({
                                        result: result
                                    });
                                };
                            }
                        ],
                        controllerAs: 'geosearchResults',
                        bindToController: true
                    };
                });

            angular
                .module('gs', ['gs.service', 'gs.directive', 'ui.router'])
                .controller('GeosearchController', ['$scope', 'geoService', 'filterService', '$timeout',
                    function ($scope, geoService, filterService, $timeout) {
                        /* jshint validthis: true */
                        var vm = this,
                            placeholderResult = {
                                name: '',
                                placeholder: true
                            };

                        vm.selectedResult = {};
                        vm.results = [];
                        vm.state = 'hide'; // 'show', 'loading', 'hide', 'no-results'
                        
                        vm.clear = clear;
                        vm.search = search;
                        vm.select = select;
                        vm.onBlur = onBlur;
                        vm.onFocus = onFocus;

                        var timeoutPromise = $timeout(function () { }, 0);
                        
                        function clear() {
                            // remove touched and dirty classes from the form
                            if ($scope.geosearchForm) {
                                $scope.geosearchForm.$setPristine();
                                $scope.geosearchForm.$setUntouched();
                            }

                            placeholderResult.name = '';
                            vm.selectedResult = placeholderResult;
                            vm.results = [];

                            setState('hide');
                        }
                        
                        function search() {
                            console.log($scope.active);

                            $timeout.cancel(timeoutPromise);

                            if ($scope.geosearchForm.$valid) {

                                // if a result was selected before, reset it with a placeholder
                                if (!vm.selectedResult.placeholder) {
                                    vm.selectedResult.selected = false;
                                    placeholderResult.name = vm.selectedResult.name;
                                    vm.selectedResult = placeholderResult;
                                }

                                // create a timeout to show the loading label after 250ms
                                timeoutPromise = $timeout(function () {
                                    setState('loading');
                                }, 250);

                                geoService
                                    .search(vm.selectedResult.name, filterService.getFilters())
                                    .then(function (data) {
                                        $timeout.cancel(timeoutPromise);
                                        vm.results = data.list;
                                        setState('show');
                                        console.log('udpate results', data);
                                    })
                                    .catch(function (data) {
                                        console.error(data);

                                        // old means that a previous request was returned out of line; discarding
                                        if (data.reason !== 'old') {
                                            console.error(data);
                                            $timeout.cancel(timeoutPromise);
                                            vm.results = [];
                                            setState('no-results');
                                        }
                                    });
                            } else {
                                vm.results = [];
                            }
                        }

                        function select(result) {
                            console.log('selected result', result);

                            vm.selectedResult = result;
                            setState('hide');

                            var esriPoint = UtilMisc.latLongToMapPoint(result.lonlat[1], result.lonlat[0], map.extent.spatialReference);
                            map.centerAndZoom(esriPoint, 12);
                        }

                        function setState(value) {
                            vm.state = value;
                        }

                        function onBlur() {
                            if (vm.selectedResult.name === '') {
                                setState('hide');
                            }
                        }

                        function onFocus() {
                            setState('show');
                        }

                        vm.clear();
                    }
                ])
                .config(['$stateProvider',
                    function ($stateProvider) {
                        $stateProvider
                            .state('default', {
                                url: '*path', //catch all paths for now https://github.com/angular-ui/ui-router/wiki/URL-Routing,
                                templateUrl: 'js/RAMP/Modules/partials/rm-geosearch-state.html',
                                controller: 'GeosearchController',
                                controllerAs: 'geosearch'
                            });
                    }
                ]);

            angular.element(document).ready(function () {
                angular.bootstrap(document, ['gs'], {
                    strictDi: true
                });
            });
        }

        return {
            geoSearch: geoSearch,
            init: init,
            getProvList: getProvList,
            getConciseList: getConciseList
        };
    });
