# name: dcs-discourse-plugin
# about: a plugin for Discourse
# version: 1.0.0
# authors: Sylvain Quendez

enabled_site_setting :dcs_discourse_plugin_enabled

register_asset "stylesheets/dcs-discourse-plugin.css"

# Changes X-Frame-Options so the site can be embedded in an iframe. See:
# https://github.com/BeXcellent/discourse-allowiframe/blob/master/plugin.rb
# https://github.com/TheBunyip/discourse-allow-same-origin/blob/master/plugin.rb
Rails.application.config.action_dispatch.default_headers.merge!({'X-Frame-Options' => 'ALLOWALL'})

# When styles are not working or are not updating, try:
# - stopping server
# - rm -rf discourse/tmp
# - delete discourse/public/uploads/stylesheet-cache
# - restart server
# If styles are still not updating, there is probably a syntax error in the SCSS causing a silent failure and causing the file not being processed.
# To be 100% sure you can also enable Chrome Dev Tools -> Settings -> General -> Disable cache (while DevTools is open), but note it leads to 30s onload times.
