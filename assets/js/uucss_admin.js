(function ($) {

    function showNotification(heading, message, type = 'info') {
        var container = $('#uucss-wrapper')
        var content = $($('.uucss-info-wrapper.safelist-settings')[0]).clone().css('max-width', '100%');

        content.find('h4').text(heading);
        content.find('p').remove();
        content.find('.info-details').append('<p class="divider"></p>').append('<p>' + message + '</p>');

        container.prepend('<li class="uucss-notification uucss-notification-'+ type +' uucss-info-wrapper"><div class="content">'+ content.html() +'</div></li>').parent().show()
    }


    function hideNotification() {
        var container = $('.uucss-notification');
        container.hide()
    }

    $(document).ready(function () {



        if (window.uucss && window.uucss.notifications.length) {
            window.uucss.notifications.forEach(function (i) {

                showNotification(i.title, i.message, i.type);

            })
        }

        // options page
        window.tagBox.init();

        var $input = $('#uucss_api_key')
        var $uucss_spinner = $('.spinner-history')

        try {
            var _url = new URL(window.location.href);

            if (_url.search.includes('token')) {
                _url.searchParams.delete('token');
                _url.searchParams.delete('nonce');
                history.pushState('', document.title, _url);
            }

            if(_url.search.includes('deactivated')){
                _url.searchParams.delete('deactivated');
                history.pushState('', document.title, _url);
            }

        } catch (e) {

        }

        var whitelist_pack_el = $('#whitelist_packs');
        whitelist_pack_el.select2({
            ajax: {
                url: window.uucss.api + '/whitelist-packs',
                data: function (params) {
                    return {
                        s: params.term,
                        url: window.location.origin
                    };
                },
                headers: {
                    "Authorization": "Bearer " + $input.val(),
                    "Content-Type": "application/json",
                },
                delay: 150,
                cache: true,
                processResults: function (data) {

                    let d = data.data.map(function (item) {

                        return {
                            id: item.id + ":" + item.name,
                            text: item.name
                        }

                    })
                    return {
                        results: d,
                        pagination: {
                            more: false
                        }
                    };
                }
            },
            maximumSelectionLength: 5,
            width: '100%',
        })

        $('#uucss-pack-suggest').click(function () {

            var $button = $(this)
            var oldText = $button.val()

            $button.val('loading..')
            wp.ajax.post('suggest_whitelist_packs').done(function (data) {

                $button.val(oldText)

                if (!data) {
                    return;
                }

                data.forEach(function (item) {

                    if ($("li[title='" + item.name + "']").length === 0) {
                        var newOption = new Option(item.name, item.id + ':' + item.name, true, true);
                        whitelist_pack_el.append(newOption).trigger('change');
                    }

                });

            }).fail(function () {
                $button.val('Load Recommended Packs');
                $('#uucss-pack-suggest-error').text('error : something went wrong, please contact support')

            });

        });

        $.each($('span.dashicons.has-tooltip'),function(index, value){
            tippy($(value)[0], {
                content: $($(value)[0]).data('message'),
                allowHTML: true,
                placement: 'auto',
                animation: null,
                theme: 'light',
                interactive: true,
                delay: 0,
                arrow: false,
                offset: [0, 7]
            });
        });

        $('#uucss-wrapper li h2').click(function () {
            $(this).parent().find('.content').slideToggle('fast');
            $(this).find('.uucss-toggle-section').toggleClass('rotate')
        });

        var table = $('#uucss-history')

        table.on('init.dt', function () {
            setInterval(refreshTable, 1000 * 5)
        });

        var x = 0;

        table.on('draw.dt', function (x,y) {

            var element = '<div id="uucss-auto-refresh">' +
                '<input type="checkbox" id="uucss_auto_refresh_frontend" name="autoptimize_uucss_settings[uucss_auto_refresh_frontend]" value="1">' +
                '<label for="uucss_auto_refresh_frontend"> Auto Refresh</label><br>' +
                '<div>';

            $('#uucss-history_info').append(element);
            $('#uucss_auto_refresh_frontend').change(function () {
                $('#uucss_auto_refresh_frontend-hidden').val($(this).is(':checked') ? 1 : 0);
                auto_refresh = $(this).is(':checked');
            });
            $('#uucss_auto_refresh_frontend').prop('checked', auto_refresh);

            var select = $('<select class="status">' +
                    '<option value="" ' + (status_filter === ''? 'selected' : '') +'>All</option>' +
                    '<option value="success" ' + (status_filter === 'success'? 'selected' : '') +'>Success</option>' +
                    '<option value="warning" ' + (status_filter === 'warning'? 'selected' : '') +'>Warning</option>' +
                    '<option value="failed" ' + (status_filter === 'failed'? 'selected' : '') +'>Failed</option>' +
                    '<option value="queued" ' + (status_filter === 'queued'? 'selected' : '') +'>Queued</option>' +
                    '<option value="processing" ' + (status_filter === 'processing'? 'selected' : '') +'>Processing</option>' +
                '</select>');

            var input = '<div class="uucss-url-search-wrap"><input type="search" placeholder="Search" value="'+ url_filter +'"><input class="uucss_search_exact" type="checkbox" id="uucss_search_exact" value="1"></div>';
            $(input).prependTo($('#uucss-history_info'));

            $(select).prependTo($('#uucss-history_info'));

            $('#uucss-history_info select.status').on('change', function(){
                status_filter = $(this).val();
                table.column(4).search( status_filter ? '^'+ status_filter +'$' : '', true, false )
                    .draw();
            });

            tippy($('.uucss_search_exact')[0], {
                content: 'Exact Match',
                placement: 'top',
                appendTo: 'parent',
            });

            var $input = $('#uucss-history_info input[type="search"]')
            var $exact_search = $('#uucss-history_info input.uucss_search_exact')

            $input.on('input',function () {
                url_filter = $(this).val();

                var regex = url_filter;

                if(exact_search_val){
                    regex = '^' + url_filter + '$';
                }

                table.column(1).search( url_filter ? regex : '', true, false )
                    .draw();
            });

            $exact_search.on('change',function () {
                exact_search_val = $(this).prop('checked');
            });

            if(url_filter !== ''){
                $input.focus().val('').val(url_filter);
            }

            $exact_search.prop('checked', exact_search_val);

        });

        var auto_refresh = $('#uucss_auto_refresh_frontend-hidden').val() == '1';
        var firstReload = true;

        var status_filter = '';
        var url_filter = '';
        var exact_search_val = false;

        $uucss_spinner.addClass('loading')
        table = table.DataTable({
            ajax: {
                url: wp.ajax.settings.url + '?action=uucss_data',
                data: function (d) {
                    d.nonce = uucss.nonce

                    return d;
                },
                dataSrc: function (d) {

                    $uucss_spinner.removeClass('loading')

                    if (!d.success) {
                        alert("failed to fetch data")
                        return [];
                    }

                    var results = Object.values(d.data).sort(function (a, b) {
                        return b.time - a.time
                    });

                    if (results.length < 3 && firstReload) {
                        showNotification(
                            'Tip : When will i see the results ?',
                            'The plugin will trigger unused css removal job when a user visits a page of yours. you will see the processed jobs soon in here.'
                        );
                    }

                    var queued_jobs = results.filter(function (file) {
                        return file.status === 'queued';
                    });

                    var success_jobs = results.filter(function (file) {
                        return file.status === 'success';
                    });

                    if (queued_jobs.length > 3 && success_jobs.length === 0 && firstReload) {
                        showNotification(
                            'Caution : Please verify cron your job is working!',
                            'We have noticed some amount of jobs are still on processing and not completed. It maybe because your sites cron is not working properly.'
                        );
                    }
                    firstReload = false;
                    return results;
                }
            },
            searching: true,
            pagingType: "simple",
            bLengthChange: false,
            tfoot: false,
            bSort: false,
            columns: [
                {
                    "data": "status",
                    title: "Status",
                    width: '40px',
                    className: 'dt-body-center dt-head-center',
                    render: function (data, type, row, meta) {
                        var classNames = 'status ';
                        if(data === 'queued' || data === 'processing'){
                            classNames += 'refresh ';
                        }
                        classNames += data + ' ';
                        return '<span class="' + classNames +'">'+ data +'</span>'
                    },
                },
                {
                    "data": "url",
                    title: "URL",
                    className: "url",
                    render(data) {

                        if (!data) {
                            return '';
                        }

                        return '<a href="'+ decodeURI(data) +'" target="_blank">'+ decodeURI(data) +'</a>';
                    }
                },
                {
                    data: "url",
                    className: 'dt-body-center dt-head-center stats th-reduction',
                    title: "File Size Reduction",
                    width: '145px',
                    render: function (data, type, row, meta) {
                        if (row.status === 'success') {
                            return row.meta.stats.reduction + '%'
                        }else if(row.status === 'queued' || row.status === 'processing'){
                            return '-';
                        }

                        return '0 KB'
                    },
                    createdCell: function (td, cellData, rowData) {

                        var innerTippy
                        var innerTippy2

                        var stat = $(td).wrapInner($('<span></span>'));

                        var $warnings_html = $('<div class="uucss-warnings"></div>');

                        if(rowData.meta.warnings && rowData.meta.warnings.length){
                            var scrollable = rowData.meta.warnings.length > 2 ? 'scrollable' : '';
                            $warnings_html.append('<h5 class="warnings-title ">Warnings (' + rowData.meta.warnings.length  + ')</h5>');
                            $warnings_html.append('<ul class="warning-list ' + scrollable  + '"></ul>');
                            $.each(rowData.meta.warnings, function(index, value){
                                var $warning_html = $('<li class="warning"></li>')
                                $warning_html.append('<div class="warning-info"></div>');
                                $warning_html.find('.warning-info').append('<p class="warning-header">' +  value.message + '</p>');
                                if(value.file){
                                    $warning_html.find('.warning-info').append('<p class="warning-content"><a href="' + value.file +'" target="_blank">' +  value.file + '</a></p>');
                                }
                                $warnings_html.find('.warning-list').append($warning_html.wrap('<div></div>').parent().html())
                            })
                        }else{
                            $warnings_html.removeClass('uucss-warnings');
                        }

                        var attemptsString = '';

                        if(Number(rowData.attempts) !== 0){
                            attemptsString = 'Attempts : ' + rowData.attempts
                        }

                        var tippyOptions = {
                            theme: 'light',
                            triggerTarget: stat.find('span')[0],
                            content: function () {
                                var c = $('<div class="stat-tooltip">' +
                                    '       <div class="progress-bar-wrapper">' +
                                    '           <div class="progress-bar w-100">' +
                                    '               <span style="width:' + (100 - rowData.meta.stats.reduction) + '%">' + (100 - rowData.meta.stats.reduction).toFixed() + '%' +
                                    '               </span>' +
                                    '           </div>' +
                                    '       </div>' +
                                    $warnings_html.wrap('<div></div>').parent().html() +
                                    '<div class="time">' +
                                    '   <p class="val">Created at ' +
                                    new Date(rowData.time * 1000).toLocaleDateString() + ' ' + new Date(rowData.time * 1000).toLocaleTimeString() +
                                    '   </p>' +
                                    '   <p class="attempts">' +
                                    attemptsString +
                                    '   </p>' +
                                    '</div>' +
                                    '</div>');

                                innerTippy = tippy(c.find('.progress-bar-wrapper')[0], {
                                    content: 'Before UnusedCSS <span class="perc">' + rowData.meta.stats.before + '</span>',
                                    allowHTML: true,
                                    placement: 'bottom-end',
                                    trigger: 'manual',
                                    hideOnClick: false,
                                    animation: null,
                                    theme: 'tomato',
                                    interactive: true,
                                    delay: 0,
                                    offset: [0, 7],
                                    inlinePositioning: true,
                                })

                                innerTippy2 = tippy(c.find('.progress-bar')[0], {
                                    content: 'After UnusedCSS <span class="perc"> ' + rowData.meta.stats.after + '</span>',
                                    allowHTML: true,
                                    placement: 'top-start',
                                    trigger: 'manual',
                                    hideOnClick: false,
                                    animation: null,
                                    theme: 'ketchup',
                                    interactive: true,
                                    delay: 0,
                                    inlinePositioning: true,
                                })

                                return c[0]
                            },
                            placement: 'left',
                            //trigger: 'click',
                            interactive: true,
                            allowHTML: true,
                            animation: "shift-toward-extreme",
                            appendTo: "parent",
                            onShow: function () {
                                innerTippy.show()
                                innerTippy2.show()
                            },
                            onShown: function (instance) {
                                $(instance.popper).find('.progress-bar.w-100').removeClass('w-100')
                            },
                            onHide: function (instance) {
                                innerTippy.hide()
                                innerTippy2.hide()
                                $(instance.popper).find('.progress-bar').addClass('w-100')
                            }

                        }



                        if (rowData.status === 'failed') {
                            stat.find('span').append('<span class="dashicons dashicons-info error"></span>');

                            tippyOptions.onShow = function () {
                            }
                            tippyOptions.onHide = function () {
                            }

                            var code = (rowData.meta.error.code) ? rowData.meta.error.code : 500;
                            tippyOptions.content = '<div class="error-tooltip"><h5>Error</h5> <span><strong>CODE :</strong> ' + code + '</span> <br><span>' + rowData.meta.error.message + '</span></div>';

                            //tippyOptions.triggerTarget = $(td).closest('tr')[0]
                            tippy(stat.find('span')[0], tippyOptions);
                            return
                        }

                        if (rowData.status === 'success' && (!rowData.meta.warnings || !rowData.meta.warnings.length)) {
                            stat.find('span').append('<span class="dashicons dashicons-yes-alt"></span>');
                            tippy(stat.find('span')[0], tippyOptions);
                        } else if (rowData.status === 'success' && rowData.meta.warnings.length) {
                            stat.find('span').append('<span class="dashicons dashicons-warning"></span>');
                            tippy(stat.find('span')[0], tippyOptions);
                        }

                    }
                },
                {
                    "data": "url",
                    className: 'dt-body-right dt-head-right action th-actions',
                    "targets": 0,
                    title: "Actions",
                    width: '60px',
                    render: function (data, type, row, meta) {
                        var _render = '';

                        if (row.status !== 'queued') {
                            _render += '<button data-uucss-optimize data-url="' + data + '"><span class="dashicons dashicons-update"></span></button>'
                        }

                        _render += '<button data-uucss-options data-url="' + data + '"><span class="dashicons dashicons-ellipsis"></span></button>';

                        return _render;
                    },
                },
                {
                    "data": "meta",
                    visible : false,
                    render: function (data, type, row, meta) {
                        if (data.warnings && data.warnings.length > 0) return 'warning';
                        return data.status;
                    }
                }
            ],
            rowCallback: function (row, data, displayNum, displayIndex, dataIndex) {

                tippy($(row).find('button[data-uucss-options]')[0], {
                    allowHTML: true,
                    trigger: 'click',
                    arrow: true,
                    appendTo: $(row).find('button[data-uucss-options]')[0],
                    interactive: true,
                    animation: 'shift-toward',
                    hideOnClick: false,
                    theme: 'light',
                    content: ()=>{

                        var $content = $('<div class="uucss-option-list"><ul class="option-list"></ul></div>')

                        if(data.status === 'success'){
                            $content.find('ul').append('<li data-action_name="test"><a data-action_name="test" href="#">GPSI Status</a></li>')
                        }
                        $content.find('ul').append('<li data-action_name="remove"><a data-action_name="remove" href="#">Remove</a></li>');

                        return $content.wrap('<div></div>').parent().html();
                    },
                    onClickOutside(instance, event) {
                        instance.hide()
                    },
                    onCreate(){

                        tippy($('.uucss-option-list ul.option-list li[data-action_name="remove"]')[0], {
                            content: 'Remove RapidLoad cache files',
                            allowHTML: true,
                            placement: 'left',
                            hideOnClick: false,
                            animation: null,
                            interactive: true,
                            delay: 0,
                            inlinePositioning: true,
                            maxWidth: 500,
                            appendTo: 'parent'
                        })

                        tippy($('.uucss-option-list ul.option-list li[data-action_name="test"]')[0], {
                            content: 'Test Url',
                            allowHTML: true,
                            placement: 'left',
                            hideOnClick: false,
                            animation: null,
                            interactive: true,
                            delay: 0,
                            inlinePositioning: true,
                            maxWidth: 500,
                            appendTo: 'parent'
                        });

                    },
                    onMount(instance) {

                        $('.uucss-option-list ul.option-list li a').off().click(function (e) {

                            var $this = $(this);

                            var action = $this.data('action_name');

                            switch (action) {
                                case 'remove':{
                                    uucss_purge_url(data.url, true, row, dataIndex, data)
                                    break;
                                }
                                case 'test':{

                                    if($this.data('fetching')){
                                        return;
                                    }

                                    $.ajax({
                                        method : 'POST',
                                        url: wp.ajax.settings.url + '?action=uucss_test_url',
                                        data : {
                                            url: data.url,
                                        },
                                        beforeSend(){
                                            $this.data('fetching', true);
                                        },
                                        error: function(XMLHttpRequest, textStatus, errorThrown) {
                                            var $feather_content = $('.featherlight.uucss-gpsi-test .featherlight-content');
                                            var $content = $('<div class="content"></div>');
                                            $content.append('<span>Something went wrong</span>');
                                            $feather_content.find('.spinner').remove();
                                            $feather_content.append($content.wrap('<div></div>').parent().html());
                                        },
                                        success: function (response) {
                                            var $feather_content = $('.featherlight .featherlight-content');
                                            var $content = $('<div class="content"></div>');
                                            $content.append('<div class="header"></div>');
                                            $content.append('<div class="devider"></div>');
                                            $content.append('<div class="description"></div>');

                                            if(response.success && response.data && response.data.injected && response.data.injectedCSS > 0){

                                                $content.find('.header').append('<h2><span class="dashicons dashicons-yes-alt"></span>Success</h2>')
                                                $content.find('.description').append('<p>Optimization is now reflected in google page speed insight, gtmetrix and all other page speed testing tools.</p>')

                                            }else{

                                                $content.find('.header').append('<h2><span class="dashicons dashicons-warning"></span>Pending</h2>')
                                                $content.find('.description').append('<p>Your optimization is yet to be reflected on google page insight, gtmetrix and all other page speed testing tools.</p>')

                                            }

                                            $feather_content.find('.spinner').remove();
                                            $feather_content.append($content.wrap('<div></div>').parent().html());

                                        },
                                        complete:function () {
                                            $this.data('fetching', false);
                                        }
                                    });

                                    break;
                                }
                                default:{
                                    break;
                                }
                            }
                        })

                        $('.uucss-option-list ul.option-list li a[data-action_name="test"]')
                            .featherlight('<div class="spinner loading"></div>',{
                                variant : 'uucss-gpsi-test'
                            })
                    },
                    placement: 'bottom-end',
                })

                tippy($(row).find('button[data-uucss-optimize]')[0], {
                    content: 'Refresh files',
                    placement: 'top',
                    appendTo: "parent"
                })

                $(row).find('button').data('index',dataIndex);

                $(row).find('button[data-uucss-options]').off('click').click(function (e) {
                    e.preventDefault();
                });

                $(row).find('button[data-uucss-optimize]').off('click').click(function (e) {
                    e.preventDefault()

                    var is_clear = (typeof $(this).data().uucssClear === 'string')

                    uucss_purge_url(data.url, is_clear, row, dataIndex, data)

                });

                $(row).find('button[data-uucss-optimize]').off('click').click(function (e) {
                    e.preventDefault()

                    var is_clear = (typeof $(this).data().uucssClear === 'string')

                    uucss_purge_url(data.url, is_clear, row, dataIndex, data)

                });
            }
        });

        function uucss_purge_url(url , isClear, row, index, data) {

            var _row = table.row(index);

            var $row  = $(row);

            $row.addClass('loading');

            $uucss_spinner.addClass('loading');

            if (!isClear) {
                $(this).hide();
            }

            $.ajax({
                method : 'POST',
                url: wp.ajax.settings.url + '?action=uucss_purge_url',
                data : {
                    url: data.url,
                    clear: isClear,
                    nonce: uucss.nonce
                },
                success : function(response){

                    $uucss_spinner.removeClass('loading')

                    if(response.success){

                        if (isClear) {
                            (_row.length>0) && _row.remove().draw();
                        }else{
                            data.status = 'queued';
                            _row.data(data).draw(false);
                        }
                    }

                },
                complete:function () {
                    $row.removeClass('loading')
                }
            });
        }

        function refreshTable(){
            var $queuedJobs = $('#uucss-history tr td span.status.refresh');

            if(!auto_refresh){
                return;
            }

            $uucss_spinner.addClass('loading')
            table.ajax.reload(null, false);
        }

        function validateJobPerQue(value, reset) {

            var max = $('#uucss_queue_interval option[value="'+ value +'"]').data('max');

            var options = $('#uucss_jobs_per_queue option');

            $.each(options, function (element) {
                $(options[element]).attr('disabled', $(options[element]).val() > max)
            });
           if(reset){
               $('#uucss_jobs_per_queue').val($(options[0]).val());
           }
        }

        $('#uucss_queue_interval').change(function () {
             validateJobPerQue($(this).val(), true)
        });

        validateJobPerQue($('#uucss_queue_interval').val(), false);

        updateLicense();

        $('#uucss-deactivate').click(function (e) {
            e.preventDefault()
            let $this = $(this)
            $this.text('deactivating...');

            wp.ajax.post('uucss_deactivate').done(function (r) {
                $this.text('deactivated');
                window.location.reload()
            })
        });

        $('a.connect-with-license').click(function (e) {
            e.preventDefault();
        });

        tippy('a.connect-with-license', {
            allowHTML: true,
            arrow: false,
            appendTo: $('a.connect-with-license')[0],
            interactive: true,
            animation: 'shift-toward',
            placement: 'top-start',
            trigger: 'click',
            hideOnClick: false,
            theme: 'light',
            maxWidth: 500,
            onClickOutside(instance, event) {
                instance.hide()
            },
            content: function () {
                var content;
                content = '<div class="tippy-connect-with-license">' +
                    '               <div class="tippy-connect-with-license-content">' +
                    '                   <div class="header-text">' +
                    '                       <p>Enter your License Key below</p>' +
                    '                   </div>' +
                    '                   <div class="input-wrap">' +
                    '                       <input type="text"  placeholder="License Key" class="uucss-key">' +
                    '                       <a href="#" class="connect">Connect</a>' +
                    '                   </div>' +
                    '                   <div><p class="uucss-key-error"></p></div>' +
                    '               </div>' +
                    '          </div>';
                return content;
            },
            onMount(instance){
                $('a.connect-with-license .tippy-connect-with-license-content input.uucss-key').focus();
                $('a.connect-with-license .tippy-connect-with-license-content .input-wrap .connect').click(function (e) {
                    e.preventDefault();

                    var license_key = $('a.connect-with-license .tippy-connect-with-license-content .input-wrap input').val();

                    if(license_key === ''){
                        alert('Please enter license key');
                        return;
                    }

                    var $target = $(this);

                    $target.text('Connecting...');
                    $target.removeAttr('href');

                    wp.ajax.post('uucss_connect',{ license_key : license_key }).then(function (i) {

                        if(i.success){
                            window.location.href = window.location.href + '&token=' + license_key + '&nonce=' + i.activation_nonce
                        }

                    }).fail(function (i) {

                        $target.text('Connect');
                        $target.attr('href','#');
                        $('a.connect-with-license p.uucss-key-error').text(i);

                    })

                })
            }
        });

        $('#queue-posts-type').click(function () {
            wp.ajax.post('uucss_queue',{ post_type : $('#requeue_post_type').val() }).then(function (i) {

                alert(i);

            })
        });

    });


    function updateLicense() {

        if(uucss.api_key_verified === ""){
            return;
        }

        var container = $('.license-info')

        container.addClass('loading');

        wp.ajax.post('uucss_license').then(function (i) {
            $('.license-info ul').show();

            $('#license-name').text(i.name)
            $('#license-email').text(i.email)
            $('#license-next_billing').text(new Date(i.next_billing * 1000).toLocaleDateString())
            $('#license-plan').text(i.plan)
            $('#license-domain').text(i.siteUrl)

            container.removeClass('loading');
        }).fail(function (i) {
            $('.license-info ul').hide()
            $('.license-info #license-message').show().html('Sorry, we couldn\'t collect license information of yours.')
            container.removeClass('loading');
        })

        tippy('.uucss-support a', {
            allowHTML: true,
            arrow: false,
            appendTo: 'parent',
            animation: 'shift-toward',
            placement: 'top-end',
            content: function () {
                var el = document.getElementById('uucss-support-tooltip');
                el.style.display = 'inline-block';
                return el
            }
        });

    }

}(jQuery))