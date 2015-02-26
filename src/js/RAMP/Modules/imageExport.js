/* global define, console, RAMP, $, TimelineLite, window */

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
                downloadButton,

                jWindow,
                transitionDuration = 0.4;

            return {
                init: function () {
                    var promise;

                    jWindow = $(window);

                    mapExportToggle = $("#map-export-toggle");
                    mapExportStretcher = $(".map-export-stretcher");
                    mapExportImg = $(".map-export-image > img");
                    mapExportSpinner = mapExportStretcher.find(".sk-spinner");
                    downloadButton = $(".map-export-controls .download-buttons > .btn");

                    // get the export image url
                    mapExportToggle.on('click', function () {
                        var tl = new TimelineLite(),
                            result = submitServiceImageRequest(),
                            imageSize = result.exportOptions,
                            stretcherWidth = jWindow.width() - 350,
                            stretcherHeight = imageSize.height / imageSize.width * stretcherWidth;

                        tl
                                .set(mapExportSpinner, { display: "inline-block" })
                                .set(mapExportImg, { display: "none" })
                                .call(function () { mapExportImg.attr("src", ""); })
                                .set(mapExportStretcher, { clearProps: "all" })
                        ;

                        downloadButton
                            .attr({
                                disabled: true,
                                href: ""
                            })
                        ;

                        if (promise) {
                            promise.cancel();
                        }
                        promise = result.promise;

                        promise.then(
                            function (event) {
                                downloadButton
                                    .attr({
                                        disabled: false,
                                        href: event.result.url
                                    }
                                );

                                tl
                                    .set(mapExportSpinner, { display: "none" })
                                    .set(mapExportImg, { display: "block" })
                                    .call(function () { mapExportImg.attr("src", event.result.url); })
                                    .to(mapExportStretcher, transitionDuration, { height: stretcherHeight, width: stretcherWidth, ease: "easeOutCirc" })
                                ;

                                console.log(event);
                            },
                            function (error) {
                                console.log(error);
                            }
                        );
                    });
                }
            };
        }());

        /**
        * Will initiate a request for an image of all service-based layers.
        *
        * @method submitServiceImageRequest
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