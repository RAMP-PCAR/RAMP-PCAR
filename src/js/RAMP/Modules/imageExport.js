/* global define, console, RAMP, $, TimelineLite, window */

/**
*
*
* @module RAMP
* @submodule Map
*/

/**
* Handles the generation of an image file from the map (and possibly other extra elements)
*
* ####Imports RAMP Modules:
* {{#crossLink "EventManager"}}{{/crossLink}}  
* {{#crossLink "Map"}}{{/crossLink}}
* 
* @class ImageExport
* @static
* @uses dojo/topic
* @uses dojo/_base/array
* @uses esri/tasks/PrintTemplate
* @uses esri/tasks/PrintParameters
* @uses esri/tasks/PrintTask
*/

define([
/* Dojo */
"dojo/topic", "dojo/_base/array", "dojo/Deferred",

/* ESRI */
"esri/tasks/PrintTemplate", "esri/tasks/PrintParameters", "esri/tasks/PrintTask",

/* RAMP */
"ramp/eventManager", "ramp/map"],

    function (
    /* Dojo */
    topic, dojoArray, Deferred,

    /* ESRI */
    PrintTemplate, PrintParameters, PrintTask,

    /* RAMP */
    EventManager, RampMap) {
        "use strict";

        var ui = (function () {
            var mapExportToggle,
                mapExportStretcher,
                mapExportImg,
                mapExportSpinner,
                mapExportNotice,
                downloadButton,

                promise,

                jWindow,
                transitionDuration = 0.4;

            /**
             * Handles click event on the export image toggle.
             * 
             * @private
             * @method ui.generateExportIamge
             */
            function generateExportImage() {
                // get the export image url
                var tl = new TimelineLite(),
                    result = submitServiceImageRequest(),
                    imageSize = result.exportOptions,
                    stretcherWidth = Math.min(jWindow.width() - 350, imageSize.width),
                    stretcherHeight = Math.ceil(imageSize.height / imageSize.width * stretcherWidth);
                
                tl
                    .call(function () { downloadButton.attr({ disabled: true, href: "" }); }) // disabled download button
                    .set(mapExportNotice, { display: "none" }) // hide error notice
                    .set(mapExportSpinner, { display: "inline-block" }) // show loading animation
                    .set(mapExportImg, { display: "none" }) // hide image
                    .call(function () { mapExportImg.attr("src", ""); })
                    .set(mapExportStretcher, { clearProps: "all" })
                ;

                if (promise) {
                    promise.cancel();
                }
                promise = result.promise;

                promise.then(
                    function (event) {
                        tl
                            .call(function () { downloadButton.attr({ disabled: false, href: event.result.url }); }) // enabled download button
                            .set(mapExportSpinner, { display: "none" }) // hide loading animation
                            .set(mapExportImg, { display: "block" }) // show image
                            .call(function () { mapExportImg.attr("src", event.result.url); })
                            .to(mapExportStretcher, transitionDuration, { height: stretcherHeight + 2, width: stretcherWidth + 2, ease: "easeOutCirc" }) // animate popup; 2 needed to account for the border
                        ;

                        console.log(event);
                    },
                    function (error) {
                        // show error notice
                        tl
                            .set(mapExportSpinner, { display: "none" })
                            .set(mapExportNotice, { display: "inline-block", width: mapExportStretcher.width() })
                        ;

                        console.log(error);
                    }
                );
            }

            return {
                /**
                 * Initializes ui and listeners.
                 * 
                 * @private
                 * @method ui.init
                 */
                init: function () {
                    jWindow = $(window);

                    mapExportToggle = $("#map-export-toggle");
                    mapExportStretcher = $(".map-export-stretcher");
                    mapExportImg = $(".map-export-image > img");
                    mapExportSpinner = mapExportStretcher.find(".sk-spinner");
                    mapExportNotice = mapExportStretcher.find(".map-export-notice");
                    downloadButton = $(".map-export-controls .download-buttons > .btn");

                    mapExportToggle
                        .attr("disabled", false)
                        .on('click', generateExportImage);
                }
            };
        }());

        /**
        * Will initiate a request for an image of all service-based layers.
        *
        * @method submitServiceImageRequest
        * @return {Promise} Returns a promise that is resolved when the image comes down or not.
        * @private
        */
        function submitServiceImageRequest() {
            var mappy, printTask, params, template, mapDom,
                def = new Deferred();

            mappy = RampMap.getMap();
            printTask = new PrintTask(RAMP.config.exportMapUrl);

            printTask.on('complete', function (evt) {
                //console.log('PRINT RESULT: ' + evt.result.url);
                def.resolve(evt);
            });

            printTask.on('error', function (evt) {
                //console.log('PRINT FAILED: ' + evt.error.message);
                def.reject(evt);
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

            return {
                promise: def.promise,
                exportOptions: template.exportOptions
            };
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