
(function ($) {

    $(document).ready(function(){

        var popupWindow = null;
        var origin = null;
        var $flexViewPort = $('.slide-contents-wrap');
        var $contentWrap = $('.slide-contents-wrap .slide-contents');
        var content = '.slide-content';

        $(window).resize(function () {
            $contentWrap.find(content).css('max-width',$('.slide-contents-wrap').width());
        });

        function moveAction(){
            origin = $contentWrap.position().left;
            var width = $contentWrap.find(content).outerWidth();
            var left = origin - width;

            $contentWrap.css('transform','translate3d('+ left +'px,0px,0px)');
            $contentWrap.css('transition-duration','0.5s');
        }

        function child_open(url){
            if(popupWindow && !popupWindow.closed){
                popupWindow.focus();
            }
            else{

                popupWindow = window.open(url,"_blank","directories=no, status=no, menubar=no, scrollbars=yes, resizable=no,width=600, height=280,top=200,left=200");

                $(window).bind("beforeunload", function() {
                    popupWindow = null;
                });
                popupWindow.focus();
            }

        }

        function parent_disable() {
            if(popupWindow && !popupWindow.closed)
                popupWindow.focus();
        }

        var progress_check = null;
        var ajax_pending = false;

        function markCompletion(){
            if($('.uucss-on-board .card .actions.done').length == 4){
                $('.uucss-on-board').addClass('complete')
                $contentWrap.css('transform','translate3d(-892px,0px,0px)');
                $contentWrap.css('transition-duration','0.5s');
            }
        }

        function markActionDone($element) {
            if(!$element.parent().hasClass('done')){
                $element.parent().addClass('done')
            }
            markCompletion();
        }

        function checkAutoptimizeInstalled(){
            if(ajax_pending){
                return;
            }
            $.ajax({
                url : uucss.ajax_url,
                type : 'GET',
                data : {
                    action : 'ao_installed',
                },
                beforeSend : function(){
                    ajax_pending = true;
                },
                complete : function(){
                    ajax_pending = false;
                },
                success : function (response) {
                    if(response.data){
                        if(response.data.installed && response.data.active){
                            markActionDone($('.js-activate-ao'));
                            $('.uucss-on-board #progress-bar').css('width','50%');
                            $('.uucss-on-board .plugin-steps .steps-wrap .current').text(2);
                            $('.uucss-on-board .plugin-steps .steps-wrap .current-text').text('Configure');
                            clearInterval(progress_check);
                            moveAction();
                            if(response.data.css_enabled){
                                markActionDone($('.js-enable-css-ao '));
                            }
                            popupWindow.close();
                            popupWindow = null;
                        }else if(response.data.installed){
                            $('.js-activate-ao ').data('installed', true);
                            if(popupWindow.closed){
                                clearInterval(progress_check);
                            }
                        }
                    }
                }
            })
        }

        function checkAutoptimizeCssEnabled(){
            if(popupWindow.closed){
                clearInterval(progress_check);
                return;
            }
            if(ajax_pending){
                return;
            }
            $.ajax({
                url : uucss.ajax_url,
                type : 'GET',
                data : {
                    action : 'ao_css_enabled',
                },
                beforeSend : function(){
                    ajax_pending = true;
                },
                complete : function(){
                    ajax_pending = false;
                },
                success : function (response) {
                    if(response.data){
                        clearInterval(progress_check);
                        popupWindow.close();
                        popupWindow = null;
                        markActionDone($('.js-enable-css-ao '));
                        $('.uucss-on-board #progress-bar').css('width','75%');
                        $('.uucss-on-board .plugin-steps .steps-wrap .current').text(3);
                        $('.uucss-on-board .plugin-steps .steps-wrap .current-text').text('Connect');
                        moveAction();
                    }
                }
            })
        }

        function checkUnusedCssConnected(){
            if(popupWindow.closed){
                clearInterval(progress_check);
                return;
            }
            if(ajax_pending){
                return;
            }
            $.ajax({
                url : uucss.ajax_url,
                type : 'GET',
                data : {
                    action : 'uucss_connected',
                },
                beforeSend : function(){
                    ajax_pending = true;
                },
                complete : function(){
                    ajax_pending = false;
                },
                success : function (response) {
                    if(response.data){
                        clearInterval(progress_check);
                        popupWindow.close();
                        popupWindow = null;
                        markActionDone($('.js-uucss-connect'));
                        $('.uucss-on-board #progress-bar').css('width','100%');
                        $('.uucss-on-board .plugin-steps .steps-wrap .current').text(4);
                        $('.uucss-on-board .plugin-steps .steps-wrap .current-text').text('Run First Job');
                        moveAction();
                    }
                }
            })
        }

        function runFirstJob(){
            $.ajax({
                url : uucss.ajax_url,
                type : 'GET',
                data : {
                    action : 'uucss_run_first_job',
                },
                beforeSend : function(){

                },
                complete : function(){

                },
                success : function (response) {
                    if(response.data){
                        markActionDone($('.js-uucss-first-job'));
                        $('.uucss-on-board .plugin-steps .steps-wrap .current').text('');
                        $('.uucss-on-board .plugin-steps .steps-wrap .current-text').text('');
                        moveAction();
                    }
                }
            })
        }

        $('.js-activate-ao').click(function(e){
            e.preventDefault();
            if($(this).data('installed')){
                child_open($(this).data('activation_url'));
            }else{
                child_open($(this).attr('href'));
            }
            clearInterval(progress_check);
            progress_check = setInterval(checkAutoptimizeInstalled,6000);
        });

        $('.js-enable-css-ao').click(function(e){
            e.preventDefault();
            child_open($(this).attr('href'));
            clearInterval(progress_check);
            progress_check = setInterval(checkAutoptimizeCssEnabled,6000);
        });

        $('.js-uucss-connect').click(function(e){
            e.preventDefault();
            child_open($(this).attr('href'));
            clearInterval(progress_check);
            progress_check = setInterval(checkUnusedCssConnected,6000);
        });

        $('.js-uucss-first-job').click(function(e){
            e.preventDefault();
            clearInterval(progress_check);
            runFirstJob();
        });

        $('body').focus(function () {
            parent_disable();
        });

        $('body').click(function () {
            parent_disable();
        });

        markCompletion();
    });

}(jQuery))