(function ($) {

    $(document).ready(function () {

        var popupWindow = null;
        var origin = null;
        var $contentWrap = $('.slide-contents-wrap .slide-contents');
        var content = '.slide-content';

        $(window).resize(function () {
            $contentWrap.find(content).css('max-width', $('.slide-contents-wrap').width());
        });

        function moveSlide(left) {
            $contentWrap.css('transform', 'translate3d(' + left + 'px,0px,0px)');
            $contentWrap.css('transition-duration', '0.5s');
        }

        function moveAction() {
            origin = $contentWrap.position().left;
            var width = $contentWrap.find(content).outerWidth();
            var left = origin - width;

            moveSlide(left);
        }

        function child_open(url, width = 770, height = 590) {
            if (popupWindow && !popupWindow.closed) {
                popupWindow.focus();
            } else {
                var left = ($(window).width() / 2) - (width / 2);
                var top = ($(window).height() / 2) - (height / 2);
                popupWindow = window.open(url, "_blank", "directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, width=" + width + ", height=" + height + ",  top=" + top + ", left=" + left);

                $(window).bind("beforeunload", function () {
                    popupWindow = null;
                });
                popupWindow.focus();
            }

        }

        function parent_disable() {
            if (popupWindow && !popupWindow.closed)
                popupWindow.focus();
        }

        var progress_check = null;
        var ajax_pending = false;
        var $progressBar = $('.uucss-on-board #progress-bar');
        var $stepWrapper = $('.uucss-on-board .plugin-steps .steps-wrap');
        var totalSteps = $('.uucss-on-board .plugin-steps').data('total_steps');

        function markCompletion() {
            if ($('.uucss-on-board .card .actions.done').length === totalSteps) {
                moveSlide(-1 * 223 * totalSteps);
                if (!$('.uucss-on-board').hasClass('complete')) {
                    $('.uucss-on-board').addClass('complete')
                }
            }
        }

        function markActionDone($element) {
            if (!$element.parent().parent().hasClass('done')) {
                $element.parent().parent().addClass('done')
            }
            markCompletion();
        }

        function showAnalyze(value, error = false) {
            var $analyze = $('.uucss-on-board .card.analyze');
            if(!error){
                if (value) {
                    $analyze.addClass('show')
                } else {
                    $analyze.css('transition-duration', '0.5s');
                    $analyze.removeClass('show');
                }
            }else{
                if (value) {
                    $analyze.addClass('show')
                } else {
                    $('.uucss-on-board .analyze-result').addClass('uucss-error');
                    $analyze.css('transition-duration', '0.5s');
                    $analyze.removeClass('show');
                }
            }

        }

        function gotoConfigure() {
            $('.uucss-on-board .card.analyze')
            $progressBar.css('width', '100%');
            $stepWrapper.css('opacity', 1);
            $stepWrapper.find('.current').text(3);
            $stepWrapper.find('.current-text').text('Connect');
            moveSlide(-446);
        }

        function gotoRunFirstJob() {
            $progressBar.css('width', '100%');
            $stepWrapper.css('opacity', 0);
            $stepWrapper.find('.current').text(4);
            $stepWrapper.find('.current-text').text('Run First Job');
            moveSlide(-669);
        }

        function gotoInstall() {
            $progressBar.css('width', '66%');
            $stepWrapper.css('opacity', 1);
            $stepWrapper.find('.current').text(2);
            $stepWrapper.find('.current-text').text('Configure');
            moveSlide(-223)
        }

        function gotoConnect() {
            $progressBar.css('width', '33%');
            $stepWrapper.css('opacity', 1);
            $stepWrapper.find('.current').text(1);
            $stepWrapper.find('.current-text').text('Configure');
            moveSlide(0);
        }

        function gotoPendingStep(response) {
            if (response.data.installed &&
                response.data.active &&
                response.data.css_enabled &&
                response.data.uucss_connected &&
                response.data.uucss_first_job_done
            ) {
                markCompletion();
            } else if (response.data.installed &&
                response.data.active &&
                response.data.css_enabled &&
                response.data.uucss_connected
            ) {
                gotoRunFirstJob();
            } else if (response.data.installed &&
                response.data.active &&
                response.data.uucss_connected
            ) {
                gotoConfigure();
            } else if (response.data.installed &&
                response.data.active
            ) {
                gotoConnect();
            } else if (response.data.installed &&
                response.data.active &&
                response.data.css_enabled
            ) {
                gotoConnect();
            } else if (
                response.data.uucss_connected
            ) {
                gotoInstall();
            }
        }

        function markCompleteActions(response) {
            if (response.data.installed &&
                response.data.active) {
                markActionDone($('.js-activate-ao'));
            }
            if (response.data.css_enabled) {
                markActionDone($('.js-enable-css-ao '));
            }
            if (response.data.uucss_connected) {
                $('.skip-analyze.js-uucss-connect').hide();
                markActionDone($('.connect.actions .action-wrap a'));
            }
            if (response.data.uucss_first_job_done) {
                markActionDone($('.js-uucss-first-job'));
            }
            if ($('.uucss-on-board .card .actions.done').length == 4) {
                if (response.data.uucss_first_job.meta && response.data.uucss_first_job.meta.error) {
                    $('.uucss-on-board.complete .card-complete .error-result p span.code').text(response.data.uucss_first_job.meta.error.code);
                    $('.uucss-on-board.complete .card-complete .error-result p span.description').text(response.data.uucss_first_job.meta.error.message);
                    $('.uucss-on-board.complete .card-complete a.js-goto-settings').text('Settings');
                    $('.uucss-on-board .card-complete').addClass('has-error');
                } else if (response.data.uucss_first_job) {
                    var innerTippy = tippy($('.uucss-on-board.complete .card-complete .stat-tooltip .progress-bar-wrapper')[0], {
                        content: 'Without RapidLoad <span class="perc">' + response.data.uucss_first_job.meta.stats.before + '</span>',
                        allowHTML: true,
                        placement: 'bottom-end',
                        trigger: 'manual',
                        hideOnClick: false,
                        animation: null,
                        theme: 'tomato',
                        interactive: true,
                        delay: 0,
                        offset: [0, 14]
                    })
                    innerTippy.show();
                    var innerTippy2 = tippy($('.uucss-on-board.complete .card-complete .stat-tooltip .progress-bar-wrapper')[0], {
                        content: 'RapidLoad <span class="perc"> ' + response.data.uucss_first_job.meta.stats.after + '</span>',
                        allowHTML: true,
                        placement: 'top-start',
                        trigger: 'manual',
                        hideOnClick: false,
                        animation: null,
                        theme: 'ketchup',
                        interactive: true,
                        delay: 0,
                    })
                    innerTippy2.show();
                    $('.uucss-on-board .card-complete .content .first-result .result-stat .progress-bar span').text((100 - Number(response.data.uucss_first_job.meta.stats.reduction)).toFixed(0) + '%');
                    $('.uucss-on-board .card-complete .content .first-result .result-stat .progress-bar span').css('width', (100 - Number(response.data.uucss_first_job.meta.stats.reduction)).toFixed(0) + '%');
                }
                $('.uucss-on-board').addClass('complete')
            }
        }

        function closePopWindow() {
            if (popupWindow) {
                popupWindow.close();
                popupWindow = null;
            }
            clearInterval(progress_check);
        }

        function checkAutoptimizeInstalled() {
            if (ajax_pending) {
                return;
            }
            $.ajax({
                url: uucss_global.ajax_url,
                type: 'GET',
                data: {
                    action: 'ao_installed',
                    nonce : uucss_global.nonce
                },
                beforeSend: function () {
                    ajax_pending = true;
                },
                complete: function () {
                    ajax_pending = false;
                },
                success: function (response) {
                    if (response.data) {
                        markCompleteActions(response);
                        gotoPendingStep(response);
                        if (response.data.installed) {
                            $('.js-activate-ao ').data('installed', true);
                            $('.js-activate-ao ').html('Activate <span class="dashicons dashicons-yes-alt"></span>');
                            if (popupWindow.closed) {
                                clearInterval(progress_check);
                            }
                        }
                        if (response.data.installed && response.data.active) {
                            closePopWindow();
                        }
                    }
                }
            })
        }

        function checkAutoptimizeCssEnabled() {
            if (popupWindow.closed) {
                clearInterval(progress_check);
                return;
            }
            if (ajax_pending) {
                return;
            }
            $.ajax({
                url: uucss_global.ajax_url,
                type: 'GET',
                data: {
                    action: 'ao_installed',
                    nonce : uucss_global.nonce
                },
                beforeSend: function () {
                    ajax_pending = true;
                },
                complete: function () {
                    ajax_pending = false;
                },
                success: function (response) {
                    if (response.data) {
                        markCompleteActions(response);
                        gotoPendingStep(response);
                        if (response.data.css_enabled) {
                            closePopWindow();
                        }
                    }

                }
            })
        }

        function checkUnusedCssConnected() {
            if (popupWindow.closed) {
                clearInterval(progress_check);
                return;
            }
            if (ajax_pending) {
                return;
            }
            $.ajax({
                url: uucss_global.ajax_url,
                type: 'GET',
                data: {
                    action: 'ao_installed',
                    nonce : uucss_global.nonce
                },
                beforeSend: function () {
                    ajax_pending = true;
                },
                complete: function () {
                    ajax_pending = false;
                },
                success: function (response) {
                    if (response.data) {
                        markCompleteActions(response);
                        gotoPendingStep(response);
                        if (response.data.uucss_connected) {
                            closePopWindow();
                            $('.js-uucss-analyze-site').html('Connect <span class="dashicons dashicons-yes-alt"></span>');
                        }
                    }
                }
            })
        }

        function getStatus() {

            if(!window.location.href.toString().includes('page=uucss-onboarding')){
                return;
            }

            $.ajax({
                url: uucss_global.ajax_url,
                type: 'GET',
                data: {
                    action: 'ao_installed',
                    nonce : uucss_global.nonce
                },
                success: function (response) {
                    if (response.data) {
                        markCompleteActions(response);
                    }
                }
            })
        }

        function runFirstJob() {
            if (ajax_pending) {
                return;
            }
            $.ajax({
                url: uucss_global.ajax_url,
                type: 'GET',
                data: {
                    action: 'run_first_job',
                    nonce : uucss_global.nonce
                },
                beforeSend: function () {
                    ajax_pending = true;
                    $('.js-uucss-first-job').html('Loading... <span class="dashicons dashicons-yes-alt"></span>')
                },
                complete: function () {
                    ajax_pending = false;
                    $('.js-uucss-first-job').html('Run First Job <span class="dashicons dashicons-yes-alt"></span>')
                },
                success: function (response) {
                    if (response.data) {
                        markCompleteActions(response);
                        if (response.data.uucss_first_job_done) {
                            $('.uucss-on-board .plugin-steps .steps-wrap .current').text('');
                            $('.uucss-on-board .plugin-steps .steps-wrap .current-text').text('');
                            moveAction();
                        }
                    }
                }
            })
        }

        $('.js-activate-ao').click(function (e) {
            e.preventDefault();
            if ($(this).data('installed')) {
                child_open($(this).data('activation_url'));
            } else {
                child_open($(this).attr('href'));
            }
            clearInterval(progress_check);
            progress_check = setInterval(checkAutoptimizeInstalled, 1000);
        });

        $('.js-enable-css-ao').click(function (e) {
            e.preventDefault();
            if (!$('.uucss-on-board .install.actions').hasClass('done')) {
                $.uucssAlert('Install and Activate Autoptimize before configure', 'info');
                gotoInstall();
                return;
            }
            child_open($(this).attr('href'));
            clearInterval(progress_check);
            progress_check = setInterval(checkAutoptimizeCssEnabled, 1000);
        });

        $('.js-uucss-connect').click(function (e) {
            e.preventDefault();

            child_open($(this).attr('href'));
            clearInterval(progress_check);
            progress_check = setInterval(checkUnusedCssConnected, 1000);
        });

        $('.js-uucss-first-job').click(function (e) {
            e.preventDefault();
            if (!$('.uucss-on-board .connect.actions').hasClass('done')) {
                $.uucssAlert('Connect RapidLoad before run first job', 'info');
                gotoConnect();
                return;
            }
            clearInterval(progress_check);
            runFirstJob();
        });

        $('.js-uucss-analyze-site').click(function (e) {
            e.preventDefault();

            var $target = $(this);
            $target.text('Analyzing...');
            $target.removeAttr('href');

            var $parent = $('.uucss-on-board .card .connect.actions');
            $.ajax({
                url: uucss_global.api_url + '/preview',
                method: 'POST',
                data: {
                    url: uucss_global.home_url
                },
                error(response){
                    console.log(response.status)
                    var $errorContent = $('.uucss-on-board .analyze-result');

                    if(response.status === 403){
                        $errorContent.find('.step-1-hd').text('We are Being Blocked!');

                        $target.off();
                        $target.addClass('js-uucss-connect');
                        $('.js-uucss-connect').click(function (e) {
                            e.preventDefault();
                            child_open($(this).data('activation_url'));
                            clearInterval(progress_check);
                            progress_check = setInterval(checkUnusedCssConnected, 1000);
                        });
                        $target.html('Connect <span class="dashicons dashicons-yes-alt"></span>');
                        $target.attr('href','#');

                    }else{


                        $errorContent.find('.step-1-hd').text('Something Went Wrong!');
                        var $button = $errorContent.parent().find('.action-wrap a.act-button');
                        $button.attr('href','https://rapidload.zendesk.com/hc/en-us/requests/new');
                        $button.unbind('click');
                        $button.text('Contact Support')

                    }
                    $('.skip-analyze.js-uucss-connect').text('Connect');
                    $('.skip-analyze.js-uucss-connect').css('left','calc(50% - 24px)');
                    $target.removeClass('js-uucss-analyze-site');

                    showAnalyze(false, true);
                },
                success(response) {
                    if(response.data){

                        $parent.find('.analyze-result').find('.reduction').text(response.data.stats.reduction + '%');

                        var $sizeContent = $parent.find('.stats-figures .content');
                        var beforeSize = response.data.stats.before.split(' ');
                        if(beforeSize.length === 2){
                            $sizeContent.find('.before span.value').html(beforeSize[0] + " " + '<span>' + beforeSize[1] + '</span>');
                        }
                        var afterSize = response.data.stats.after.split(' ');
                        if(afterSize.length === 2){
                            $sizeContent.find('.after span.value').html(afterSize[0] + " " + '<span>' + afterSize[1] + '</span>');
                        }

                        if(response.data.stats.afterFileCount === 0){
                            $parent.find('.stats-files').hide();
                        }else{
                            var $fileCountContent = $parent.find('.stats-files .content');
                            $fileCountContent.find('.before span.value').text(response.data.stats.beforeFileCount);
                            $fileCountContent.find('.after span.value').text(response.data.stats.afterFileCount);
                        }
                        $target.removeClass('js-uucss-analyze-site');
                        $target.addClass('js-uucss-connect');
                        $target.off();
                        $('.js-uucss-connect').click(function (e) {
                            e.preventDefault();

                            child_open($(this).data('activation_url'));
                            clearInterval(progress_check);
                            progress_check = setInterval(checkUnusedCssConnected, 1000);
                        });
                        $target.html('Connect <span class="dashicons dashicons-yes-alt"></span>');
                    }
                    $('.skip-analyze.js-uucss-connect').hide();
                    $target.attr('href','#');
                    showAnalyze(false);
                }
            });

        });

        $('body.settings_page_uucss-onboarding').focus(function () {
            parent_disable();
        });

        $('body.settings_page_uucss-onboarding').click(function () {
            parent_disable();
        });

        markCompletion();

        $('.uucss-on-board .actions .nav').click(function () {
            var plus = false;
            if ($(this).hasClass('next')) {
                plus = true;
            }
            switch ($('.uucss-on-board .steps-wrap .step-text .current').text()) {
                case '1': {
                    if (plus) {
                        gotoInstall();
                    }
                    break;
                }
                case '2': {
                    if (plus) {
                        gotoConfigure()
                    } else {
                        gotoConnect();
                    }
                    break;
                }
                case '3': {
                    if (plus) {
                        gotoRunFirstJob();
                    } else {
                        gotoInstall();
                    }
                    break;
                }
                case '4': {
                    gotoConfigure();
                    break;
                }
            }
        })

        getStatus();

    });

}(jQuery))