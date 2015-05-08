/*global define, TimelineLite, TweenLite, $ */

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
* ####Imports RAMP Modules:
* {{#crossLink "Util"}}{{/crossLink}}  
* 
* @class Theme
* @static
* @uses dojo/_base/lang
*/

define(['dojo/_base/lang'],
    function (lang) {
        'use strict';

        var body = $('body'),
            wbCore = $('main'),
            wbFoot = $('footer'),

            megaMenuDiv = $('#wb-sm'),
            navigation = $('#wb-bar'),

            header = $("body>header"),

            transitionDuration = 0.5,

            layout = {
                headerHeight: 155,
                headerHeightCollapsed: 64,

                footerHeight: 30,
                footerHeightCollapsed: 5,

                subtitleHeight: 35,

                toolbarHeight: 32
            },

            // height gain from the fullscreening the template
            heightGain = layout.headerHeight - layout.headerHeightCollapsed + layout.footerHeight - layout.footerHeightCollapsed,

            isFullScreen = false,

            fullScreenTimeLine = new TimelineLite({ paused: true }),
            subpanelTimeline = new TimelineLite();

        // tweening wet template parts
        fullScreenTimeLine
            .to(header, transitionDuration, { top: navigation.outerHeight() * -1, position: 'relative', ease: 'easeOutCirc' }, 0)
            .set([navigation, megaMenuDiv], { display: 'none !important' })

            .to(wbCore, transitionDuration, { top: layout.headerHeightCollapsed, bottom: layout.footerHeightCollapsed, ease: 'easeOutCirc' }, 0)
            .to(wbFoot, transitionDuration, { height: layout.footerHeightCollapsed, ease: 'easeOutCirc' }, 0)

            .call(function () { body.addClass('full-screen'); }) // set full-screen class here, not in the callback since callbacks can be overwritten by fullScreenCallback function

            .add(subpanelTimeline, 0); // special timeline to tween subpanels

        /**
         * Toggles full screen mode
         *
         * @method _toggleFullScreenMode
         * @param  {Boolean} fullscreen true - full screen on; false - full screen off; undefined - toggle;
         */
        function _toggleFullScreenMode(fullscreen) {
            subpanelTimeline
                .clear() // need to recreate this timeline every time to capture newly created subpanels
                .fromTo('.sub-panel-container.summary-data-details', transitionDuration,
                    { top: layout.headerHeight + layout.toolbarHeight, bottom: layout.footerHeight },
                    { top: layout.headerHeightCollapsed + layout.toolbarHeight, bottom: layout.footerHeightCollapsed, ease: 'easeOutCirc' }, 0)
                .fromTo('.sub-panel-container.full-data-details', transitionDuration,
                    { top: layout.headerHeight, bottom: layout.footerHeight },
                    { top: layout.headerHeightCollapsed, bottom: layout.footerHeightCollapsed, ease: 'easeOutCirc' }, 0);

            isFullScreen = typeof fullscreen === 'boolean' ? fullscreen : !isFullScreen ;

            if (isFullScreen) {
                // need to tween datatables separately since it's very cumbersome to calculate their exact height - easier just to adjust height up/down by height gained when fullscreening the template
                TweenLite
                    .to('.full-data-mode .dataTables_scrollBody', transitionDuration,
                        { height: '+=' + heightGain, ease: 'easeOutCirc', delay: 0.02 }); // animate height of the datatable scrollBody since it's explicitly set ,

                fullScreenTimeLine.play();

            } else {
                TweenLite
                    .to('.full-data-mode .dataTables_scrollBody', transitionDuration - 0.02,
                        { height: '-=' + heightGain, ease: 'easeInCirc' }); // animate height of the datatable scrollBody since it's explicitly set ,

                body.removeClass('full-screen');
                fullScreenTimeLine.reverse();
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
            tooltipster: function (target, type, action, options) {
                var attr;
                target = target || $('body');

                switch (type) {
                    case 'map':
                        break;

                    default:
                        attr = {
                            theme: 'tooltipster-shadow',
                            delay: 500
                        };
                        break;
                }

                switch (action) {
                    case 'update':

                        target
                            .find('.tooltipstered')
                            .each(function (i, obj) {
                                var node = $(obj);
                                node
                                    .attr('data-tooltip', node.attr('title'))
                                    .tooltipster('content', node.attr('title'))
                                    .removeAttr('title');
                            });
                        break;

                    case 'destroy':
                        target
                            .find('.tooltipstered')
                            .each(function (i, obj) {
                                var node = $(obj);
                                node
                                    .tooltipster('destroy');
                            });
                        break;

                    default:
                        target
                            .find('.tooltip, ._tooltip')
                            // preserve title value for future use 
                            .each(function (i, obj) {
                                var node = $(obj),
                                    title = node.attr('title');

                                if (title) {
                                    node.attr('data-tooltip', node.attr('title'));
                                } else {
                                    node.attr('title', node.data('tooltip'));
                                }

                                node.tooltipster(
                                    lang.mixin({
                                        theme: node.data('tooltip-theme') || attr.theme,
                                        //autoClose: false,
                                        maxWidth: node.data('tooltip-maxwidth') || null,
                                        delay: attr.delay
                                    },
                                        options
                                    )
                                );
                            })
                            .removeAttr('title');
                        break;
                }

                return this;
            }
        };
    });