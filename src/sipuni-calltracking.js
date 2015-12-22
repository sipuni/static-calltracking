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
    var default_params = {
        targets: '.ct_phone',
        default_value: null,
        callback: null,
        sources: {
            'organic':{'ref':/(google|yandex|rambler|bing|yahoo)/ig},
            'social':{'ref':/(twitter|facebook|linkedin|vk\.com|odnoklassniki)/ig},
            'email':{'utm_source':'email'}
        }
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
                    dict_dst[prop] = dict.update(dict_dst[prop], v);
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
        }

    };

    var core = {

        go: function(placer, targets, params) {

            //console.log(placer, targets, params);
            return;

            var terms = params.conditions;

            for (var i = 0; i < terms.length; i++) {

                if (this.isIncompatibleArrays(terms[i].check, terms[i].when)) continue;

                if (this.isCompatibleArrays(terms[i].check, terms[i].when)) {
                    var place_it = false;
                    for (var ii = 0; ii < terms[i].check.length; ii++) {
                        if (this.isMatch(terms[i].check[ii], terms[i].when[ii])) {
                            place_it = true;
                        } else {
                            place_it = false;
                            break;
                        }
                    }
                    if (place_it) {
                        placer(targets, terms[i].place);
                        this.execCallback(params.callback, terms[i].check, terms[i].when, terms[i].place);
                        return true;
                    }
                }

                if (this.isMatch(terms[i].check, terms[i].when)) {
                    placer(targets, terms[i].place);
                    this.execCallback(params.callback, terms[i].check, terms[i].when, terms[i].place);
                    return true;
                }

            }

            // Oops, no match
            placer(targets, params.default_value);
            this.execCallback(params.callback, false, false, params.default_value);
            return true;

        },

        isIncompatibleArrays: function(check, when) {
            return (
                type.isArray(check) && type.isArray(when) && check.length !== when.length
                );
        },

        isCompatibleArrays: function(check, when) {
            return (
                type.isArray(check) && type.isArray(when) && check.length === when.length
                );
        },

        isMatch: function(check, when) {
            return (
                (type.isRegExp(when) && check.match(when)) ||
                    (!type.isRegExp(when) && type.isArray(when) && when.indexOf(check) !== -1) ||
                    (!type.isRegExp(when) && !type.isArray(when) && when === check)
                );
        },

        execCallback: function(cb, check, when, place) {
            if (cb && type.isFunction(cb)) cb(check, when, place);
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

                if( key=='ref' ){
                    subject = src_url;
                    condition = source[key];
                }else if( key.indexOf('utm_')>-1 ){
                    subject = query.getParam(dst_url, key);
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
        }

    };


    return function(user_params, wnd) {

        var updated_params = dict.merge(default_params, user_params);

        var phone = tracker.find(
            updated_params['sources'],
            updated_params['phones'],
            wnd.document.referrer,
            wnd.location.href);

        if(phone === null)
            phone = updated_params['default_phone'];

        console.log('phone', phone);
//        var placer  = actions.place,
//            targets = actions.getTargets(params.targets);
//
//        core.go(placer, targets, params);

    };

}));