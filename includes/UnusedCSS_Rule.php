<?php

defined( 'ABSPATH' ) or die();

class UnusedCSS_Rule extends UnusedCSS_Job {

    use UnusedCSS_Utils;

    public $regex;

    public function init($args){

        global $wpdb;

        $rule = isset($args['rule']) ? $args['rule'] : null;
        $url = isset($args['url']) ? $args['url'] : null;
        $regex = isset($args['regex']) ? $args['regex'] : null;

        $rule_current = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}rapidload_uucss_rule where rule = '" . $rule . "' AND regex = '" . $regex . "'", OBJECT);

        if(isset($rule_current) && !empty($rule_current)){

            $this->id = $rule_current[0]->id;
            $this->url = $rule_current[0]->url;
            $this->rule = $rule_current[0]->rule;
            $this->regex = $rule_current[0]->regex;
            $this->job_id = $rule_current[0]->job_id;
            $this->stats = $rule_current[0]->stats;
            $this->files = $rule_current[0]->files;
            $this->warnings = $rule_current[0]->warnings;
            $this->review = $rule_current[0]->review;
            $this->error = $rule_current[0]->error;
            $this->attempts = $rule_current[0]->attempts;
            $this->hits = $rule_current[0]->hits;
            $this->status = $rule_current[0]->status;
            $this->created_at = $rule_current[0]->created_at;

        }else{

            $this->url = $url;
            $this->rule = $rule;
            $this->regex = $regex;
            $this->status = isset($args['status']) ? $args['status'] : 'queued';
            $this->attempts = 0;
            $this->hits = 0;
            $this->created_at = date( "Y-m-d H:m:s", time() );

            $data = (array) $this;

            unset($data['type']);

            $wpdb->insert(
                $wpdb->prefix . 'rapidload_uucss_rule',
                $data
            );

            $id = $wpdb->get_var("SELECT id FROM {$wpdb->prefix}rapidload_uucss_rule where rule = '" . $rule . "'");

            if(isset($id) && !empty($id)){

                $this->id = $id;
            }
        }
    }

    public function save(){

        if(isset($this->id)){

            global $wpdb;

            $data = (array) $this;

            $id = $data['id'];

            unset($data['id']);
            unset($data['type']);

            $wpdb->update(
                $wpdb->prefix . 'rapidload_uucss_rule',
                $data,
                [
                    'id' => $id
                ]
            );

        }
    }

    public static function get_rules(){
        return apply_filters('uucss/rules', []);
    }

    public static function get_related_rule(){

        $rules = apply_filters('uucss/rules', []);

        $related_rule = false;

        foreach ($rules as $rule){

            if(isset($rule['callback']) && $rule['callback']){

                $related_rule = $rule;
                break;
            }
        }

        return $related_rule;
    }
}