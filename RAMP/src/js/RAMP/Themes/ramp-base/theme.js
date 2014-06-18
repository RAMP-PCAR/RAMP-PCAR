/*global define, TimelineLite, TweenLite */

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
            isFullScreen = util.isUndefined(fullscreen) ? !isFullScreen : fullscreen;

            if (isFullScreen) {
                fullScreenTimeLine.play();

                TweenLite.to(".sub-panel-container", transitionDuration, { top: "87px", bottom: "10px", ease: "easeOutCirc" });
            } else {
                fullScreenTimeLine.reverse();

                TweenLite.to(".sub-panel-container", transitionDuration, { top: "76px", bottom: "0px", ease: "easeOutCirc" });
            }
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