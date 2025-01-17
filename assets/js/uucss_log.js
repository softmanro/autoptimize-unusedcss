(function ($) {

    $(document).ready(function () {

        $.fn.dataTable.ext.errMode = 'none';

        var $table = null;
        var status_filter = '';
        var log_interval = null;
        var url_filter = '';
        var exact_search_val = false;
        var auto_refresh = false;

        $('#view-uucss-log, #status-view-uucss-log').click(function (e) {
            e.preventDefault();
            $.featherlight('<div class="spinner loading"></div><div class="uucss-logs-content"><table id="uucss-logs-table" width="100%" class="hover"></table>' +
                '<input type="button" class="button button-primary clear-uucss-log" id="clear-uucss-log" value="Clear Logs"></div>', {
                variant : 'uucss-log',
                afterClose: function(_super, event) {
                    if(log_interval){
                        clearInterval(log_interval);
                    }
                }
            });
            $('#clear-uucss-log').click(function () {
                wp.ajax.post('clear_uucss_logs',{ nonce : uucss_global.nonce }).then(function (i) {
                    if(i){
                        $table.ajax.reload(null, false);
                    }
                });
            });

            updateUucssLogs();
        });

        function updateUucssLogs(){

            $table = $('#uucss-logs-table');

            $table.on('init.dt', function () {
                log_interval = setInterval(function () {
                    if(auto_refresh){
                        $table.ajax.reload(null, false);
                    }
                }, 1000 * 5)
            });

            $table.on('error.dt', function(e, settings, techNote, message){
                $.uucss_log({
                    log : message,
                })
            });

            $table.on('draw.dt', function (x,y) {

                $('.featherlight.uucss-log .spinner.loading').remove();

                var input = '<div class="uucss-log-search-wrap"><input type="search" placeholder="Search" value="'+ url_filter +'"><input class="uucss_log_search_exact" type="checkbox" id="uucss_log_search_exact" value="1"></div>';
                $(input).prependTo($('#uucss-logs-table_info'));

                var element = '<div id="uucss-auto-refresh-logs">' +
                    '<input type="checkbox" id="uucss_auto_refresh_logs" name="uucss_auto_refresh_logs" value="1">' +
                    '<label for="uucss_auto_refresh_logs"> Auto Refresh</label><br>' +
                    '<div>';

                $('#uucss-logs-table_info').append(element);

                $('#uucss_auto_refresh_logs').change(function () {
                    auto_refresh = $(this).is(':checked');
                });

                $('#uucss_auto_refresh_logs').prop('checked', auto_refresh);

                var select = $('<select class="uucss-log-type">' +
                    '<option value="" ' + (status_filter === ''? 'selected' : '') +'>All</option>' +
                    '<option value="general" ' + (status_filter === 'general'? 'selected' : '') + '>General</option>' +
                    '<option value="uucss-cron" ' + (status_filter === 'uucss-cron'? 'selected' : '') + '>Cron</option>' +
                    '<option value="injection" ' + (status_filter === 'injection'? 'selected' : '') + '>Injection</option>' +
                    '<option value="purging" ' + (status_filter === 'purging'? 'selected' : '') + '>Purge</option>' +
                    '<option value="queued" ' + (status_filter === 'queued'? 'selected' : '') + '>Queue</option>' +
                    '<option value="store" ' + (status_filter === 'store'? 'selected' : '') + '>Store</option>' +
                    '<option value="frontend" ' + (status_filter === 'frontend'? 'selected' : '') + '>Frontend</option>' +
                    '<option value="debug" ' + (status_filter === 'debug'? 'selected' : '') + '>Debug</option>' +
                    '</select>');

                $(select).prependTo($('#uucss-logs-table_info'));

                $('#uucss-logs-table_info select.uucss-log-type').on('change', function(){
                    status_filter = $(this).val();
                    $table.column(1).search( status_filter ? '^'+ status_filter +'$' : '', true, false )
                        .draw();
                });

                var $input = $('#uucss-logs-table_info input[type="search"]')
                var $exact_search = $('#uucss-logs-table_info input.uucss_log_search_exact')

                $input.on('input',function () {
                    url_filter = $(this).val();

                    var regex = url_filter;

                    if(exact_search_val){
                        regex = '^' + url_filter + '$';
                    }

                    $table.column(2).search( url_filter ? regex : '', true, false )
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

            $table = $table.DataTable({
                ajax : {
                    url: wp.ajax.settings.url + '?action=uucss_logs',
                    data: function (d) {
                        d.nonce = uucss_global.nonce
                        return d;
                    },
                    dataSrc: function (i) {
                        var data = i.data.reverse();
                        data = data.map(function (value) {
                            return{
                                url : value.url ? value.url : '',
                                log : value.log ? value.log : '',
                                time : value.time,
                                type : value.type
                            }
                        });
                        return data;
                    }
                },
                scrollY: '340px',
                searching: true,
                pagingType: "simple",
                bLengthChange: false,
                tfoot: false,
                bSort: false,
                columns: [
                    {
                        data: 'time',
                        title: "Time",
                        width: '120px',
                        render: function (data, type, row, meta) {
                            return new Date(data * 1000).toLocaleDateString() + ' ' + new Date(data * 1000).toLocaleTimeString()
                        }
                    },
                    {
                        data: 'type',
                        title: "Type",
                        width: '50px',
                    },
                    {
                        data: 'url',
                        title: "URL",
                        render: function (data, type, row, meta) {
                            return '<a href="' + decodeURI(data) +'" target="_blank">'+ decodeURI(data) +'</a>'
                        }
                    },
                    {
                        data: 'log',
                        title: "Log",
                        render: function (data, type, row, meta) { //found_css_cache_files , found_css_files , injected_css_files
                            if(isJSON(data)){
                                var parsedLog = JSON.parse(data);
                                var $content = $('<div class="log-content"></div>');
                                $content.append('<p>Successfully Injected : <span>'+ parsedLog.successfully_injected +'</span></p>');
                                $content.append('<p>Parsed Html : <span>'+ parsedLog.parsed_html +'</span></p>');
                                $content.append('<p>Found Sheets : <span>'+ parsedLog.found_sheets +'</span></p>');
                                $content.append('<p>Found CSS Files :</p>');

                                var $found_css_files = $('<ul class="log-found-css-files"></ul>');
                                $.each(parsedLog.found_css_files, function (index, value) {
                                    $found_css_files.append('<li><a href="'+ value+'" target="_blank">'+ value +'</a></li>')
                                });
                                $content.append($found_css_files.wrap('<div></div>').parent().html());

                                $content.append('<p>Found CSS Cache Files :</p>');

                                var $found_css_cache_files = $('<ul class="log-found-css-cache-files"></ul>');
                                $.each(parsedLog.found_css_cache_files, function (index, value) {
                                    $found_css_cache_files.append('<li><a href="'+ value+'" target="_blank">'+ value +'</a></li>')
                                });
                                $content.append($found_css_cache_files.wrap('<div></div>').parent().html());

                                $content.append('<p>Injected CSS Files :</p>');

                                var $injected_css_files = $('<ul class="log-injected-css-cache-files"></ul>');
                                $.each(parsedLog.injected_css_files, function (index, value) {
                                    $injected_css_files.append('<li><a href="'+ value+'" target="_blank">'+ value +'</a></li>')
                                });
                                $content.append($injected_css_files.wrap('<div></div>').parent().html());

                                return $content.wrap('<div></div>').parent().html();
                            }else{
                                return  data;
                            }
                        }
                    },

                ],
            })
        }

        function isJSON(str) {
            try {
                return (JSON.parse(str) && !!str);
            } catch (e) {
                return false;
            }
        }

    })


}(jQuery))