var ppStore = (function () {
   'use strict';

   function log$1(debug, logTag) {
       logTag = logTag || 'LOG';
       var Log;
       var console = window.console;
       if (typeof console === "undefined") {
           Log = function() {};
       } else {
           Log = function(type, source, msg) {
               if (debug) {
                   if (arguments.length === 3) {
                       source = '(' + source + ')';
                   } else {
                       msg = source;
                       source = '';
                   }
                   // only output to log if debug is currently enabled
                   if (typeof(console[type]) !== "undefined") {
                       console[type](logTag + source + ':' + msg);
                   } else {
                       console.log(logTag + source + "[" + type + ']: ' + msg);
                   }
               }
           };

       }
       return Log;
   }

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
       this.log = log$1(config.debug,'localStore-' + config.namespace); 

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

   var reNamespace$1 = /[^a-z0-9_\/]/ig; //a regex to find anything that's not letters, numbers underscore and forward slash

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
       config.namespace = config.namespace.replace(reNamespace$1, '_');

       this.keyPre = config.namespace + '_';

       this.config = config;

       this.log = log$1(config.debug, 'CookieStore-' + config.namespace);

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

   var baseConfig = {
       namespace: 'ppStore',
       //debug为true是会打印所有的日志信息，线上关闭debug
       debug: true
   };

   var localStoreConfig = {
       namespace: baseConfig.namespace,
       debug: baseConfig.debug
   };

   var cookieStoreConfig = {
       namespace: baseConfig.namespace,
       debug: baseConfig.debug,
       path: '/',
       domain: '.58.com',
       //cookie保留的天数，例如10年为10*365
       expires: 10 * 365
   };

   function getStore(arrEng, log) {
       var allEngIns = {};
       for (var i = 0, len = arrEng.length; i < len; i++) {
           var name = arrEng[i].name;
           var storeEngin = arrEng[i].engin;
           var config = arrEng[i].config;
           allEngIns[name] = new storeEngin(config);
       }
       var store = {
           set: function(key, val) {
               for (var name in allEngIns) {
                   var engin = allEngIns[name];
                   if (engin.ready) {
                       engin.set(key, val);
                   } else {
                       log('info', 'store[' + name + '] is not ready when setting.');
                   }
               }
           },
           get: function(key) {
               var ret = {};
               for (var name in allEngIns) {
                   var engin = allEngIns[name];
                   if (engin.ready) {
                       ret[name] = engin.get(key);
                   } else {

                       ret[name] = '';
                   }
               }
               return ret;
           },
           clear: function(key) {
               for (var name in allEngIns) {
                   var engin = allEngIns[name];
                   if (engin.ready) {
                       engin.clear(key);
                   } else {
                       log('info', 'store[' + name + '] is not ready when clearing.');
                   }
               }
           }

       };
       return store;

   }

   var log = log$1(baseConfig.debug,baseConfig.namespace);

   log('info','store Initializing ---');

   var arrEng = [{
   	name:'localStore',
   	engin:LocalStore,
   	config:localStoreConfig
   },{
   	name:'cookieStore',
   	engin:CookieStore,
   	config:cookieStoreConfig
   }];

   var store = getStore(arrEng,log);

   log('info','store Initializing end.')

   return store;

}());