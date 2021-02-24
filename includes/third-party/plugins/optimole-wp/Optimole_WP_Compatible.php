<?php

defined( 'ABSPATH' ) or die();

class Optimole_WP_Compatible extends RapidLoad_ThirdParty {

    function __construct(){

        $this->plugin = 'optimole-wp/optimole-wp.php';
        $this->catgeory = 'cdn';
        $this->name = 'optimole-wp';

        parent::__construct();
    }

    public function init_hooks()
    {
        add_filter( 'uucss/cdn_url', [$this, 'handle'], 10, 1 );
    }

    public function handle($args)
    {
        $converted_url = apply_filters( 'optml_content_url', $args );

        $url = explode('?', $args);

        if(isset($url[1])){
            // add if there any query params
            return $converted_url . '?' . $url[1];
        }

        return $converted_url;
    }
}