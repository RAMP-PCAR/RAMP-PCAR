/*global define, console, $ */

//the "use strict" forces the ECMA Script 5 interpretation of the code

/**
* QuickZoom submodule
*
* @module RAMP
* @submodule QuickZoom
* @main QuickZoom
*/

/**
* The QuickZoom class handles zooming in the map based on province, city, or postal code.
* These zoom in services rely on web services which return extent values based the user-entered province, city, or postal code
*
* @class QuickZoom
* @uses dojo/_base/declare
* @uses dojo/_base/array
* @uses dojo/_base/lang
* @uses dojo/dom
* @uses dojo/dom-construct
* @uses dijit/form/Form
* @uses dijit/form/TextBox
* @uses dijit/form/Select
* @uses dijit/form/Button
* @uses esri/geometry/Extent
* @uses esri/tasks/QueryTask
* @uses esri/tasks/query
* @uses GlobalStorage
* @uses Map
* @uses Util
*/

define([
/* Dojo */
"dojo/_base/declare", "dojo/_base/array", "dojo/_base/lang", "dojo/dom", "dojo/dom-construct", "dijit/form/Form",
"dijit/form/TextBox", "dijit/form/Select", "dijit/form/Button",
/* Esri */
"esri/geometry/Extent", "esri/tasks/QueryTask", "esri/tasks/query",
/* Ramp */
"ramp/globalStorage", "ramp/map",
/* Util */
"utils/util"],

    function (
    /* Dojo */
    declare, dojoArray, dojoLang, dom, domConstruct, Form, TextBox, Select, Button,
    Extent, QueryTask, Query,
    /* Ramp */
    GlobalStorage, RampMap,
    /* Util */
    UtilMisc) {
        "use strict";
        return declare(null, {
            /*
             * Defines the UI controls for the province, city, and postal code selections
             * @method constructor
             * @constructor
             *
             */
            constructor: function () {
                this.config = GlobalStorage.config;

                this.form = new Form({
                    style: "overflow:hidden; clear:none;"
                });

                var className = "quickZoom"; // used for CSS styling

                this.provinceSelect = new Select({
                    id: "quickZoomProvince",
                    class: className,
                    options: []
                });

                this.citySelect = new Select({
                    id: "quickZoomCity",
                    class: className,
                    options: []
                });

                this.postalCodeTextbox = new TextBox({
                    id: "quickZoomPostalCode",
                    class: className,
                    style: "width : 30%"
                });

                this.button = new Button({
                    label: "Find",
                    id: "quickZoomButton",
                    class: className
                });

                var that = this; // for local access to "this"
                function _addNode(domNode) {
                    that.form.domNode.appendChild(domNode);
                }

                function _addLabel(text) {
                    var node = domConstruct.create("label", {
                        class: className,
                        innerHTML: text
                    });
                    _addNode(node);
                    return node;
                }

                _addLabel("Choose province:");
                _addNode(this.provinceSelect.domNode);

                _addLabel("City:");
                _addNode(this.citySelect.domNode);

                _addLabel("or enter postal code (e.g. A1A):");
                _addNode(this.postalCodeTextbox.domNode);

                _addNode(this.button.domNode);
                this.errorText = _addLabel("");
            },

            _setError: function (errorMsg) {
                console.log(errorMsg);
                $(this.errorText).text(errorMsg);
            },
            /*
             * This adds the search tools to the UI and populates the UI controls: Province dropdown, city drop down, postal code text box
             *
             * @method init
             * @param {Object} where A DOM object where the dropdowns will be placed
             * @constructor
             */
            init: function (where) {
                var provinceSelect = this.provinceSelect,
                    citySelect = this.citySelect,
                    config = this.config,
                    that = this; // for local access to "this"

                /**
                * Change the extent of the map based on the extent data
                * retrieved from the given url
                *
                * @method changeExtent
                * @private
                * @param {String} url
                * @param {Object} query
                */
                function changeExtent(url, query) {
                    query.returnGeometry = true;

                    var queryTask = new QueryTask(url);
                    queryTask.execute(query,
                        function (featureSet) {
                            if (featureSet.features.isEmpty()) {
                                that._setError("invalid query");
                                return;
                            }
                            var extent = featureSet.features[0].geometry.getExtent();
                            if (RampMap.getMaxExtent().contains(extent)) {
                                RampMap.getMap().setExtent(extent);
                                that._setError("");
                            } else {
                                that._setError("beyond max extent");
                            }
                        },
                        function (error) {
                            console.log("Could not load extent from service");
                            console.log(error);
                        });
                }

                /**
                * Populate the given dropdown with data from the given url.
                *
                * @method populateDropDown
                * @param {String} url the url to the service containing the data to populate the dropdown
                * @param {DObject} select the dojo Select object to populate
                * @param {Object} query to execute
                * @param {Function} mapFunc the function to convert each element in the retrieved data to a label that can be added to the dropdown menu
                */
                function populateDropDown(url, select, query, mapFunc) {
                    // Clear the dropdown
                    select.removeOption(select.getOptions());

                    var queryTask = new QueryTask(url);
                    queryTask.execute(query,
                        function (featureSet) {
                            // Populate the dropdown from a list retrieved
                            // from service
                            select.addOption(dojoArray.map(featureSet.features, mapFunc));
                        },
                        function (error) {
                            console.log("Could not populate dropdown");
                            console.log(error);
                        });
                }

                // Populate the province dropdown from a list retrieved
                // from service
                provinceSelect.loadDropDown(function () {
                    var provinceConfig = config.quickzoom.province,
                        query = new Query();

                    query.where = "OBJECTID>0";
                    query.outFields = [provinceConfig.shortName, provinceConfig.name];

                    populateDropDown(provinceConfig.url, provinceSelect, query,
                        function (feature) {
                            var shortName = feature.attributes[provinceConfig.shortName];
                            return {
                                label: feature.attributes[provinceConfig.name],
                                value: shortName,
                                selected: shortName === provinceConfig.selectedProv
                            };
                        });
                });

                /**
                * Populates the city dropdown menu with the cities in the
                * selected province.
                *
                * @method populateCityDropDown
                * @private
                * @param {String} prov
                */
                function populateCityDropDown(prov) {
                    var cityConfig = config.quickzoom.city,
                        query = new Query();

                    query.where = UtilMisc.getWhereClause(cityConfig.province, prov);
                    query.outFields = [cityConfig.name, cityConfig.id];
                    populateDropDown(cityConfig.url, citySelect, query,
                    function (feature) {
                        return {
                            label: feature.attributes[cityConfig.name],
                            value: feature.attributes[cityConfig.id],
                            selected: false
                        };
                    });
                }

                citySelect.loadDropDown(function () {
                    // Populate with the cities of the default province first
                    populateCityDropDown(config.quickzoom.province.selectedProv);
                });

                provinceSelect.on("change", function () {
                    // Change the extent, then populate the city with the cities in the province
                    var provConfig = config.quickzoom.province,
                        prov = provinceSelect.get("value"),
                        query = new Query();
                    query.where = UtilMisc.getWhereClause(provConfig.shortName, prov);

                    changeExtent(provConfig.url, query);
                    populateCityDropDown(prov);
                });

                citySelect.on("change", function () {
                    var cityConfig = config.quickzoom.city,
                        city = citySelect.get("value"),
                        query = new Query();
                    query.where = UtilMisc.getWhereClause(cityConfig.id, city);

                    changeExtent(cityConfig.url, query);
                });

                /**
                * Returns true if the given postal code is valid, false otherwise.
                *
                * @method validatePostalCode
                * @private
                * @param {String} fsa fsa
                */
                function validatePostalCode(fsa) {
                    //Perform case insensitive matching
                    var regexp = /[abcdefghijklmnopqrstuvwxyz]\d[abcdefghijklmnopqrstuvwxyz]/i;

                    //Remove space from the input FSA
                    fsa = dojoLang.trim(fsa);

                    //Detect if the user has entered the postal code in correct format
                    if (fsa) {
                        var result = fsa.match(regexp);
                        return (result && result.length === 1);
                    }
                    return false;
                }

                this.button.on("click", dojoLang.hitch(this, function () {
                    var postalCode = this.postalCodeTextbox.get("value");
                    if (validatePostalCode(postalCode)) {
                        var postalConfig = config.quickzoom.postalCode,
                            query = new Query();
                        query.where = UtilMisc.getWhereClause(postalConfig.id, postalCode);
                        changeExtent(postalConfig.url, query);
                    } else {
                        console.log("invalid postal code!");
                        that._setError("invalid postal code");
                    }
                }));

                var whereNode = dom.byId(where);
                domConstruct.place(this.form.domNode, whereNode, "replace");
            }
        });
    });