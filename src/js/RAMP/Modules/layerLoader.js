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
* @uses dojo/topic
*/

define([
/* RAMP */
    "ramp/eventManager", "ramp/map",

/* Dojo */
    "dojo/topic"],

    function (
    /* RAMP */
    EventManager, RampMap,

    /* Dojo */
    topic) {
        "use strict";
        return {
            //TODO REMOVE THIS HOGWASH
            lintRemoveMe: function () {
                //stupid function to satisfy lint
                topic.publish(EventManager.Datagrid.HIGHLIGHTROW_HIDE);

                RampMap.createGraphic({
                    name: "ugly"
                });
            },

            /**
            * This function initiates the loading process for an ESRI layer object.
            *
            * @method loadLayer
            * @param  {Object} layer an instantiated, unloaded ESRI layer object
            */
            loadLayer: function (layer) {
                //test layer type
                console.log(typeof layer);

                //TODO possibly have an optional param for position to add
                // position = typeof position !== 'undefined' ? position : 0; //where 0 is "last", may need to modifiy the default value

                //assign layer ramp.type tag

                //add config node to layer??
                //   might be a good idea.  will ensure layers added by user also have this, and thus the code to do this wont be scattered in 3-4 different spots

                //add error handler for layer
                // consider using ramp.error tag to track error?

                //add loaded handler for layer

                //add entry to alex selector, defaulting to loading state

                //add layer to map, triggering the loading process.  should add at correct position
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
                console.log("failed to load layer " + evt.target.url);
                console.log(evt.error.message);

                //figure out which layer selector state object matches this layer object

                //check if this layer is in an error state.  if so, exit the handler

                //set layer selector state to loaded (and possibly do other alex magic)

                //call map functions to wire up event handlers (see map._initEventHandlers )

                //raise event to indicate the layer is loaded, so that things like datagrid will refresh itself
            }
        };
    });