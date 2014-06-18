/*global define, TimelineLite */

//the "use strict" forces the ECMA Script 5 interpretation of the code

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
            wbCore = $("#wb-core"),
            wbFoot = $("#wb-foot"),

            titleBanner = $("#gcwu-bnr"),
            megaMenuDiv = $("#gcwu-psnb-in"),
            navigation = $("nav[role='navigation']:first"),

            transitionDuration = 0.5,

            isFullScreen = false,
            fullScreenTimeLine = new TimelineLite(
                {
                    paused: true
                });

        fullScreenTimeLine
                .to(titleBanner, transitionDuration, { height: 54, ease: "easeOutCirc" }, 0)
                .to(navigation, transitionDuration, { height: 0, ease: "easeOutCirc" }, 0)
                .set([navigation, megaMenuDiv], { display: "none" })

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
                    .to(".full-data-mode .dataTables_scrollBody", transitionDuration, { height: "+=179px", ease: "easeOutCirc" }, 0.01);
            } else {
                fullScreenTimeLine.reverse();

                extraTweeen
                    .to(".sub-panel-container.summary-data-details", transitionDuration, { top: "247px", bottom: "0px", ease: "easeInCirc" }, 0)
                    .to(".sub-panel-container.full-data-details", transitionDuration, { top: "215px", bottom: "0px", ease: "easeInCirc" }, 0)
                    .to(".full-data-mode .dataTables_scrollBody", transitionDuration - 0.01, { height: "-=179px", ease: "easeInCirc" }, 0);
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