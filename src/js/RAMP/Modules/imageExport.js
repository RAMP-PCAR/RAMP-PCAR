/* global define, console, RAMP, $, TimelineLite, window, saveAs */

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
"dojo/topic", "dojo/Deferred",

/* ESRI */
"esri/tasks/PrintTemplate", "esri/tasks/PrintParameters", "esri/tasks/PrintTask",// 'esri/request',

/* RAMP */
    "ramp/eventManager", "ramp/map",

    /* UTIL */

    "utils/util", "utils/popupManager"
],

    function (
    /* Dojo */
    topic, Deferred,

    /* ESRI */
    PrintTemplate, PrintParameters, PrintTask,// EsriRequest,

    /* RAMP */
        EventManager, RampMap,

        /* UTIL */
        MiscUtil, PopupManager
        ) {
        "use strict";

        var ui = (function () {
            var mapExportToggle,
                mapExportStretcher,
                mapExportImg,
                mapExportSpinner,
                mapExportNotice,
                downloadButton,

                mapExportCloseButton,
                
                downloadDropdownToggle,
                downloadDropdown,

                downloadDropdownMenu,

                downloadDefault,
                downloadButtonJPG,
                downloadButtonPNG,

                downloadPopup,

                promise,

                canvas,

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
                        console.log('--->', event);

                        /*var p = (new EsriRequest({ url: event.result.url, handleAs: 'text' })).promise;

                        p.then(function (data) {
                            console.log(data);

                        });*/

                        // wait for the image to fully load
                        mapExportImg.on("load", function (event) {
                            // convert image to canvas for saving
                            canvas = MiscUtil.convertImageToCanvas(event.target);//,
                            //dataPNG = "",
                            //dataJPG = "";

                            //console.log(canvas);

                            // convert image to png and jpeg dataurls
                            //dataJPG = MiscUtil.convertCanvasToDataURL(canvas, "image/jpeg");
                            //dataPNG = MiscUtil.convertCanvasToDataURL(canvas, "image/png");

                            // enable download buttons
                            downloadDropdown
                                .find(".btn")
                                .attr({ disabled: false })
                            ;

                            /*
                            downloadButtonJPG.attr({ disabled: false, href: dataJPG });
                            downloadButtonPNG.attr({ disabled: false, href: dataPNG });
                            downloadDefault.attr({ disabled: false, href: dataPNG });*/

                            mapExportImg.off("load");
                        });

                        tl
                            .call(function () { downloadDefault.attr({ href: event.result.url }); }) // set default button url to image url - for IE9 sake
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
                    mapExportSpinner = mapExportStretcher.find(".loading-simple");
                    mapExportNotice = mapExportStretcher.find(".map-export-notice");
                    downloadButton = $(".map-export-controls .download-buttons > .btn");

                    downloadDropdown = $(".map-export-controls .download-buttons .download-dropdown");
                    downloadDropdownMenu = $(".map-export-controls .download-buttons .dropdown-menu");

                    downloadDropdownToggle = downloadDropdown.find(".toggle");
                    downloadButtonPNG = downloadDropdown.find(".btn.download-png");
                    downloadButtonJPG = downloadDropdown.find(".btn.download-jpg");
                    downloadDefault = downloadDropdown.find(".btn.download-default");
                    
                    mapExportCloseButton = $("#map-export-modal .button-close");

                    mapExportToggle
                        .removeClass('disabled')
                        .attr('aria-disabled', false)
                        .on('click', generateExportImage);

                    // disable for IE9 and IE10
                    // IE10 does not support CORS for canvases: http://stackoverflow.com/questions/18112047/canvas-todataurl-working-in-all-browsers-except-ie10; http://stackoverflow.com/questions/16956295/ie10-and-cross-origin-resource-sharing-cors-issues-with-image-canvas
                    if (RAMP.flags.brokenWebBrowser || RAMP.flags.ie10client) {
                        console.warn('You have IE9');
                        downloadDropdown.css('width', '100%');
                        downloadDefault.css('width', '100%'); // make the default download button wider

                        downloadDropdownToggle.css('display', 'none');
                    } else {
                        // 
                        downloadDropdown
                            .find('a.btn')
                            .on('click', function (event) {
                                var target = $(event.target),
                                    type = target.hasClass('download-jpg') ? 'jpeg' : 'png';

                                event.preventDefault();
                                console.log("----Download button clicked");

                                // save using FileSave
                                canvas.toBlob(function (blob) {
                                    saveAs(blob, 'download.' + type);
                                }, 'image/' + type);

                            })
                        ;
                    }

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
        }()),
             //this is a variable declaration, hiding after a very long ui variable
             visState = { empty: true, layers: [] };

        /**
        * Find any visible file-based user-added layers.  Set them to invisible. Store the change.
        *
        * @method hideFileLayers
        * @private
        */
        function hideFileLayers() {
            //safety check.  if state is not empty, we may still have a previous call running, so dont mess with layers a second time
            if (visState.empty) {
                visState.empty = false;

                //go through feature layer config
                RAMP.config.layers.feature.forEach(function (fl) {
                    var flObj = RAMP.layerRegistry[fl.id];

                    //find if feature layer, user added, visible, and has no URL
                    if (flObj.ramp.user && flObj.visible && !(flObj.url)) {
                        //turn off visibility.  remember the layer
                        flObj.setVisibility(false);
                        visState.layers.push(flObj);
                    }
                });
            }
        }

        /**
        * Restore visibility to any layers that were temporarily turned off.
        *
        * @method restoreFileLayers
        * @private
        */
        function restoreFileLayers() {
            if (!visState.empty) {
                //go through feature layer config
                visState.layers.forEach(function (flObj) {
                    flObj.setVisibility(true);
                });

                visState.empty = true;
                visState.layers = [];
            }
        }

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
                //turn off any user-added file based layers, as they will kill the print service
                hideFileLayers();
                printTask = new PrintTask(RAMP.config.exportMapUrl);

                printTask.on('complete', function (event) {
                    //console.log('PRINT RESULT: ' + event.result.url);
                    //turn hidden layers back on
                    restoreFileLayers();
                    def.resolve(event);
                });

                printTask.on('error', function (event) {
                    //console.log('PRINT FAILED: ' + event.error.message);
                    //turn hidden layers back on
                    restoreFileLayers();
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