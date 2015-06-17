/*global define, tmpl, i18n, $, RAMP */

/**
* MetadataHandler submodule
*
* @module RAMP
* 
*/

/**
* Metadata Handler class.
*
* The metadataHandler class registers and manages the metadata panel. 
* (The panel created by the "metadata" buttons in the layer selector.
*
* ####Imports RAMP Modules:
* {{#crossLink "EventManager"}}{{/crossLink}}  
* {{#crossLink "PopupManager"}}{{/crossLink}}
* {{#crossLink "TmplHelper"}}{{/crossLink}}
* {{#crossLink "Util"}}{{/crossLink}}
*
* ####Uses RAMP Templates:
* {{#crossLink "templates/filter_wms_meta_Template.json"}}{{/crossLink}}
* 
* @class MetadataHandler
* @static
* @uses dojo/Deferred
* @uses dojo/topic
*/

define([
/* RAMP */
        "ramp/eventManager",

/* Dojo */
        "dojo/Deferred", "dojo/topic",

/* Text */
        "dojo/text!./templates/filter_wms_meta_Template.json",

/* Util */
        "utils/popupManager", "utils/tmplHelper", "utils/util"],

    function (
    /* RAMP */
    EventManager,

    /* Dojo */
    Deferred, topic,

    /* Text */
    filter_wms_meta_Template,

    /* Util */
    PopupManager, TmplHelper, UtilMisc) {
        "use strict";
        var metadataPopup;

        // Register the Metadata Popup with the PopupManager
        function setupPopup() {
            // display metadata when the metadata button is clicked;
            metadataPopup = PopupManager.registerPopup($("#layerList"), "click",
                        function (d) {
                            // close the popup, this will update aria tags;
                            // the metadata panel will be closed by metadataClickHandler if needed.
                            if (metadataPopup.isOpen(null, "any")) {
                                // need to reject the open promise since we are actually closing the popup
                                d.reject();
                                metadataPopup.close();

                                metadataClickHandler(this.target);
                            } else {
                                metadataClickHandler(this.target);

                                d.resolve();
                            }
                        },
                        {
                            closeHandler: function (d) {
                                d.resolve();
                            },
                            handleSelector: ".metadata-button",
                            openOnly: true,
                            activeClass: "button-pressed"
                        }
                    );
        }

        // Called by the metadataPopup
        function metadataClickHandler(target) {

            var button = $(target),
                node = button.parents(".filter-row-container");

            if (!node.hasClass("selected-row")) {
                //var guid = $(this).data("guid") || $(this).data("guid", UtilMisc.guid()).data("guid");
                var id = button.data("layer-id"),
                    layer = RAMP.layerRegistry[id],
                    layerConfig = layer ? layer.ramp.config : null,
                    metadataUrl;

                topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                    panelName: i18n.t('filterManager.metadata'),
                    title: node.find(".layer-name span").text(), // + " " + guid,
                    content: null,
                    target: node.find(".layer-details"),
                    origin: "metadataHandler",
                    guid: id,
                    doOnOpen: function () {
                        node.addClass("selected-row");
                    },
                    doOnHide: function () {
                        if (metadataPopup.isOpen(null, "any")) {
                            metadataPopup.close();
                        }
                        node.removeClass("selected-row");
                    }
                });

                //only wms layers have this value
                if (layerConfig.layerInfo) {
                    if (layerConfig.legend) {
                        var wmsmeta;

                        tmpl.cache = {};
                        tmpl.templates = JSON.parse(TmplHelper.stringifyTemplate(filter_wms_meta_Template));

                        wmsmeta = tmpl("wms_meta_main",
                            {
                                legendUrl: layerConfig.legend.imageUrl,
                                getCapabilitiesUrl: layerConfig.url + "&request=GetCapabilities",
                                serviceEndPointUrl: layerConfig.url
                            }
                        );

                        topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                            content: $(wmsmeta),
                            origin: "metadataHandler",
                            update: true,
                            guid: id
                        });
                    } else {
                        topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                            content: "<p>" + i18n.t('filterManager.metadataNotFound') + "</p><b>Service End Point URL</b><br><a href='" + layerConfig.url + "' tagget='_blank'>" + layerConfig.url + "</a>",
                            origin: "metadataHandler",
                            update: true,
                            guid: id
                        });
                    }
                } else {
                    //for feature layer
                    // metadataUrl =String.format("http://intranet.ecdmp-dev.cmc.ec.gc.ca/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&outputSchema=csw:IsoRecord&id={0}", guid);
                    var metadataError = function () {
                        topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                            content: "<p>" + i18n.t('filterManager.metadataNotFound') + "</p><h5>" + i18n.t('filterManager.serviceEndPointLabel') + "</h5><p><a href='" + layerConfig.url + "' tagget='_blank'>" + layerConfig.url + "</a></p>",
                            origin: "metadataHandler",
                            update: true,
                            guid: id
                        });
                    };

                    metadataUrl = layerConfig.metadataUrl;

                    // set it to null when layerConfig.catalogueUrl does not exist
                    // instead of key with empty value
                    var params = null;
                    if (layerConfig.catalogueUrl) {
                        params = [{ key: "catalogue_url", value: layerConfig.catalogueUrl }];
                    }

                    if (!metadataUrl) {
                        metadataError();
                    } else {
                        UtilMisc.transformXML(metadataUrl, "assets/metadata/xstyle_default_" + RAMP.locale + ".xsl",
                            function (error, data) {
                                if (error) {
                                    metadataError();
                                } else {
                                    topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                                        content: $(data).append("<h5>" + i18n.t('filterManager.serviceEndPointLabel') + "</h5><p><a href='" + layerConfig.url + "' tagget='_blank'>" + layerConfig.url + "</a></p>"),
                                        origin: "metadataHandler",
                                        update: true,
                                        guid: id
                                    });
                                }
                            }, null, params);
                    }
                }
            } else {
                topic.publish(EventManager.GUI.SUBPANEL_CLOSE, { origin: "metadataHandler" });
            }
        }
        
        return {
            init: function () {
                setupPopup();
            }
        };
    });
