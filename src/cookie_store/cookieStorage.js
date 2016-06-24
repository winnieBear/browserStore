import Log from '../utils/log';

'use strict';

var reNamespace = /[^a-z0-9_\/]/ig; //a regex to find anything that's not letters, numbers underscore and forward slash

function CookieStore(config) {
    // make sure we have something of a configuration
    config = config || {};
    var defaults = {
        namespace: 'CookieStore',
        debug: false,
        path: '/',
        domain: '.58.com',
        expires: 10 * 365
    };
    var key;
    for (key in defaults) {
        if (defaults.hasOwnProperty(key)) {
            if (!config.hasOwnProperty(key)) {
                config[key] = defaults[key];
            }
        }
    }
    config.namespace = config.namespace.replace(reNamespace, '_');

    this.keyPre = config.namespace + '_';

    this.config = config;

    this.log = Log(config.debug, 'CookieStore-' + config.namespace);

    this.log('info', 'Initializing...');

    //检查CookieStore是否能够使用
    var randomKey = Math.random().toString(36).slice(2, 8);
    var testVal = 'test insert val';
    var text = randomKey + '=' + testVal + ';path=' + config.path + ';domain=' + config.domain;
    try {
        document.cookie = text;
        if (document.cookie.indexOf(randomKey) == -1) {
            this.log('warn', 'CookieStore is unusable:can not read store cookie!!!');
            return;
        }
    } catch (e) {
         this.log('warn', 'CookieStore is unusable:' + e.message);
         return;
    }

   
    //CookieStore is ok
    this.ready = true;
    this.log('info', 'CookieStore is ready!');

}
// Helpers

function isString(o) {
    return typeof o === 'string';
}

function isNonEmptyString(s) {
    return isString(s) && s !== '';
}

function same(s) {
    return s;
}
var decode = decodeURIComponent;
var encode = encodeURIComponent;

function trim(str) {
    if (str.trim) return str.trim();
    return str.replace(/^\s*|\s*$/g, '');
}
CookieStore.prototype = {
    /**
     * This is an indicator of whether or not the CookieStore is avaiable .
     */
    ready: false,
    set: function(key, value, options) {
        this._checkReady();
        try {
            options = options || this.config || {};
            var expires = options['expires'];
            if (value === null || typeof value == "undefined") {
                expires = -1;
            }
            key = this.keyPre + key;
            var domain = options['domain'];
            var path = options['path'];

            if (!options['raw']) {
                value = encode(String(value));
            }

            var text = key + '=' + value;

            // expires
            var date = expires;
            if (typeof date === 'number') {
                date = new Date();
                date.setDate(date.getDate() + expires);
            }
            if (date instanceof Date) {
                text += '; expires=' + date.toUTCString();
            }

            // domain
            if (isNonEmptyString(domain)) {
                text += '; domain=' + domain;
            }

            // path
            if (isNonEmptyString(path)) {
                text += '; path=' + path;
            }

            // secure
            if (options['secure']) {
                text += '; secure';
            }
            document.cookie = text;

            this.log('info', 'set key=[' + key + '],val=[' + value + '].');
        } catch (e) {
            this.log('warn', 'set key=[' + key + '],val=[' + value + '] fail:' + e.message);
        }
    },
    get: function(key, options) {
        this._checkReady();
        key = this.keyPre + key;
        options = options || this.config || {};

        try {
            var str = document.cookie;
            var obj = {};
            var pairs = str.split(';');
            var pair;
            var k, v;
            if ('' !== pairs[0]) {
                for (var i = 0; i < pairs.length; ++i) {
                    pair = pairs[i].split('=');
                    k = trim(pair[0]);
                    v = trim(pair[1]);
                    if(k !== key){
                        continue;
                    }
                    obj[k] = options['raw'] ? pair[1] : decode(v);
                }
            }
        } catch (e) {
            this.log('warn', 'get key=[' + key + '] fail:' + e.message);
            if(e.message == 'URI malformed'){
                this.log('warn','cookie value can not decode, return stored value');
                return v;
            }
            return undefined;
        }
        var v = obj[key];
        this.log('info', 'get key=[' + key + '],return value=[' + v + '].');
        return v;
    },
    clear: function(key) {
        this._checkReady();
        this.log('info', 'clear key=[' + key + ']');
        this.set(key, null);
    },

    _checkReady: function() {
        if (!this.ready) {
            throw 'the CookieStore is not available or CookieStore is unusable';
        }
    }

};

export default CookieStore;
