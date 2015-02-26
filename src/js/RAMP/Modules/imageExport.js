/* global define, console, RAMP, $ */

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

        var ui = (function () {
            var mapExportToggle,
                mapExportStretcher,
                mapExportImg;


            return {
                init: function () {
                    mapExportToggle = $("#map-export-toggle");
                    mapExportStretcher = $(".map-export-stretcher");
                    mapExportImg = $(".map-export-image > img");

                    // get the export image url
                    mapExportToggle.on('click', function () {
                        var promise = ImageExport.submitServiceImageRequest();
                        //imageSize = ImageExport.submitServiceImageRequest();

                        promise.then(
                            function (event) {
                                console.log(event);
                            },
                            function (error) {
                                console.log(error);
                            }
                        );

                        mapExportImg.hide();

                        console.log(mapExportStretcher);

                        //imageSize.width = imageSize.width * 0.8 + 30; 
                        //imageSize.height = imageSize.height * 0.8;
                        //mapExportStretcher.css(imageSize);
                    });

                    topic.subscribe(EventManager.GUI.ESRI_IMAGE_READY, function (evt) {
                        //for now, just console.
                        if (evt.error) {
                            console.log("Image request failed");
                            console.log(evt.imageUrl);
                        } else {
                            console.log("Here is your image URL, sir");
                            console.log(evt.imageUrl);

                            mapExportImg.show().attr("src", evt.imageUrl);
                        }
                    });
                }
            }
        }());

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
                //console.log('PRINT RESULT: ' + evt.result.url);
                topic.publish(EventManager.GUI.ESRI_IMAGE_READY, { error: false, imageUrl: evt.result.url });
            });

            printTask.on('error', function (evt) {
                //console.log('PRINT FAILED: ' + evt.error.message);
                topic.publish(EventManager.GUI.ESRI_IMAGE_READY, { error: true, imageUrl: evt.error.message });
            });

            mapDom = $('#mainMap_root')[0];

            template = new PrintTemplate();
            template.exportOptions = {
                width: mapDom.clientWidth,
                height: mapDom.clientHeight,
                dpi: 96
            };
            template.format = "JPG";
            template.layout = "MAP_ONLY";
            template.showAttribution = false;

            params = new PrintParameters();
            params.map = mappy;
            params.template = template;
            console.log("submitting print job.  please wait");
            printTask.execute(params);
        }

        return {
            
            submitServiceImageRequest: submitServiceImageRequest,


            /**
            * Initializes UI triggers.
            *
            * @method init
            */
            init: ui.init
        };
    });