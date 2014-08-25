/*global define, TimelineLite */

/**
*
*
* @module RAMP
* @submodule Theme
*
*/

/**
*
*
* @class FEGC-Theme
* @uses Util
* @uses dojo/_base/lang
* @uses Theme
*/

define(["utils/util", "dojo/_base/lang", "defaultTheme/theme"],
    function (util, dojoLang, defaultTheme) {
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

        /**
         * Toggles full screen mode
         *
         * @method _toggleFullScreenMode
         * @param  {Boolean} fullscreen true - full screen on; false - full screen off; undefined - toggle;
         */
        function _toggleFullScreenMode(fullscreen) {
            var extraTweeen = new TimelineLite({ paused: true });

            isFullScreen = util.isUndefined(fullscreen) ? !isFullScreen : fullscreen;

            if (isFullScreen) {
                fullScreenTimeLine.play();

                extraTweeen
                    .to(".sub-panel-container.summary-data-details", transitionDuration, { top: "86px", bottom: "10px", ease: "easeOutCirc" }, 0)
                    .to(".sub-panel-container.full-data-details", transitionDuration, { top: "55px", bottom: "10px", ease: "easeOutCirc" }, 0)

                    .to(".full-data-mode .dataTables_scrollBody", transitionDuration, { height: "+=160px", ease: "easeOutCirc" }, 0.01); // animate height of the datatable scrollBody since it's explicitly set
            } else {
                fullScreenTimeLine.reverse();

                extraTweeen
                    .to(".sub-panel-container.summary-data-details", transitionDuration, { top: "226px", bottom: "0px", ease: "easeInCirc" }, 0)
                    .to(".sub-panel-container.full-data-details", transitionDuration, { top: "195px", bottom: "0px", ease: "easeInCirc" }, 0)

                    .to(".full-data-mode .dataTables_scrollBody", transitionDuration - 0.01, { height: "-=160px", ease: "easeInCirc" }, 0); // animate height of the datatable scrollBody since it's explicitly set
            }

            extraTweeen.play();
        }

        return dojoLang.mixin(defaultTheme,
            {
                /**
                 * Allows to set callbacks to the full screen transition.
                 *
                 * @method fullScreenCallback
                 * @param  {String} event Event name to set a callback on
                 * @param  {Function} func  A callback function
                 * @return {Object}     This
                 * @chainable
                 */
                fullScreenCallback: function (event, func) {
                    fullScreenTimeLine.eventCallback(event, func);

                    return this;
                },

                /**
                 * Returns a boolean indication whether the full screen mode is on.
                 *
                 * @method isFullScreen
                 * @return {Boolean} true / false
                 */
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
            }
        );
    });