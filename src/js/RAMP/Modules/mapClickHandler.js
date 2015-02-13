/* global define, RAMP, console, i18n, $ */

/**
* @module RAMP
* @submodule Map
*/

/**
* Map click handler class.
*
* The mapClickHandler registers WMS layers for combined getFeatureInfo request.  It makes a 
* single subscription to Map.CLICK and triggers a set of requests and joins the results together.
*
* @class MapClickHandler
* @static
* @uses EventManager
* @uses esri/request
* @uses dojo/promise/all
* @uses dojo/_base/array
* @uses dojo/topic
*/

define([
/* RAMP */
    "ramp/eventManager",

/* Dojo */
    "esri/request", "dojo/promise/all", "dojo/_base/array", "dojo/topic"
    ],

    function (
    /* RAMP */
    EventManager,

    /* Dojo */
    EsriRequest, all, dojoArray, topic
    ) {

        "use strict";
        var wmsClickQueue = [], // the queue of WMS layers registered to trigger on click
            esriMap; // a local reference to the map object (for pull extent and dimensions)

        return {

            /**
            * This function should be called after the map has been created.  It will subscribe to the Map.CLICK event
            * and trigger GUI.SUBPANEL_OPEN events for displaying the response data.
            *
            * @method registerWMSClick
            * @param  {Object} map an EsriMap instance
            */
            init: function (map) {
                esriMap = map;
                topic.subscribe(EventManager.Map.CLICK, function (evt) {
                    var visibleLayers = [],
                        rqPromises = [];

                    // filter only currently visible layers
                    visibleLayers = dojoArray.filter(wmsClickQueue, function (wmsData) {
                        return wmsData.wmsLayer.visible;
                    });

                    // if no visible layers return early and do not open the panel
                    if (visibleLayers.length === 0) {
                        return;
                    }

                    topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                        panelName: i18n.t('mapClickHandler.getFiPanelName'),
                        title: i18n.t('mapClickHandler.getFiPanelTitle'),
                        content: null,
                        origin: "wmsFeatureInfo",
                        target: $("#map-div"),
                        guid: 'wms-guid'
                    });

                    // create an EsriRequest for each WMS layer (these follow the promise API)
                    rqPromises = dojoArray.map(visibleLayers, function (wmsData) {
                        try {
                            var req = {}, wkid, mapSR, srList;
                            mapSR = wmsData.wmsLayer.getMap().spatialReference;
                            srList = wmsData.wmsLayer.spatialReferences;

                            if (srList && srList.length > 1) {
                                wkid = srList[0];
                            } else if (mapSR.wkid) {
                                wkid = mapSR.wkid;
                            }
                            if (wmsData.wmsLayer.version === "1.3" || wmsData.wmsLayer.version === "1.3.0") {
                                req = { CRS: "EPSG:" + wkid, I: evt.layerX, J: evt.layerY };
                            } else {
                                req = { SRS: "EPSG:" + wkid, X: evt.layerX, Y: evt.layerY };
                            }
                            $.extend(req, {
                                SERVICE: "WMS",
                                REQUEST: "GetFeatureInfo",
                                VERSION: wmsData.wmsLayer.version,
                                BBOX: esriMap.extent.xmin + "," + esriMap.extent.ymin + "," + esriMap.extent.xmax + "," + esriMap.extent.ymax,
                                WIDTH: esriMap.width,
                                HEIGHT: esriMap.height,
                                QUERY_LAYERS: wmsData.layerConfig.layerName,
                                LAYERS: wmsData.layerConfig.layerName,
                                INFO_FORMAT: wmsData.layerConfig.featureInfo.mimeType
                            });
                            return new EsriRequest({
                                url: wmsData.wmsLayer.url.split('?')[0],
                                content: req,
                                handleAs: "text"
                            });

                        } catch (exception) {
                            console.log("WMS Error: " + exception);
                        }
                        

                    });

                    topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                        content: "",
                        origin: "wmsFeatureInfo",
                        update: true,
                        guid: 'wms-guid'
                    });

                    // wait for all success or any failure in the requests
                    all(rqPromises).then(function (results) {
                        console.log('all success');
                        console.log(results);

                        var strings = dojoArray.map(results, function (response, index) {
                            var res = "<h5 class='margin-top-none'>" + visibleLayers[index].layerConfig.displayName + "</h5>" +
                                      RAMP.plugins.featureInfoParser[visibleLayers[index].layerConfig.featureInfo.parser](response);
                            return res;
                        });

                        topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                            content: strings.join(''),
                            origin: "wmsFeatureInfo",
                            update: true,
                            guid: 'wms-guid'
                        });

                    }, function (errors) {
                        console.log('wms errors');
                        console.log(errors);

                        topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                            content: String.format("<em>{0}</em>",i18n.t('mapClickHandler.getFiFailed')),
                            origin: "wmsFeatureInfo",
                            update: true,
                            guid: 'wms-guid'
                        });

                        console.log('subpanel open done');

                    });

                });

            },

            /**
            * This function is called to register a WMS layer for feature info click events.  The parameter wmsData
            * should include wmsLayer (an instance of an ESRI WMSLayer) and layerConfig (a reference to the configuration
            * node for the WMS layer).
            *
            * @method registerWMSClick
            * @param  {Object} wmsData
            */
            registerWMSClick: function (wmsData) {
                wmsClickQueue.push(wmsData);
            }

        };
    });