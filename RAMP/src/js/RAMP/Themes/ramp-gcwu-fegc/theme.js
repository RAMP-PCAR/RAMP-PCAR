/*global define, TimelineLite */

/**
*
*
* @module RAMP
*
*/

/**
* GlobalStorage class is used to store variables and exchange them between different modules. Each module has the ability to add variables to the global storage and retrieve them as needed.
*
* @class GlobalStorage
*/

define(["utils/util", ],
    function (util) {
        "use strict";

        var body = $("body"),
            wbHeadIn = $("#wb-head-in"),
            wbCore = $("#wb-core"),
            wbFoot = $("#wb-foot"),

            megaMenuDiv = $("#gcwu-psnb-in"),
            titleLink = $("#gcwu-title-in a"),

            transitionDuration = 0.5,

            isFullScreen = false,
            fullScreenTimeLine = new TimelineLite(
                {
                    paused: true
                });

        fullScreenTimeLine
            .set(wbHeadIn, { position: "relative" })
            .set(titleLink, { overflow: "hidden" })

            .to(wbHeadIn, transitionDuration, { top: "-70px", height: "124px" }, 0)
            .to(titleLink, transitionDuration, { height: "35px" }, 0)

            .set(megaMenuDiv, { display: "none" })

            .to(wbCore, transitionDuration, { top: "55px", bottom: "10px", ease: "easeOutCirc" }, 0)
            .to(wbFoot, transitionDuration, { height: 10, ease: "easeOutCirc" }, 0)

            .set(body, { className: "+=full-screen" });

        function _toggleFullScreenMode(fullscreen) {
            var extraTweeen = new TimelineLite({ paused: true });

            isFullScreen = util.isUndefined(fullscreen) ? !isFullScreen : fullscreen;

            if (isFullScreen) {
                fullScreenTimeLine.play();

                extraTweeen
                    .to(".sub-panel-container.summary-data-details", transitionDuration, { top: "87px", bottom: "10px", ease: "easeOutCirc" }, 0)
                    .to(".sub-panel-container.full-data-details", transitionDuration, { top: "55px", bottom: "10px", ease: "easeOutCirc" }, 0)

                    .to(".full-data-mode .dataTables_scrollBody", transitionDuration, { height: "+=160px", ease: "easeOutCirc" }, 0.01); // animate height of the datatable scrollBody since it's explicitly set
            } else {
                fullScreenTimeLine.reverse();

                extraTweeen
                    .to(".sub-panel-container.summary-data-details", transitionDuration, { top: "227px", bottom: "0px", ease: "easeInCirc" }, 0)
                    .to(".sub-panel-container.full-data-details", transitionDuration, { top: "195px", bottom: "0px", ease: "easeInCirc" }, 0)

                    .to(".full-data-mode .dataTables_scrollBody", transitionDuration - 0.01, { height: "-=160px", ease: "easeInCirc" }, 0); // animate height of the datatable scrollBody since it's explicitly set
            }

            extraTweeen.play();
        }

        return {
            fullScreenCallback: function (event, func) {
                fullScreenTimeLine.eventCallback(event, func);

                return this;
            },

            isFullScreen: function () {
                return isFullScreen;
            },

            /**
            * Toggles the FullScreen mode of the application
            *
            * @method toggleFullScreenMode
            * @private
            * @param  {boolean} fullscreen true - expand; false - collapse; undefined - toggle;
            */
            toggleFullScreenMode: function (fullscreen) {
                _toggleFullScreenMode(fullscreen);

                return this;
            }
        };
    });