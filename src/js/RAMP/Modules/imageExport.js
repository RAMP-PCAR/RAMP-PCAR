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
"ramp/eventManager", "ramp/map",

/* UTIL */

"utils/util", "utils/popupManager"],

    function (
    /* Dojo */
    topic, dojoArray, Deferred,

    /* ESRI */
    PrintTemplate, PrintParameters, PrintTask,

    /* RAMP */
    EventManager, RampMap,

    /* UTIL */
    MiscUtil, PopupManager) {
        "use strict";

        var ui = (function () {
            var mapExportToggle,
                mapExportStretcher,
                mapExportImg,
                mapExportSpinner,
                mapExportNotice,

                mapExportCloseButton,

                downloadDropdownToggle,
                downloadDropdown,

                downloadDropdownMenu,

                downloadDefault,
                downloadButtonJPG,
                downloadButtonPNG,

                downloadPopup,

                promise,

                jWindow,
                cssButtonPressedClass = "button-pressed",
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

                if (promise) {
                    promise.cancel();
                }
                promise = result.promise;

                tl
                    .call(function () {
                        downloadDropdown
                            .find(".btn")
                            .attr({ disabled: true })
                            .end("a.btn-download")
                            .find(".btn")
                            .attr({ href: "" })
                        ;

                        //downloadButtonPNG.attr({ disabled: true, href: "" });
                        //downloadButtonJPG.attr({ disabled: true, href: "" });
                    })
                    .set(mapExportNotice, { display: "none" }) // hide error notice
                    .set(mapExportSpinner, { display: "inline-block" }) // show loading animation
                    .set(mapExportImg, { display: "none" }) // hide image
                    .call(function () { mapExportImg.attr("src", ""); })
                    .set(mapExportStretcher, { clearProps: "all" })
                ;

                promise.then(
                    function (event) {

                        mapExportImg.on("load", function (event) {
                            var canvas = MiscUtil.convertImageToCanvas(event.target),
                                dataPNG = "",
                                dataJPG = "";

                            console.log(canvas);

                            dataJPG = MiscUtil.convertCanvasToDataURL(canvas, "image/jpeg");
                            dataPNG = MiscUtil.convertCanvasToDataURL(canvas, "image/png");

                            downloadDropdown
                                .find(".btn")
                                .attr({ disabled: false })
                            ;

                            downloadButtonJPG.attr({ disabled: false, href: dataJPG });
                            downloadButtonPNG.attr({ disabled: false, href: dataPNG });
                            downloadDefault.attr({ disabled: false, href: dataPNG });

                            mapExportImg.off("load");
                        });

                        tl
                            //.call(function () { downloadButtonPNG.attr({ disabled: false, href: event.result.url }); }) // enabled download button
                            .set(mapExportSpinner, { display: "none" }) // hide loading animation
                            .set(mapExportImg, { display: "block" }) // show image
                            .call(function () { mapExportImg.attr("src", event.result.url); })
                            // animate popup; 2 needed to account for the border
                            .to(mapExportStretcher, transitionDuration, { height: stretcherHeight + 2, width: stretcherWidth + 2, ease: "easeOutCirc" })
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

                    downloadDropdown = $(".map-export-controls .download-buttons .download-dropdown");
                    downloadDropdownMenu = $(".map-export-controls .download-buttons .dropdown-menu");

                    downloadDropdownToggle = downloadDropdown.find(".toggle");
                    downloadButtonPNG = downloadDropdown.find(".btn.download-png");
                    downloadButtonJPG = downloadDropdown.find(".btn.download-jpg");
                    downloadDefault = downloadDropdown.find(".btn.download-default");

                    mapExportCloseButton = $("#map-export-modal .button-close");

                    mapExportToggle
                        .attr("disabled", false)
                        .on('click', generateExportImage);

                    downloadPopup = PopupManager.registerPopup(downloadDropdownToggle, "click",
                        function (d) {
                            downloadDropdownMenu.show();
                            d.resolve();
                        },
                        {
                            activeClass: cssButtonPressedClass,
                            target: downloadDropdownMenu,
                            closeHandler: function (d) {

                                downloadDropdownMenu.hide();
                                d.resolve();
                            },
                            timeout: 500
                        }
                    );

                    mapExportCloseButton.on("click", function () {
                        downloadDropdown
                            .find(".btn")
                            .attr({ disabled: true, href: "" })
                        ;

                        mapExportImg.attr("src", "");
                    });
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

            try {

                mappy = RampMap.getMap();
                printTask = new PrintTask(RAMP.config.exportMapUrl);

                printTask.on('complete', function (event) {
                    //console.log('PRINT RESULT: ' + event.result.url);
                    def.resolve(event);
                });

                printTask.on('error', function (event) {
                    //console.log('PRINT FAILED: ' + event.error.message);
                    def.reject(event);
                });

                mapDom = $('#mainMap_root')[0];

                template = new PrintTemplate();
                template.exportOptions = {
                    width: mapDom.clientWidth,
                    height: mapDom.clientHeight,
                    dpi: 96
                };
                template.format = "PNG32";
                template.layout = "MAP_ONLY";
                template.showAttribution = false;

                params = new PrintParameters();
                params.map = mappy;
                params.template = template;
                console.log("submitting print job.  please wait");
                printTask.execute(params);

            } catch (event) {
                def.reject(event);
            }

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