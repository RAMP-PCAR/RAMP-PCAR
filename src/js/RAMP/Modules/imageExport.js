﻿/* global define, console, RAMP, $ */

/**
*
*
* @module RAMP
* @submodule Map
*/

/**
* Image Export class.
*
* Handles the generation of an image file from the map (and possibly other extra elements)
*
* @class ImageExport
* @static
* @uses dojo/topic
* @uses dojo/_base/array
* @uses esri/tasks/PrintTemplate
* @uses esri/tasks/PrintParameters
* @uses esri/tasks/PrintTask
* @uses EventManager
* @uses GlobalStorage
* @uses Map
* @uses Ramp
* @uses Util
*/

define([
/* Dojo */
"dojo/topic", "dojo/_base/array",

/* ESRI */
"esri/tasks/PrintTemplate", "esri/tasks/PrintParameters", "esri/tasks/PrintTask",

/* RAMP */
"ramp/eventManager", "ramp/map"],

    function (
    /* Dojo */
    topic, dojoArray,

    /* ESRI */
    PrintTemplate, PrintParameters, PrintTask,

    /* RAMP */
    EventManager, RampMap) {
        "use strict";

        /**
        * Will initiate a request for an image of all service-based layers.
        *
        * @method submitServiceImageRequest
        * @private
        */
        function submitServiceImageRequest() {
            var mappy, printTask, params, template, mapDom;

            mappy = RampMap.getMap();
            printTask = new PrintTask(RAMP.config.exportMapUrl);

            printTask.on('complete', function (evt) {
                console.log('PRINT RESULT: ' + evt.result.url);
            });

            printTask.on('error', function (evt) {
                console.log('PRINT FAILED: ' + evt.error.message);
            });

            mapDom = $('#mainMap_root')[0];

            template = new PrintTemplate();
            template.exportOptions = {
                width: mapDom.style.width,
                height: mapDom.style.height,
                dpi: 96
            };
            template.format = "JPG";
            template.layout = "MAP_ONLY";
            template.showAttribution = false;

            params = new PrintParameters();
            params.map = mappy;
            params.template = template;
            printTask.execute(params);
        }

        return {
            /**
            * Initializes properties.  Set up event listeners
            *
            * @method init
            */
            submitServiceImageRequest: submitServiceImageRequest
        };
    });