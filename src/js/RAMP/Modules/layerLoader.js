/* global define, console */

/**
*
*
* @module RAMP
* @submodule Map
*/

/**
* Layer Loader class.
*
* Handles the asynchronous loading of map layers (excluding basemaps)
* This includes dealing with errors, and raising appropriate events when the layer loads
*
* @class LayerLoader
* @static
* @uses EventManager
* @uses Map
* @uses GlobalStorage
* @uses FeatureClickHandler
* @uses dojo/topic
*/

define([
/* RAMP */
    "ramp/eventManager", "ramp/map", "ramp/globalStorage", "ramp/featureClickHandler",

/* Dojo */
    "dojo/topic"],

    function (
    /* RAMP */
    EventManager, RampMap, GlobalStorage, FeatureClickHandler,

    /* Dojo */
    topic) {
        "use strict";
        return {
            //TODO REMOVE THIS HOGWASH
            lintRemoveMe: function () {
                //stupid function to satisfy lint
                topic.publish(EventManager.Datagrid.HIGHLIGHTROW_HIDE);
            },

            /**
            * Deals with a layer that had an error when it tried to load.
            *
            * @method onLayerError
            * @param  {Object} evt
            * @param  {Object} evt.target the layer object that failed
            * @param  {Object} evt.error the error object
            */
            onLayerError: function (evt) {
                console.log("failed to load layer " + evt.target.url);
                console.log(evt.error.message);

                //figure out which layer selector state object matches this layer object

                //set layer selector state to error

                //remove layer object from Map's layer collection?
                //   if bounding box was added, remove that layer too?

                //possibly update ramp.error tag?
            },

            /**
            * Reacts when a layer has loaded successfully.
            *
            * @method onLayerLoaded
            * @param  {Object} evt
            * @param  {Object} evt.target the layer object that loaded
            */
            onLayerLoaded: function (evt) {
                var layer = evt.target;

                console.log("layer loaded: " + layer.url);

                //TODO
                //figure out which layer selector state object matches this layer object

                //TODO
                //check if this layer is in an error state.  if so, exit the handler

                //TODO
                //set layer selector state to loaded (and possibly do other alex magic)

                //call map functions to wire up event handlers (see map._initEventHandlers )
                switch (layer.ramp.type) {
                    case GlobalStorage.layerType.wms:
                        console.log("hoss");
                        break;
                    case GlobalStorage.layerType.feature:

                        //TODO consider the case where a layer was loaded by the user, and we want to disable things like maptips?

                        //wire up click handler
                        layer.on("click", function (evt) {
                            evt.stopImmediatePropagation();
                            FeatureClickHandler.onFeatureSelect(evt);
                        });

                        //wire up mouse over / mouse out handler
                        layer.on("mouse-over", function (evt) {
                            FeatureClickHandler.onFeatureMouseOver(evt);
                        });

                        layer.on("mouse-out", function (evt) {
                            FeatureClickHandler.onFeatureMouseOut(evt);
                        });

                        break;
                }

                //raise event to indicate the layer is loaded, so that things like datagrid will refresh itself

                topic.publish(EventManager.Map.LAYER_LOADED, { layer: evt.target });
            },

            /**
            * This function initiates the loading process for an ESRI layer object.
            *
            * @method loadLayer
            * @param  {Object} layer an instantiated, unloaded ESRI layer object
            */
            loadLayer: function (layer) {
                if (layer.ramp) {
                    console.log(layer.ramp.type);
                } else {
                    console.log('you failed to supply a ramp.type to the layer!');
                }

                //TODO possibly have an optional param for position to add
                // position = typeof position !== 'undefined' ? position : 0; //where 0 is "last", may need to modifiy the default value

                //add config node to layer??
                //   might be a good idea.  will ensure layers added by user also have this, and thus the code to do this wont be scattered in 3-4 different spots
                //   dont do it for now.  possible future enhancement

                //add error handler for layer
                layer.on('error', this.onLayerError);

                //add loaded handler for layer
                layer.on('update-end', this.onLayerLoaded);

                //TODO
                //add entry to alex selector, defaulting to loading state

                //add layer to map, triggering the loading process.  should add at correct position
                RampMap.getMap().addLayer(layer);
            }
        };
    });