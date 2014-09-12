/*global define, TimelineLite, TweenLite, $ */

//the "use strict" forces the ECMA Script 5 interpretation of the code

/**
* This submodule contains theme-specific classes with animation sequences such as Full Screen transition or tooltip setter helper method.
*
* @module RAMP
* @submodule Theme
*
*/

/**
* Base theme for RAMP.
*
* @class Theme
*/

define(["utils/util"],
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

        /**
         * Toggles full screen mode
         *
         * @method _toggleFullScreenMode
         * @param  {Boolean} fullscreen true - full screen on; false - full screen off; undefined - toggle;
         */
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
            * @param  {Boolean} fullscreen true - expand; false - collapse; undefined - toggle;
            * @return {Object} This
            * @chainable
            */
            toggleFullScreenMode: function (fullscreen) {
                _toggleFullScreenMode(fullscreen);

                return this;
            },

            /**
             * Tooltip setter helper method.
             *
             * @method tooltipster
             * @param  {Jquery} target  A node to looked for tooltiped children on
             * @param  {String} type    Type of the tooltips to set
             * @param  {String} [action] Action name: "update" will update all the tooltips on target with their respective title attributes;
             * null will create new tooltips
             * @return {Object}         This
             * @chainable
             */
            tooltipster: function (target, type, action) {
                var attr;
                target = target || $("body");

                switch (type) {
                    case "map":
                        break;

                    default:
                        attr = {
                            theme: 'tooltipster-shadow',
                            delay: 500
                        };
                        break;
                }

                switch (action) {
                    case "update":

                        target
                            .find(".tooltipstered")
                            .each(function (i, obj) {
                                var node = $(obj);
                                node
                                    .tooltipster("content", node.attr("title"))
                                    .removeAttr("title");
                            });
                        break;

                    default:
                        target.find('.tooltip, ._tooltip')
                            .tooltipster({
                                theme: 'tooltipster-shadow',
                                delay: 500
                            });
                        break;
                }

                return this;
            }
        };
    });