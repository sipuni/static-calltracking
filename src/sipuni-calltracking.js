;(function(root, factory) {

    "use strict";
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.sipuniCalltracking = factory();
    }

}(this, function() {

    "use strict";

    /**
     * Default parameters
     * Those parameters are overridden with user parameters passed during initialization
     */
    var default_options = {
        targets: ['.ct_phone'],
        default_value: null,
        callback: null,
        sources: {
            'organic':{'ref':/(google|yandex|rambler|bing|yahoo)/ig},
            'social':{'ref':/(twitter|facebook|linkedin|vk\.com|odnoklassniki)/ig},
            'email':{'utm_source':'email'}
        },
        cookie_key: 'sipunicts',
        cookie_ttl_days: 30*3
    };

    /**
     * Array.indexOf for old browsers
     */
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(searchElement, fromIndex) {
            if (this == null) throw new TypeError('"this" is null or not defined');       // jshint ignore:line
            var O = Object(this);
            var len = O.length >>> 0;                                                     // jshint ignore:line
            if (len === 0) return -1;
            var n = +fromIndex || 0;
            if (Math.abs(n) === Infinity) n = 0;
            if (n >= len) return -1;
            var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
            while (k < len) {
                if (k in O && O[k] === searchElement) return k;
                k++;
            }
            return -1;

        };
    }

    /**
     * querySelectorAll for old browsers
     */
    var select = document.querySelectorAll || function(selector) {
        var style = document.styleSheets[0] || document.createStyleSheet();
        style.addRule(selector, 'foo:bar');
        var all = document.all, resultSet = [];
        for (var i = 0, l = all.length; i < l; i++) {
            if (all[i].currentStyle.foo === 'bar') resultSet[resultSet.length] = all[i];
        }
        style.removeRule(0);
        return resultSet;

    };

    /**
     * Type detection methods
     */
    var type = {

        isArray: Array.isArray || function(o) {
            return (
                typeof o === 'object' && Object.prototype.toString.call(o) === '[object Array]'
                );
        },

        isDictionary: Array.isArray || function(o) {
            return (
                typeof o === 'object' && Object.prototype.toString.call(o) === '[object Object]'
                );
        },

        isRegExp: function(o) {
            return (
                Object.prototype.toString.call(o) === '[object RegExp]'
                );
        },

        isFunction: function(o) {
            return (
                typeof o === 'function' && Object.prototype.toString.call(o) === '[object Function]'
                );
        }

    };

    /**
     * Query related methods
     */
    var query = {

        /**
         * Returns a value of query string parameter
         * @param url url with query string, or just query string part
         * @param name query parameter name
         * @returns a string with parameter value or null of no parameter exist
         */
        getParam: function(url, name){
            var regex = new RegExp(name+"=([^&]+)");
            var found = regex.exec(url);
            return (found !== null?decodeURIComponent(found[1]).toLowerCase():null);
        }

    };

    /**
     * Cookie related methods
     */
    var cookies = {

        /**
         * Returns a top level domain from a subdomain
         * @param domain string with domain or subdomain
         * @returns top level domain or empty string for the localhost
         */
        topDomain: function(domain) {
            if (!domain) {
                return null;
            }
            var parts = domain.split('.');
            if (parts.length > 1) {
                var result = parts[ parts.length - 2 ] + '.' + parts[ parts.length - 1 ];
                if (result.indexOf(':') + 1){
                    return result.substr(0, result.length-5)
                }
                else {
                    return result
                }
            }
            return '';
        },

        /**
         * Sets a cookie
         * @param c_name cookie name
         * @param value cookie value
         * @param exdays cookie duration in days. put here null for the session only cookie
         */
        set: function (c_name, value, exdays) {
            var exdate = new Date();
            exdate.setDate(exdate.getDate() + exdays);
            var c_value = encodeURIComponent(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
            var top_domain = cookies.topDomain(window.location.hostname);
            var cookie = c_name + "=" + c_value + "; path=/" + "; domain=" + (top_domain ? '.'+top_domain : '');
            console.log(cookie);
            document.cookie = cookie;
        },

        /**
         * Gets a cookie value
         * @param c_name cookie name
         * @returns a string with cookie value or null if no cookie exist
         */
        get: function (c_name){
            var c_value = document.cookie;
            var c_start = c_value.indexOf(" " + c_name + "=");
            if (c_start == -1) {
                c_start = c_value.indexOf(c_name + "=");
            }
            if (c_start == -1) {
                c_value = null;
            }else{
                c_start = c_value.indexOf("=", c_start) + 1;
                var c_end = c_value.indexOf(";", c_start);
                if (c_end == -1) {
                    c_end = c_value.length;
                }
                c_value = decodeURIComponent(c_value.substring(c_start,c_end));
            }
            return c_value;
        },

        /**
         * Deletes a cookie
         * @param c_name cookie name to delete
         */
        delete: function (c_name){
            ct_set_cookie(c_name, null, -10);
        }

    };

    /**
     * Parameters manipulation methods
     */
    var dict = {

        /**
         * Updated one dictionary with the elements of another one.
         * @param dict_dst destination dictionary
         * @param dict_src source dictionary
         */
        update: function  (dict_dst, dict_src) {
            var is_array = type.isArray(dict_src);
            dict_dst = dict_dst || (is_array?[]:{});
            for (var prop in dict_src) {
                var v = dict_src[prop];
                if (type.isDictionary(v)) {
                    dict_dst[prop] = dict.update(null, v);
                } else {
                    dict_dst[prop] = v;
                }
            }
            return dict_dst;
        },

        /**
         * Merges two dictionaries and creates a new dictionary with results.
         * @param dict1 first dictionary
         * @param dict2 second dictionar
         * @returns a new dictionary containing both dictionaries
         */
        merge: function(dict1, dict2){
           var result = {};
           dict.update(result, dict1);
           dict.update(result, dict2);
           return result;
        },

        /**
         * Returns dictionary keys
         * @param dict dictionary to search for
         * @returns an array with keys
         */
        keys: function(dictionary){
            var keys = [];
            for (var key in dictionary) {
                if (dictionary.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
            return keys;
        },

        /**
         * Returns a value from the dictionary or default value
         * @param dictionary
         * @param key
         * @param default_value
         * @returns a value of default_value
         */
        getVal: function(dictionary, key, default_value) {
            if (!dictionary || !dictionary.hasOwnProperty(key))
                return default_value;
            return dictionary[key];
        }

    };


    var actions = {

        place: function(targets, value) {
            for (var i = 0; i < targets.length; i++) {
                targets[i].innerHTML = value;
            }
        },

        getTargets: function(selectors) {
            return select.call(document, selectors);
        },

        execCallback: function(phone, src_url, dst_url, options) {
            var cb = dict.getVal(options, 'callback', null);
            if (cb && type.isFunction(cb)){
                return cb(phone, src_url, dst_url, options);
            }
            return null;
        }

    };

    /**
     * Finds a phone number matching conditions
     */
    var tracker = {

        find: function(sources, phones, src_url, dst_url){

            for (var i=0; i<phones.length; i++){
                var phone = phones[i];
                var src = phone['src'];
                if(sources.hasOwnProperty(src)){
                    if(tracker.match(sources[src], src_url, dst_url)){
                        return phone;
                    }
                }
            }

            return null;
        },

        match: function(source, src_url, dst_url){

            var subject=null;
            var condition = null;
            var keys = dict.keys(source);

            for(var i=0; i<keys.length; i++){

                var key = keys[i];

                if( key.indexOf('utm_')>-1 ){
                    subject = query.getParam(dst_url, key);
                    condition = source[key];
                }else if( key=='ref' ){
                    subject = src_url;
                    condition = source[key];
                }else if( key == 'dst' ){
                    subject = dst_url;
                    condition = source[key];
                }
            }

            if(!subject || !condition){
                return false;
            }

            return (
                (type.isRegExp(condition) && condition.exec(subject)) ||
                (typeof(condition)=='string' && subject.indexOf(condition)>-1) ||
                (type.isFunction(condition) && condition(subject))
            );
        },

        findBySrc: function(phones, src){
            for (var i=0; i<phones.length; i++){
                var phone = phones[i];
                if (phone.hasOwnProperty('src') && phone['src'] == src){
                    return phone;
                }
            }
            return null;
        }

    };


    return function(user_options, wnd) {

        var options = dict.merge(default_options, user_options);
        var phone = null;
        var sources = options['sources'];
        var phones = options['phones'];
        var src_url = wnd.document.referrer;
        var dst_url = wnd.location.href;

        // find from cookies first
        var existing_src = cookies.get(options['cookie_key']);
        if(existing_src && sources.hasOwnProperty(existing_src)){

            phone = tracker.findBySrc(phones, existing_src);

        }

        // find from urls
        if( phone === null ){

            phone = tracker.find(
                sources,
                phones,
                src_url,
                dst_url);

            // store in cookies
            if(phone !== null){
                cookies.set(options['cookie_key'], phone['src'], options['cookie_ttl_days']);
            }
        }

        // use default
        if(phone === null){
            phone = options['default_phone'];
        }

        // insert phone numbers
        if (phone){
            var targets = options['targets'];
            var numbers = phone['phone'];
            for(var i=0, l1=targets.length, l2=numbers.length; i<Math.min(l1, l2); i++){
                var elements = actions.getTargets(targets[i]);
                actions.place(elements, numbers[i]);
            }
        }

        // callback
        actions.execCallback(phone, src_url, dst_url, options);
    };

}));