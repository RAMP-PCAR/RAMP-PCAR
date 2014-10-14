/* global $, window */

$.fn.dataTableExt.oPagination.executeOnLoad = function (target, func, callback) {
    'use strict';
    var handle;

    function resolve() {
        window.clearInterval(handle);

        callback();
    }

    handle = window.setInterval(function () {
        if ($.isFunction(target[func])) {
            resolve();
        }
    }, 500);
};

$.fn.dataTableExt.oPagination.iFullNumbersShowPages = 7;

$.fn.dataTableExt.oPagination.ramp = {
    /*
    * Function: oPagination.full_numbers.fnInit
    * Purpose:  Initialise dom elements required for pagination with a list of the pages
    * Returns:  -
    * Inputs:   object:oSettings - dataTables settings object
    *           node:nPaging - the DIV which contains this pagination control
    *           function:fnCallbackDraw - draw function which must be called on update
    */
    fnInit: function (oSettings, nPaging, fnCallbackDraw) {
        'use strict';
        var oLang = oSettings.oLanguage.oPaginate,
            oClasses = oSettings.oClasses,

            pageSelectorDiv,
            pageNumberButton,
            gotoPagesDiv,
            gotoToggleAnimationHandle,

            els,
            nFirst,
            nPrev,
            nNext,
            nLast,

            fnClickHandler = function (action) { // (e) {
                //console.log("before");
                //$.fn.dataTableExt.oPagination.rampDeltaOffset.updateOffset();
                if (oSettings.oApi._fnPageChange(oSettings, action)) { // e.data.action)) {
                    fnCallbackDraw(oSettings);
                }
            };

        $.fn.dataTableExt.oPagination.pagingBox = $(nPaging);

        //console.log("redo pagination");

        $(nPaging).append(
            '<div class="pagination-controls small">' +
                '<div class="pagination-range"><span class="pagination-record-number"></span><span>' + oLang.sRecords + '</span></div>' +
                '<div class="button-toolbar margin-top-medium">' +
                    '<div class="pagination-page-selector">' +
                        '<button class="pagination-page-number button button-none font-small" aria-haspopup="true">' + oLang.sPage + ' 1</button>' +

                        '<div class="pagination-goto-page animated"><ul></ul></div>' +
        //            '<span class="pagination-page-selector">Go to</span>' +
                    '</div>' +

                    '<ul class="button-group margin-right-small font-small pagination-arrow-controls">' +
                        '<li><button  class="' + oClasses.sPageButton + " " + "first" + ' _tooltip button button-none" title="' + oLang.sFirst + '"><div><span class="wb-invisible">' + oLang.sFirst + '</span></div></button></li>' +
                        '<li><button  class="' + oClasses.sPageButton + " " + "previous" + ' _tooltip button button-none" title="' + oLang.sPrevious + '"><div><span class="wb-invisible">' + oLang.sPrevious + '</span></div></button></li>' +
                        '<li><button  class="' + oClasses.sPageButton + " " + "next" + ' _tooltip button button-none" title="' + oLang.sNext + '"><div><span class="wb-invisible">' + oLang.sNext + '</span></div></button></li>' +
                        '<li><button  class="' + oClasses.sPageButton + " " + "last" + ' _tooltip button button-none" title="' + oLang.sLast + '"><div><span class="wb-invisible">' + oLang.sLast + '</span></div></button></li>' +
                    '</ul>' +
                '</div>' +
            '</div>'
        );
    
        els = $('button', nPaging);
        nFirst = els[1];
        nPrev = els[2];
        nNext = els[3];
        nLast = els[4];
    
        $(nFirst).click(function () { fnClickHandler("first"); });
        $(nPrev).click(function () { fnClickHandler("previous"); });
        $(nNext).click(function () { fnClickHandler("next"); });
        $(nLast).click(function () { fnClickHandler("last"); });

        //oSettings.oApi._fnBindAction(nFirst, { action: "first" }, fnClickHandler);
        //oSettings.oApi._fnBindAction(nPrev, { action: "previous" }, fnClickHandler);
        //oSettings.oApi._fnBindAction(nNext, { action: "next" }, fnClickHandler);
        //oSettings.oApi._fnBindAction(nLast, { action: "last" }, fnClickHandler);

        /* ID the first elements only */
        if (!oSettings.aanFeatures.p) {
            nPaging.id = oSettings.sTableId + '_paginate';
            nFirst.id = oSettings.sTableId + '_first';
            nPrev.id = oSettings.sTableId + '_previous';
            nNext.id = oSettings.sTableId + '_next';
            nLast.id = oSettings.sTableId + '_last';
        }

        els.disableSelection();

        pageSelectorDiv = $(".pagination-page-selector", nPaging);
        pageNumberButton = $(".pagination-page-number", nPaging);
        gotoPagesDiv = $(".pagination-goto-page", nPaging);

        function toggleGotoPagesDiv(open) {
            if (open) {
                var leftOffset = pageNumberButton.position().left + pageNumberButton.outerWidth(true) / 2,
                    pageButtons = gotoPagesDiv.find("li"),
                    itemMaxWidth = Array.max(pageButtons.map(function () { return $(this).width(); }).get());

                pageButtons.width(itemMaxWidth);
                leftOffset -= (itemMaxWidth * pageButtons.length + 2) / 2;

                pageNumberButton.addClass("button-pressed");

                gotoPagesDiv
                //.removeClass("wb-invisible")
                    .css({ left: leftOffset })
                    .removeClass("fadeOutDown")
                    .addClass("fadeInUp");

                // just in case browser doesn't support css animation
                window.setTimeout(function () {
                    gotoPagesDiv.css({ opacity: 1 });
                }, 110);
            } else {
                pageNumberButton.removeClass("button-pressed");

                gotoPagesDiv.removeClass("fadeInUp").addClass("fadeOutDown");
                // remove "fadeOut" effect to prevent flickering on extent change
                // just in case browser doesn't support css animation
                window.setTimeout(function () {
                    gotoPagesDiv
                        .css({ opacity: 0, left: -9999 })
                        .removeClass("fadeOutDown");
                    //.addClass("wb-invisible")
                }, 110);
            }

            gotoPagesDiv
                .attr({
                    "aria-expanded": open,
                    "aria-hidden": !open
                });
        }

        function openGotoPagesDiv() {
            if (gotoToggleAnimationHandle) {
                window.clearTimeout(gotoToggleAnimationHandle);
                gotoToggleAnimationHandle = null;
            }

            toggleGotoPagesDiv(true);
        }

        function hideGotoPagesDiv() {
            toggleGotoPagesDiv(false);
        }

        $.fn.dataTableExt.oPagination.executeOnLoad(pageNumberButton, "hoverIntent", function () {
            pageSelectorDiv
                .hoverIntent({
                    over: openGotoPagesDiv,
                    out: hideGotoPagesDiv,
                    timeout: 500
                })
                .on("click focusin", openGotoPagesDiv)
                .on("focusout", function () {
                    //console.log("foucsOut");
                    gotoToggleAnimationHandle = window.setTimeout(hideGotoPagesDiv, 500);
                });
        });
    },

    /*
    * Function: oPagination.full_numbers.fnUpdate
    * Purpose:  Update the list of page buttons shows
    * Returns:  -
    * Inputs:   object:oSettings - dataTables settings object
    *           function:fnCallbackDraw - draw function to call on page change
    */
    fnUpdate: function (oSettings, fnCallbackDraw) {
        'use strict';
        if (!oSettings.aanFeatures.p) {
            return;
        }
        //console.log("after");
        //$.fn.dataTableExt.oPagination.rampDeltaOffset.adjustOffset();

        var //recordNumberLabel,
            pageNumberButton,
            pageSelectorDiv,
            gotoPagesDiv,

            oLang = oSettings.oLanguage.oPaginate,

            iPageCount = $.fn.dataTableExt.oPagination.iFullNumbersShowPages,
            iPageCountHalf = Math.floor(iPageCount / 2),
            iPages = Math.ceil((oSettings.fnRecordsDisplay()) / oSettings._iDisplayLength),
            iCurrentPage = Math.ceil(oSettings._iDisplayStart / oSettings._iDisplayLength) + 1,
            sList = "",
        //  focusedPageButton,
            iStartButton,
            iEndButton,
            i,
            iLen,
            oClasses = oSettings.oClasses,
            anButtons,
            anStatic,
            //nPaginateList,
            nNode,
            an = oSettings.aanFeatures.p,

            fnBind = function (j/*, node*/) {
                oSettings.oApi._fnBindAction(this, { page: j + iStartButton - 1 }, function (e) {
                    $.fn.dataTableExt.oPagination.ramp.pageButtonFocus = true;

                    //console.log("before");
                    //$.fn.dataTableExt.oPagination.rampDeltaOffset.updateOffset();
                    /* Use the information in the element to jump to the required page */
                    oSettings.oApi._fnPageChange(oSettings, e.data.page);
                    fnCallbackDraw(oSettings);
                    //e.preventDefault();
                });
            };

        /* Pages calculation */
        if (oSettings._iDisplayLength === -1) {
            iStartButton = 1;
            iEndButton = 1;
            iCurrentPage = 1;
        } else if (iPages < iPageCount) {
            iStartButton = 1;
            iEndButton = iPages;
        } else if (iCurrentPage <= iPageCountHalf) {
            iStartButton = 1;
            iEndButton = iPageCount;
        } else if (iCurrentPage >= (iPages - iPageCountHalf)) {
            iStartButton = iPages - iPageCount + 1;
            iEndButton = iPages;
        } else {
            iStartButton = iCurrentPage - Math.ceil(iPageCount / 2) + 1;
            iEndButton = iStartButton + iPageCount - 1;
        }

        var iPageDisplayCount = iEndButton - iStartButton + 1,
            iPageCountMiddle = (iPageDisplayCount && 1) ? Math.floor(iPageDisplayCount / 2) + 1 + iStartButton - 1 : -1;
        //console.log(iPageCountMiddle);

        /* Build the dynamic list */
        for (i = iStartButton; i <= iEndButton; i++) {
            sList += (iCurrentPage !== i) ?
            '<li><button class="' + oClasses.sPageButton + ' button button-none "><span class="wb-invisible">' + oLang.sPage + '</span>' + oSettings.fnFormatNumber(i) + '</button></li>' :
            '<li><button class="' + oClasses.sPageButtonActive + (iPageCountMiddle === i ? " middle-page " : "") + ' button button-none button-disabled"><span class="wb-invisible">' + oLang.sPage + '</span>' + oSettings.fnFormatNumber(i) + '</button></li>';

            //'<li><a tabindex="' + oSettings.iTabIndex + '" class="' + oClasses.sPageButton + ' button">' + oSettings.fnFormatNumber(i) + '</a></li>' :
            //'<li><a tabindex="' + oSettings.iTabIndex + '" class="' + oClasses.sPageButtonActive + ' button button-accent button-disabled">' + oSettings.fnFormatNumber(i) + '</a></li>';
        }

        /* Loop over each instance of the pager */
        for (i = 0, iLen = an.length; i < iLen; i++) {
            nNode = an[i];
            if (!nNode.hasChildNodes()) {
                continue;
            }

            pageSelectorDiv = $(".pagination-page-selector", nNode);
            pageNumberButton = $(".pagination-page-number", pageSelectorDiv).text(oLang.sPage + ' ' + iCurrentPage);
            gotoPagesDiv = $(".pagination-goto-page", pageSelectorDiv);

            /* Build up the dynamic list first - html and listeners */
            $("ul", gotoPagesDiv).html(sList).find("button").each(fnBind);

            if ($.fn.dataTableExt.oPagination.ramp.pageButtonFocus) {
                $.fn.dataTableExt.oPagination.ramp.pageButtonFocus = null;
                gotoPagesDiv.find("button.paginate_active").focus();
            } else {
                // hide the page selector popout
                gotoPagesDiv
                    .css({ opacity: 0, left: -9999 });
                //.addClass("wb-invisible")

                //console.log("hide");
            }

            /* Update the permanent button's classes */
            anButtons = $(nNode).find(".pagination-arrow-controls button");

            if (iPages >= 1) {
                pageSelectorDiv.show();
            } else {
                //gotoPagesDiv.hide();
                pageSelectorDiv.hide();
            }

            anStatic = [
                anButtons[0], anButtons[1],
                anButtons[anButtons.length - 2], anButtons[anButtons.length - 1]
            ];

            $(anStatic).removeClass(oClasses.sPageButton + " " + oClasses.sPageButtonActive + " " + oClasses.sPageButtonDisabled + " button-disabled");
            $([anStatic[0], anStatic[1]]).addClass(
                (iCurrentPage === 1) ?
                    oClasses.sPageButtonDisabled + " button-disabled" :
                    oClasses.sPageButton
            );
            $([anStatic[2], anStatic[3]]).addClass(
                (iPages === 0 || iCurrentPage === iPages || oSettings._iDisplayLength === -1) ?
                    oClasses.sPageButtonDisabled + " button-disabled" :
                    oClasses.sPageButton
            );
        }
    }
};