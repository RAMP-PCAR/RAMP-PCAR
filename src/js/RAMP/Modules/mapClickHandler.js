/* global define, RAMP, console, i18n, $, document, window */

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
* ####Imports RAMP Modules:
* {{#crossLink 'EventManager'}}{{/crossLink}}
*
* @class MapClickHandler
* @static
* @uses esri/request
* @uses dojo/promise/all
* @uses dojo/_base/array
* @uses dojo/topic
*/

define([

/* RAMP */
    'ramp/eventManager',

/* Dojo */
    'esri/request', 'dojo/promise/all', 'dojo/topic',
],

    function (

    /* RAMP */
    EventManager,

    /* Dojo */
    EsriRequest, all, topic
    ) {
        'use strict';
        var wmsClickQueue = []; // the queue of WMS layers registered to trigger on click
        var esriMap; // a local reference to the map object (for pull extent and dimensions)

        return {
            /**
            * This function should be called after the map has been created.  It will subscribe to the Map.CLICK
            * event and trigger GUI.SUBPANEL_OPEN events for displaying the response data.  Tests
            * RAMP.config.ui.mapQueryToggle.show to determine if it should process the query or not.
            *
            * @method registerWMSClick
            * @param  {Object} map an EsriMap instance
            */
            init: function (map) {
                var modalHeader;

                esriMap = map;
                topic.subscribe(EventManager.Map.CLICK, function (evt) {
                    var visibleLayers = [];
                    var rqPromises = [];

                    // construct modal header on the first call to prevent potential race condition when locale
                    // resources didn't have time to load just yet
                    if (!modalHeader) {
                        modalHeader = '<header class="modal-header"><h2 class="modal-title">{0}</h2></header>'
                            .format(i18n.t('mapClickHandler.getFiPanelTitle'));
                    }

                    if (!RAMP.config.ui.mapQueryToggle.show) {
                        return;
                    }

                    console.log(RAMP.layerRegistry);

                    // filter only currently visible layers
                    visibleLayers = wmsClickQueue.filter(function (wmsLayer) {
                        console.log(wmsLayer);
                        return wmsLayer.visible &&
                            wmsLayer.id in RAMP.layerRegistry &&
                            RAMP.layerRegistry[wmsLayer.id] &&

                            // can't use loadOk directly because nothing sets it to true
                            wmsLayer.ramp.loadOk !== false &&

                            // check if wmsQuery toggle is set to true
                            wmsLayer.ramp.state.queryEnabled === true;
                    });

                    // if no visible layers return early and do not open the panel
                    if (visibleLayers.length === 0) {
                        return;
                    }

                    topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                        panelName: i18n.t('mapClickHandler.getFiPanelName'),
                        title: i18n.t('mapClickHandler.getFiPanelTitle'),
                        content: null,
                        origin: 'wmsFeatureInfo',
                        target: $('#map-div'),
                        guid: 'wms-guid',
                    });

                    // create an EsriRequest for each WMS layer (these follow the promise API)
                    rqPromises = visibleLayers.map(function (wmsLayer) {
                        try {
                            var req = {};
                            var wkid;
                            var mapSR;
                            var srList;

                            mapSR = wmsLayer.getMap().spatialReference;
                            srList = wmsLayer.spatialReferences;

                            if (srList && srList.length > 1) {
                                wkid = srList[0];
                            } else if (mapSR.wkid) {
                                wkid = mapSR.wkid;
                            }

                            if (wmsLayer.version === '1.3' || wmsLayer.version === '1.3.0') {
                                req = { CRS: 'EPSG:' + wkid, I: evt.screenPoint.x, J: evt.screenPoint.y };
                            } else {
                                req = { SRS: 'EPSG:' + wkid, X: evt.screenPoint.x, Y: evt.screenPoint.y };
                            }

                            $.extend(req, {
                                SERVICE: 'WMS',
                                REQUEST: 'GetFeatureInfo',
                                VERSION: wmsLayer.version,
                                BBOX: esriMap.extent.xmin + ',' + esriMap.extent.ymin + ',' + esriMap.extent.xmax +
                                    ',' + esriMap.extent.ymax,
                                WIDTH: esriMap.width,
                                HEIGHT: esriMap.height,
                                QUERY_LAYERS: wmsLayer.ramp.config.layerName,
                                LAYERS: wmsLayer.ramp.config.layerName,
                                INFO_FORMAT: wmsLayer.ramp.config.featureInfo.mimeType,
                            });

                            //console.log('BBOX: ' + esriMap.extent.xmin + ',' + esriMap.extent.ymin + ',' +
                            //esriMap.extent.xmax + ',' + esriMap.extent.ymax);
                            //console.log('Clicked at (map units): ' + evt.mapPoint.x + ',' + evt.mapPoint.y);
                            //console.log('Clicked at (pixels): ' + evt.screenPoint.x + ',' + evt.screenPoint.y);
                            //console.log('Clicked at (pixels): ' + evt.layerX + ',' + evt.layerY);
                            return new EsriRequest({
                                url: wmsLayer.url.split('?')[0],
                                content: req,
                                handleAs: 'text',
                            });
                        } catch (exception) {
                            console.log('WMS Error: ' + exception);
                        }
                    });

                    topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                        content: '',
                        origin: 'wmsFeatureInfo',
                        update: true,
                        guid: 'wms-guid',
                    });

                    // wait for all success or any failure in the requests
                    all(rqPromises).then(function (results) {
                        console.log('all success');
                        console.log(results);

                        var strings = results.map(function (response, index) {
                            var res = '<h5 class="margin-top-none">' + visibleLayers[index].ramp.config.displayName +
                                '</h5>' + RAMP.plugins.featureInfoParser[visibleLayers[index].ramp.config.
                                          featureInfo.parser](response, visibleLayers[index].id);
                            return res;
                        }).join('');

                        var modalBox =
                            '<section id="wms-results-large" class="mfp-hide modal-dialog modal-content overlay-def">' +
                            modalHeader + '<div class="modal-body">' + strings + '</div></section>';

                        $('.sub-panel').on('click', '#wms-expand', function () {
                            $(document).trigger('open.wb-lbx', [{ src: '#wms-results-large', type: 'inline' }]);
                            $('#wms-results-large').css({
                                width: Math.round(window.innerWidth * 0.9) + 'px',
                                'max-height': Math.round(window.innerHeight * 0.75) + 'px',
                            });
                        });

                        topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                            content: modalBox + '<a id="wms-expand" href="#wms-results-large" role="button" ' +
                                        'aria-controls="wms-results-large">' +  i18n.t('gui.actions.expand') +
                                        '</a>' + strings,
                            origin: 'wmsFeatureInfo',
                            update: true,
                            guid: 'wms-guid',
                        });
                    },

                    function (errors) {
                        console.log('wms errors');
                        console.log(errors);

                        topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                            content: String.format('<em>{0}</em>', i18n.t('mapClickHandler.getFiFailed')),
                            origin: 'wmsFeatureInfo',
                            update: true,
                            guid: 'wms-guid',
                        });

                        console.log('subpanel open done');
                    });
                });
            },

            /**
            * This function is called to register a WMS layer for feature info click events.  The parameter wmsData
            * should include wmsLayer (an instance of an ESRI WMSLayer) and layerConfig (a reference to the
            * configuration node for the WMS layer).
            *
            * @method registerWMSClick
            * @param  {Object} wmsData
            */
            registerWMSClick: function (wmsData) {
                wmsClickQueue.push(wmsData);
            },
        };
    });
