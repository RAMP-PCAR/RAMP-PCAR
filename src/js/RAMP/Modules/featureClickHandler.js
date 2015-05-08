/* global define, i18n, $, RAMP */

/**
*
*
* @module RAMP
* @submodule Map
*/

/**
* Feature click handler class.
*
* The featureClickHandler uses Dojo/Topic to publish centralized global mouse event messages
* related to feature selection. Any function subscribes to the topic will be able handle the
* specific event.
*
* ####Imports RAMP Modules:
* {{#crossLink "GraphicExtension"}}{{/crossLink}}
* {{#crossLink "EventManager"}}{{/crossLink}}
* {{#crossLink "Util"}}{{/crossLink}}
*
* @class FeatureClickHandler
* @static
* @uses dojo/topic
* @uses dojo/dom-construct
*/

define([
/* RAMP */
    'ramp/graphicExtension', 'ramp/eventManager',

/* Dojo */
    'dojo/topic', 'dojo/dom-construct',

/* Utils */
    'utils/util'],

    function (
    /* RAMP */
    GraphicExtension, EventManager,

    /* Dojo */
    topic, domConstruct,

    /* Utils */
    UtilMisc) {
        'use strict';
        return {
            /**
            * This function is called whenever the feature on the map is clicked/selected by the user.
            * Publish the "Gui/subPanelOpen" message to indicate a feature has been selected. Panel content
            * and Panel event handler information is passed in as the additional object for the event handler.
            *
            * @method onFeatureSelect
            * @param  {Object} evt
            * @param  {Object} evt.graphic ESRI graphic object
            */
            onFeatureSelect: function (evt) {
                var selectedGraphic = evt.graphic,
                    fData = GraphicExtension.getFDataForGraphic(selectedGraphic);
               
                if (fData) {
                    topic.publish(EventManager.GUI.SUBPANEL_OPEN, {
                        panelName: i18n.t('datagrid.details'),
                        title: GraphicExtension.getFDataTitle(fData),
                        content: GraphicExtension.getFDataTextContent(fData),
                        target: $('#map-div'),
                        origin: 'rampPopup',
                        consumeOrigin: 'datagrid',
                        guid: UtilMisc.guid(),
                        showChars: 70,
                        doOnOpen: function () {
                            //topic.publish(EventManager.Datagrid.HIGHLIGHTROW_SHOW, {
                            //    graphic: selectedGraphic
                            //});

                            UtilMisc.subscribeOnce(EventManager.Maptips.EXTENT_CHANGE, function (evt) {
                                var scroll = evt.scroll;
                                topic.publish(EventManager.Datagrid.HIGHLIGHTROW_SHOW, {
                                    fData: fData,
                                    scroll: scroll
                                });
                            });

                            // Note: the following will in turn trigger maptip/showInteractive
                            RAMP.state.hilite.click.objId = GraphicExtension.getFDataOid(fData);
                            RAMP.state.hilite.click.layerId = fData.parent.layerId;
                            topic.publish(EventManager.FeatureHighlighter.HIGHLIGHT_SHOW, {
                                graphic: selectedGraphic
                            });
                        },
                        doOnHide: function () {
                            topic.publish(EventManager.Datagrid.HIGHLIGHTROW_HIDE);
                        },
                        doOnDestroy: function () {
                            selectedGraphic = null;

                            //topic.publish(EventManager.FeatureHighlighter.HIGHLIGHT_HIDE);
                        }
                    });
                } 
                //if there is no fData, the attribute data has not downloaded yet.  given that we have a warning on a hover, the user will see that message
                //before they can initiate a click. by not supporting a separate message on no-attrib click, we avoid having to worry about missing datagrid rows
                //(there will be no rows until the attribs have downloaded), nor worry about detail panels (that have no data).
                //so, we do nothing. hurrah!
            },

            /**
            * This function is called whenever the "Details" button is deselected (either by the user click on
            * another "Details" button, clicking on another point, or by clicking on an already highlighted
            * "Details" button, or clicking somewhere on the map where is no features present).
            *
            * @method onFeatureDeselect
            */
            onFeatureDeselect: function () {
                topic.publish(EventManager.GUI.SUBPANEL_CLOSE, {
                    origin: 'rampPopup,datagrid'
                });
            },

            /**
            * This function is called whenever the user hovers over a feature on the map when another feature already has been selected.
            *
            * @method onFeatureMouseOver
            * @param {Object} evt [description]
            * @param {Object} evt.graphic ESRI graphic object that is being hovered over
            */
            onFeatureMouseOver: function (evt) {
                topic.publish(EventManager.Maptips.SHOW, evt);
                topic.publish(EventManager.FeatureHighlighter.HOVERLIGHT_SHOW, evt);
            },

            /**
            * This function is called whenever the user moves the mouse away from a feature being hovered over.
            *
            * @method onFeatureMouseOut
            * @param {Object} evt [description]
            * @param {Object} evt.graphic ESRI graphic object that is moved away from
            */
            onFeatureMouseOut: function (evt) {
                //topic.publish(EventManager.Maptips.HIDE, {});
                topic.publish(EventManager.FeatureHighlighter.HOVERLIGHT_HIDE, evt);
            }
        };
    });