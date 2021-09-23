<tr>
    <th scope="row"><?php _e( 'Enable Critical CSS', 'uucss' ); ?></th>
    <td>
        <label><input id='uucss_enable_cpcss' type='checkbox'
                      name='autoptimize_uucss_settings[uucss_enable_cpcss]' <?php if ( ! empty( $options['uucss_enable_cpcss'] ) && '1' === $options['uucss_enable_cpcss'] ) {
                echo 'checked="checked"';
            } ?> value='1' <?php if(!empty(CriticalCSS::$cpcss_other_plugins)) { echo 'disabled'; } ?>>
            <i>
                Enable to eliminate render-blocking CSS on your website and load stylesheets asynchronously.
            </i>
            <a target="_blank" href="https://rapidload.zendesk.com/hc/en-us/articles/4404507967635-Critical-CSS" style="">learn more</a>

            <?php if(!empty(CriticalCSS::$cpcss_other_plugins) && isset(CriticalCSS::$cpcss_other_plugins[0])) :

            ?>
                <p style="color: #f44336"> <span style="line-height: 20px" class="dashicons dashicons-info-outline"></span>CSS render-blocking is currently activated in
                    <strong><?php echo CriticalCSS::$cpcss_other_plugins[0]?></strong>.
                    If you want to use RapidLaod render-blocking, disable option in <strong> <?php echo CriticalCSS::$cpcss_other_plugins[0]?></strong>.
                </p>
            <?php endif; ?>
        </label>
    </td>
</tr>
<tr>
    <th scope="row"><?php _e( 'Additional CSS', 'uucss' ); ?></th>
    <td>
                                    <textarea style="max-width: 390px; width: 100%; height: 150px" id="uucss_additional_css"
                                              name="autoptimize_uucss_settings[uucss_additional_css]" <?php if(!empty(CriticalCSS::$cpcss_other_plugins)) { echo 'disabled'; } ?>>
                                        <?php echo empty( $options['uucss_additional_css'] ) ? '' : $options['uucss_additional_css'] ?></textarea>

    </td>
</tr>