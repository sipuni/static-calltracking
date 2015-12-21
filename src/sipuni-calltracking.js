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

    var type = {

        isArray: Array.isArray || function(o) {
            return (
                typeof o === 'object' && Object.prototype.toString.call(o) === '[object Array]'
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


    var cookies = {

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

        set: function (c_name, value, exdays) {
            var exdate = new Date();
            exdate.setDate(exdate.getDate() + exdays);
            var c_value = encodeURIComponent(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
            var top_domain = cookies.topDomain(window.location.hostname);
            var cookie = c_name + "=" + c_value + "; path=/" + "; domain=" + (top_domain ? '.'+top_domain : '');
            console.log(cookie);
            document.cookie = cookie;
        },

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

        delete: function (c_name){
            ct_set_cookie(c_name, null, -10);
        }

    };

    return function(params) {

    };

}));