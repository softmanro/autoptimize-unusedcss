<?php


abstract class RapidLoad_DB
{
    use RapidLoad_Utils;

    static $db_version = "1.3";
    static $db_option = "rapidload_migration";
    static $current_version = "1.3";

    static function initialize_site($new_site, $args){

        if(!isset($new_site)){
            return;
        }

        $error = self::create_tables($new_site->blog_id . '_');

        if(empty($error)){
            UnusedCSS_Admin::update_site_option( self::$db_option, self::$db_version );
        }
    }

    static function uninitialize_site($old_site){

        if(!isset($old_site)){
            return;
        }

        self::drop();
    }

    static function drop(){
        global $wpdb;

        $tableArray = [
            $wpdb->prefix . "rapidload_uucss_job",
            $wpdb->prefix . "rapidload_uucss_rule",
            $wpdb->prefix . "rapidload_job",
            $wpdb->prefix . "rapidload_job_data",
        ];

        foreach ($tableArray as $tablename) {
            $wpdb->query("DROP TABLE IF EXISTS $tablename");
        }

        if(empty($wpdb->last_error)){

            UnusedCSS_Admin::delete_site_option(self::$db_option);

        }

    }

    static function create_tables($blog_id = ''){
        global $wpdb;

        $rapidload_uucss_job = $wpdb->prefix . $blog_id . 'rapidload_uucss_job';
        $rapidload_uucss_rule = $wpdb->prefix . $blog_id . 'rapidload_uucss_rule';
        $rapidload_job = $wpdb->prefix . $blog_id . 'rapidload_job';
        $rapidload_job_data = $wpdb->prefix . $blog_id . 'rapidload_job_data';

        require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );

        if(self::$current_version < 1.1 && in_array($blog_id . 'rapidload_uucss_job', $wpdb->tables)){
            $index = 'url';
            $wpdb->query( "ALTER TABLE `$rapidload_uucss_job` DROP INDEX `$index`" );
        }

