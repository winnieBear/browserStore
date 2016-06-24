import Log from '../utils/log';

'use strict';

var reNamespace = /[^a-z0-9_\/]/ig; //a regex to find anything that's not letters, numbers underscore and forward slash
var LS = window.localStorage;

function LocalStore(config) {
    // make sure we have something of a configuration
    config = config || {};
    var defaults = {
        namespace: 'localStore',
        debug: false
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

    this.keyPre = config.namespace+'_';

    this.config = config;


    // get a logger ready
    this.log = Log(config.debug,'localStore-' + config.namespace); 

    this.log('info', 'Initializing...');

    //检查localstore是否能够使用
    if (!LS) {
        this.log('warn', 'localStorage can not available!');
        return;
    }
    //try insert
    try {
        var randomKey = Math.random().toString(36).slice(2, 8);
        var testVal = 'test insert val';
        LS.setItem(randomKey, testVal);
        LS.removeItem(randomKey);
    } catch (e) {
        this.log('warn', 'localStorage is unusable:' + e.message);
        return;
    }

    //localstore is ok
    this.ready = true;
    this.log('info','localStorage is ready!');

}



LocalStore.prototype = {

    /**
     * This is an indicator of whether or not the localStorage is avaiable .
     */
    ready: false,
    set: function(key, value) {
        this._checkReady();
        if (value === null || typeof value == "undefined") {
            this.clear(key);
        } else {
            try {
                key = this.keyPre + key;
                LS.setItem(key, value);
                this.log('info','set key=[' + key + '],val=['+value+'].');
            } catch (e) {
                this.log('warn', 'set key=[' + key + '] fail:' + e.message);
            }
        }
    },
    get: function(key) {
        this._checkReady();
        try {
            //查询不存在的key时，有的浏览器返回null，这里统一返回undefined
            key = this.keyPre + key;
            var v = LS.getItem(key);
            this.log('info','get key=['+key+'],return value=['+v+'].');
            return v === null ? undefined : v;
        } catch (e) {
            this.log('warn', 'get key=[' + key + '] fail:' + e.message);
            return undefined;
        }
    },
    clear: function(key) {
        this._checkReady();
        try {
            key = this.keyPre + key;
            LS.removeItem(key);
            this.log('info','clear key=['+key+']');
        } catch (e) {
            this.log('warn', 'clear key=[' + key + '] fail:' + e.message);
        }
    },

    _checkReady: function() {
        if (!this.ready) {
            throw 'the localStorage is not available or localStorage is unusable';
        }
    }

};

export default LocalStore;
