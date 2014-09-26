;

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

/* String.format usage example:
"Home Sweet Homediddly-{0}-{1}! {2}".format("Dum", "Doodily")
==> "Home Sweet Homediddly-Dum-Doodily! {2}"
*/
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != "undefined"
        ? args[number]
        : match
            ;
        });
    };
}

(function ($) {
    $.widget("ui.navigation", {
        /* Default options */
        options: {
            _inTransition: false, /* is the map in transition? app doesn't have to use this option */
            skin: "red", /* widget skin to use: wmat (red, blue, orange, green) */
            sliderVal: 0, /* the current value of the slider */
            sliderMinVal: 0, /* the minimum value of the slider */
            sliderMaxVal: 25, /* the maximum value of the slider */
            animate: true, /* flag to set for slider transitions */
            locale: "en", /* the locale for this instance of the widget */
            debug: 1, /* flag to set for console messages */
            cssPath: "css/", /* path of CSS files for ui.navigation */
            /* various strings for the widget: hover tips, aria tags, etc. */
            strings: {
                "en": {
                    panUp_link_title: "Pan North",
                    panRight_link_title: "Pan East",
                    panDown_link_title: "Pan South",
                    panLeft_link_title: "Pan West",
                    fullExtent_link_title: "Canada View",
                    zoomIn_link_title: "Zoom In",
                    zoomSlider_link_title: "Zoom Slider",
                    zoomOut_link_title: "Zoom Out",
                    zoom_level_x_out_of_y: "Zoom level {0} out of {1}"
                },

                "fr": {
                    panUp_link_title: "Vers le nord",
                    panRight_link_title: "Vers l'est",
                    panDown_link_title: "Vers le sud",
                    panLeft_link_title: "Vers l'ouest",
                    fullExtent_link_title: "Voir Canada",
                    zoomIn_link_title: "Zoom avant",
                    zoomSlider_link_title: "Curseur de zoom",
                    zoomOut_link_title: "Zoom arrière",
                    zoom_level_x_out_of_y: "Zoome levele {0} outeve ofe {1}"
                }
            }
        },

        _init: function () {
            if (this.options.debug) console.log("fn: _init");
            var o = this.options,
                fake_evt = { "data": { "options": o } };

            //this._addUICSS(o.skin);
            this._validateOptions();
            this._toggleZoomButtons(fake_evt);
            this._updateARIAtags(fake_evt);
        },

        _create: function () {
            if (this.options.debug) console.log("fn: _create");

            this._renderUI();
            this._bindUIEvents();
        },

        /* inject the CSS file into the page according to the color */
        _addUICSS: function (color) {
            var o = this.options;
            o.cssPath += o.cssPath.endsWith("/") ? "" : "/";

            // IE8 support for injecting CSS
            var url = '{0}ui.navigation-{1}.css'.format(o.cssPath, color);

            if (document.createStyleSheet) {
                try { document.createStyleSheet(url); } catch (e) { console.log("addUICSS:" + e); }
            }
            else {
                var css;
                css = document.createElement('link');
                css.rel = 'stylesheet';
                css.type = 'text/css';
                css.media = "all";
                css.href = url;
                document.getElementsByTagName("head")[0].appendChild(css);
            }
        },

        /* WET applies small-screen CSS class to body when a small screen resolution
        is detected so check that */
        _isSmallScreen: function () {
            return ($(".small-screen").length != 0) ? true : false;
        },

        /* Return the class name:
        e.g. _getClassName("zoom", "in") --> "jq-navigation-zoom-in" */
        _getClassName: function () {
            var res = "jq-navigation";
            return (arguments.length != 0) ? res + "-" + Array.prototype.slice.call(arguments).join("-") : res;
        },

        /* Set the current value of the slider.
        This function allows external updates of the slider value. */
        setSliderVal: function (newVal) {
            var o = this.options,
                _getClassName = $.ui.navigation.prototype._getClassName,
                _toggleZoomButtons = $.ui.navigation.prototype._toggleZoomButtons,
                _isSmallScreen = $.ui.navigation.prototype._isSmallScreen;

            o.sliderVal = newVal;

            if (!_isSmallScreen.call())
                $("." + _getClassName("map", "slider")).slider("value", newVal);
            else
                _toggleZoomButtons({ "data": { "options": o } });
        },

        /* Toggle the transition flag */
        toggleTransition: function () {
            var o = this.options;
            o._inTransition = !o._inTransition;
        },

        /* Check if the slider"s minimum and maximum values are valid.
        Non-negative, and ascending. */
        _validateOptions: function () {
            var o = this.options,
                cur = o.sliderVal,
                min = o.sliderMinVal,
                max = o.sliderMaxVal;

            /* check for valid pair of min max values for creating slider */
            if (!(min >= 0 && max >= min))
                min = max = 0;

            /* check if set slider value is within the slider range */
            if (cur < min)
                cur = min;

            else if (cur > max)
                cur = max;
        },

        /* Update the ARIA tags for the slider handle */
        _updateARIAtags: function (e) {
            if (e.data.options.debug) console.log("fn: _updateARIAtags");
            var o = e.data.options,
                valText = o.strings[o.locale]["zoom_level_x_out_of_y"]
                           .format(o.sliderVal, o.sliderMaxVal);

            $(".ui-slider-handle").attr({
                "role": "slider",
                "aria-orientation": "vertical",
                "aria-valuemax": o.sliderMaxVal,
                "aria-valuemin": o.sliderMinVal,
                "aria-valuenow": o.sliderVal,
                "aria-valuetext": valText
            });
        },

        /* Return the requested string in the current locale. */
        _getString: function (s) {
            var o = this.options;
            return o.strings[o.locale][s];
        },

        _getLinkTitle: function (s) {
            return s + "_link_title";
        },

        /* Bind the events of all the controls. */
        _bindUIEvents: function () {
            if (this.options.debug) console.log("fn: _bindUIEvents");

            var o = { "options": this.options };

            /* Pan events */
            $("[class^=" + this._getClassName("pan") + "]")
                .keypress(this._onKeyPress)
                .click(o, this._onPanClick);

            /* Full extent events */
            $("." + this._getClassName("fullExtent"))
                .keypress(this._onKeyPress)
                .click(o, this._onFullExtentClick)
                .click(o, this._updateARIAtags);

            /* Zoom in/out events */
            $("[class^=" + this._getClassName("zoom") + "]")
                .keypress(this._onKeyPress)
                .click(o, this._onZoomClick)
                .click(o, this._updateARIAtags);

            /* Zoom slider events */
            if (!this._isSmallScreen())
                $("." + this._getClassName("map", "slider")).slider()
                    .on("slidechange", o, this._onZoomSliderChange)
                    .on("slidechange", o, this._toggleZoomButtons)
                    .on("slidechange", o, this._updateARIAtags);
        },

        /* Event that fires when a pan control is clicked */
        _onPanClick: function (e) {
            var o = e.data.options;
            if (o.debug) console.log("fn: _onPanClick");

            var dir = $(e.currentTarget).data("direction"); // e.currentTarget.className.split("-").reverse()[0];

            /* trigger an event so listeners are aware along with which direction
            was clicked: panUp, panRight, panDown, panLeft */
            if (!o._inTransition)
                $(this).trigger("navigation:panClick", dir);

            return false;
        },

        /* Event that fires on a key press on any of the controls except for the slider */
        _onKeyPress: function (e) {
            if (e.which === 32) /* trigger a click on a spacebar press */
                $(e.currentTarget).click();
        },

        /* Event that fires when the full extent control is clicked. */
        _onFullExtentClick: function (e) {
            var o = e.data.options;

            if (!o._inTransition)
                $(this).trigger("navigation:fullExtentClick");

            return false;
        },

        /* Event that fires when zoom in/out is clicked. */
        _onZoomClick: function (e, ui) {
            var o = e.data.options;
            if (o.debug) console.log("fn: _onZoomClick");

            var _isSmallScreen = $.ui.navigation.prototype._isSmallScreen;

            /* If the zoom button isn"t disabled and there"s no current animation
            on the slider: */
            if (e.currentTarget.className.indexOf("-disabled") == -1 &&
                !o._inTransition) {
                var in_out = $(e.currentTarget).data("direction"), //e.currentTarget.className.split("-").reverse()[0],
                    _getClassName = $.ui.navigation.prototype._getClassName;

                // raise event only when needed.
                var raiseZoomClick = true;

                if (in_out == "zoomIn") {
                    if (o.sliderVal < o.sliderMaxVal) { /* If we can zoom in */
                        ++o.sliderVal;
                    } else {
                        raiseZoomClick = false;
                    }
                } else if (in_out == "zoomOut") {
                    if (o.sliderVal > o.sliderMinVal) { /* If we can zoom out */
                        --o.sliderVal;
                    } else {
                        raiseZoomClick = false;
                    }
                }

                /* Check if we"re in a mobile viewport and make sure there are
                no animations in progress or queued.
                See: http://api.jquery.com/queue/ */
                if (!_isSmallScreen.call() &&
                    $(".ui-slider-handle").queue("fx").length == 0)
                    $("." + _getClassName("map", "slider"))
                        .slider("value", o.sliderVal);
                if (raiseZoomClick) {
                    $(this).trigger("navigation:zoomClick", in_out);
                }
            }

            return false;
        },

        /* Event that fires when the zoom slider value has changed either by user
        or programmatically. */
        _onZoomSliderChange: function (e, ui) {
            var o = e.data.options;
            if (o.debug) console.log("fn: _onZoomSliderChange");

            var _getClassName = $.ui.navigation.prototype._getClassName;
            var newVal = o.sliderVal = $("." + _getClassName("map", "slider")).slider("value");

            /* originalEvent is defined if event is triggered by user and not
            programmatically. This check is needed because of the event ring
            that occurs when the zoom extent is changed. */
            if (e.originalEvent) {
                $(this).trigger("navigation:zoomSliderChange", newVal);
            }
        },

        /* Toggle the zoom buttons if necessary. That is, disable them when the
        current value is at either of the bounds or enable them otherwise. */
        _toggleZoomButtons: function (e) {
            var o = e.data.options;
            if (o.debug) console.log("fn: _toggleZoomButtons");

            var min = o.sliderMinVal,
                max = o.sliderMaxVal;
            cur = o.sliderVal;
            _getClassName = $.ui.navigation.prototype._getClassName;
            zoomOut_class = _getClassName("zoomOut"),
                zoomIn_class = _getClassName("zoomIn");

            if (cur == min && cur == max) {
                $("." + zoomOut_class).attr("class", zoomOut_class + "-disabled");
                $("." + zoomIn_class).attr("class", zoomIn_class + "-disabled");
            } else if (cur == min) {
                $("." + zoomOut_class).attr("class", zoomOut_class + "-disabled");
                $("." + zoomIn_class + "-disabled").attr("class", zoomIn_class);
            } else if (cur == max) {
                $("." + zoomIn_class).attr("class", zoomIn_class + "-disabled");
                $("." + zoomOut_class + "-disabled").attr("class", zoomOut_class);
            } else {
                $("." + zoomIn_class + "-disabled").attr("class", zoomIn_class);
                $("." + zoomOut_class + "-disabled").attr("class", zoomOut_class);
            }
        },

        /* Create all the necessary UI elements.
        Pan and Full extent controls are created after everything else. */
        _renderUI: function () {
            var el = this.element,
                o = this.options,
                pan = $("<ul>", { "class": this._getClassName("pan") });

            el.addClass("jq-skin-wmat");

            var nav = $("<div>", { "class": this._getClassName("widget") + " " + this._getClassName() })
                    .append($("<div>", { "class": this._getClassName("content") })

            /* Pan section begins (added below, in this spot.) */
                        .append(pan)
            /* Pan section ends */

            /* Zoom slider begins */
                        .append($("<ul>", { "class": this._getClassName("zoom") })
                            .append($("<li>", {
                                "title": this._getString(this._getLinkTitle("zoomIn")),
                                "class": this._getClassName("zoomIn") + " _tooltip"
                            })
                            .data("direction", "zoomIn")
                                .append($("<a>", { "role": "button", "href": "" })
                                .append($("<span>").text(this._getString(this._getLinkTitle("zoomIn"))))))

            /* Slider rail */
                            .append($("<li>", { "class": this._getClassName("map", "slider") })
                                .append($("<div>", { "class": this._getClassName("slider", "rail") })).slider({
                                    "orientation": "vertical",
                                    "max": o.sliderMaxVal,
                                    "min": o.sliderMinVal,
                                    "animate": o.animate
                                })
                                )
            /* Slider rail ends */
                            .append($("<li>", {
                                "title": this._getString(this._getLinkTitle("zoomOut")),
                                "class": this._getClassName("zoomOut") + "-disabled _tooltip"
                            })
                            .data("direction", "zoomOut")
                                .append($("<a>", { "role": "button", "href": "" })
                                .append($("<span>").text(this._getString(this._getLinkTitle("zoomOut"))))))
                            )
                            )
            /* Zoom slider ends */

            /* Create pan and full extent controls */
            var ctrls = ["panUp", "panRight", "panDown", "panLeft", "fullExtent"],
                     len = ctrls.length;

            for (var i = 0; i < len; i++) {
                var ctrl = ctrls[i];
                pan
                    .append($("<li>", {
                        title: this._getString(this._getLinkTitle(ctrl)),
                        class: this._getClassName(ctrl) + " _tooltip"
                    })
                    .data("direction", ctrl)
                    .append($("<a>", { "role": "button", "href": "" })
                    .append($("<span>").text(this._getString(this._getLinkTitle(ctrl))))));
            }

            nav.appendTo(el);

            /* Set Zoom Slider button title */
            $(".ui-slider-handle")
                .attr({"title": this._getString(this._getLinkTitle("zoomSlider"))})
                .addClass("_tooltip");

            /* Hide the zoom slider when necessary */
            if (this._isSmallScreen())
                $("." + this._getClassName("map", "slider")).hide();
        }
    });
})(jQuery);