        $sql = "CREATE TABLE $rapidload_uucss_job (
		id INT NOT NULL AUTO_INCREMENT,
		job_id INT NULL,
		rule longtext NULL,
		url longtext NOT NULL,
		stats longtext NULL,
		files longtext NULL,
		warnings longtext NULL,
		review longtext NULL,
		error longtext NULL,
		attempts mediumint(2) NULL DEFAULT 0,
		hits mediumint(3) NULL DEFAULT 0,
		rule_id INT NULL,
		rule_note longtext NULL,
		status varchar(15) NOT NULL,
		created_at TIMESTAMP NOT NULL DEFAULT NOW(),
		PRIMARY KEY  (id)
	) ;
	    CREATE TABLE $rapidload_uucss_rule (
		id INT NOT NULL AUTO_INCREMENT,
		job_id INT NULL,
		rule longtext NOT NULL,
		url longtext NOT NULL,
		regex longtext NOT NULL,
		stats longtext NULL,
		files longtext NULL,
		warnings longtext NULL,
		review longtext NULL,
		error longtext NULL,
		attempts mediumint(2) NULL,
		hits mediumint(3) NULL,
		status varchar(15) NOT NULL,
		created_at TIMESTAMP NOT NULL DEFAULT NOW(),
		PRIMARY KEY  (id)
	) ;
	    CREATE TABLE $rapidload_job (
		id INT NOT NULL AUTO_INCREMENT,
		url longtext NOT NULL,
		rule longtext NOT NULL,
		regex longtext NOT NULL,
		rule_id INT NULL,
		rule_note longtext NULL,
		status varchar(15) NULL,
		created_at TIMESTAMP NOT NULL DEFAULT NOW(),
		PRIMARY KEY  (id)
	) ;
	    CREATE TABLE $rapidload_job_data (
		id INT NOT NULL AUTO_INCREMENT,
		job_id INT NOT NULL,
		job_type varchar(15) NOT NULL,
		queue_job_id INT NULL,
		data longtext NULL,
		stats longtext NULL,
		warnings longtext NULL,
		error longtext NULL,
		attempts mediumint(2) NULL,
		hits mediumint(3) NULL,
		status varchar(15) NOT NULL,
		created_at TIMESTAMP NOT NULL DEFAULT NOW(),
		PRIMARY KEY  (id)            
	) ;";

        dbDelta( $sql );
        return $wpdb->last_error;
    }

    static function check_db_updates(){

        self::$current_version = UnusedCSS_Admin::get_site_option( self::$db_option );

        add_action( 'wp_initialize_site', [get_called_class(), 'initialize_site'] , 10 , 2);

        add_action('wp_uninitialize_site', [get_called_class(), 'uninitialize_site'], 10, 1);

        if (self::$current_version  < self::$db_version ) {
            $notice = [
                'action'  => 'rapidload-db-update',
                'title'   => 'RapidLoad Power Up',
                'message' => 'Migrate your database to the latest version to enjoy optimized data handling.',

                'main_action' => [
                    'key'   => 'Update Database',
                    'value' => '#'
                ],
                'type'        => 'warning'
            ];
            self::add_advanced_admin_notice($notice);
            add_action( "wp_ajax_rapidload_db_update", 'RapidLoad_DB::update_db' );
        }

    }

    static function update_db(){

        if ( self::$current_version < self::$db_version ) {

            try{
                $status = self::create_tables();

                if(!empty($status)){
                    wp_send_json_error(array(
                        'error' => $status
                    ));
                }

                if(self::$current_version < 1.3){
                    self::seed();
                }

                UnusedCSS_Admin::update_site_option( self::$db_option, self::$db_version );

                wp_send_json_success([
                    'db_updated' => true
                ]);

            }catch(Exception $e){
                wp_send_json_error(null);
            }

        }

    }

    static function seed(){

        global $wpdb;

        $wpdb->query("INSERT INTO {$wpdb->prefix}rapidload_job (url, rule, regex, created_at, status) 
        SELECT url, rule, regex, created_at, 'processing' AS status FROM {$wpdb->prefix}rapidload_uucss_rule");

        $wpdb->query("INSERT INTO {$wpdb->prefix}rapidload_job (url, rule, regex, rule_id, created_at, status) 
        SELECT url, 'is_url' as rule, '/' as regex, rule_id, created_at, 'processing' AS status FROM {$wpdb->prefix}rapidload_uucss_job WHERE status NOT IN ('rule-based')");

    }

    static function migrated(){
        $option = UnusedCSS_Admin::get_site_option(self::$db_option);
        return isset($option) && !empty($option );
    }

    static function show_db_error($message){
        self::log([
            'log' => $message,
            'type' => 'general',
            'url' => get_site_url()
        ]);
    }

    static function initialize(){
        $error = self::create_tables();

        if(!empty($error)){
            self::show_db_error($error);
            return;
        }

        UnusedCSS_Admin::update_site_option( self::$db_option, self::$db_version );
        UnusedCSS_Admin::delete_site_option(RapidLoad_Settings::$map_key );
    }

    static function get_rule_names(){

        global $wpdb;

        $names = $wpdb->get_results("SELECT DISTINCT rule FROM {$wpdb->prefix}rapidload_job WHERE rule NOT IN('is_url')", ARRAY_A);

        $error = $wpdb->last_error;

        if(!empty($error)){
            self::show_db_error($error);
        }

        return array_column($names, 'rule');
    }

    static function get_applied_rule($rule, $url){

        $rules = self::get_rules_where("WHERE rule = '" . $rule . "'");
        $applied_rule = false;

        foreach ($rules as $rule){
            if(self::is_url_glob_matched($url,$rule->regex)){
                $applied_rule = $rule;
                break;
            }
        }

        return $applied_rule;
    }

    static function get_rules_where($where = ''){

        global $wpdb;

        if(!empty($where)){
            $where .= " AND rule NOT IN ('is_url') ";
        }else{
            $where = " WHERE rule NOT IN ('is_url') ";
        }

        $rules = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}rapidload_job {$where} ORDER BY id DESC ", OBJECT);

        $error = $wpdb->last_error;

        if(!empty($error)){
            self::show_db_error($error);
        }

        return $rules;
    }

    static function rule_exists_with_error($rule, $regex = '/'){
        global $wpdb;

        $result = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}rapidload_job WHERE rule = '" . $rule . "' AND regex = '" . $regex . "'", OBJECT);

        $error = $wpdb->last_error;

        if(!empty($error)){
            self::show_db_error($error);
        }

        return isset($result) && !empty($result);
    }

    static function get_data_by_status($status, $limit = 1, $order_by = 'id DESC'){

        global $wpdb;

        $status = implode(",", $status);

        $status = str_replace('"', '', $status);

        $data = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}rapidload_job_data WHERE status IN(" . $status . ") ORDER BY {$order_by} LIMIT " . $limit, OBJECT);

        $error = $wpdb->last_error;

        if(!empty($error)){
            self::show_db_error($error);
        }

        $transformed_links = array();

        if(!empty($data)){

            foreach ($data as $value){

                array_push($transformed_links, $value);

            }

        }

        return $transformed_links;
    }

    static function clear_jobs(){

        global $wpdb;

        $wpdb->query( "DELETE FROM {$wpdb->prefix}rapidload_job ");

        $error = $wpdb->last_error;

        if(!empty($error)){
            self::show_db_error($error);
        }

    }
}