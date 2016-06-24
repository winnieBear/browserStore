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

   // http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/

   var counter = 0; // a counter for element id's and whatnot

   var reNamespace = /[^a-z0-9_\/]/ig; //a regex to find anything that's not letters, numbers underscore and forward slash
   var reId = /[^a-z0-9_]/ig; // same as above except no forward slashes
   /**
    * SwfStore constructor - creates a new SwfStore object and embeds the .swf into the web page.
    *
    * usage:
    * var mySwfStore = new SwfStore({
    *   namespace: "my_cool_app",
    *   swf_url: "http://example.com/path/to/storage.swf",
    *   policyVer: 1,
    *   onready: function() {
    *     console.log('ready!', mySwfStore.get('my_key'));
    *   },
    *   onerror: function() {
    *     console.error('SwfStore failed to load :(');
    *   }
    * });
    *
    * @param {object} config
    * @param {string} [config.swf_url=storage.swf] - Url to storage.swf. Must be an absolute url (with http:// and all) to work cross-domain
    * @param {functon} [config.onready] Callback function that is fired when the SwfStore is loaded. Recommended.
    * @param {function} [config.onerror] Callback function that is fired if the SwfStore fails to load. Recommended.
    * @param {string} [config.namespace="SwfStore"] The namespace to use in both JS and the SWF. Allows a page to have more than one instance of SwfStore.
    * @param {integer} [config.timeout=10] The number of seconds to wait before assuming the user does not have flash.
    * @param {boolean} [config.debug=false] Is debug mode enabled? If so, mesages will be logged to the console and the .swf will be rendered on the page (although it will be an empty white box unless it cannot communicate with JS. Then it will log errors to the .swf)
    */
   function SwfStore(config) {
       // make sure we have something of a configuration
       config = config || {};
       var defaults = {
           swf_url: 'storage.swf', // this should be a complete protocol-relative url (//example.com/path/to/storage.swf) for cross-domain, cross-protocol usage
           namespace: 'SwfStore',
           policyVer: 1,
           debug: false,
           timeout: 10, // number of seconds to wait before concluding there was an error
           onready: null,
           onerror: null
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

       if (window.SwfStore[config.namespace]) {
           throw "There is already an instance of SwfStore using the '" + config.namespace + "' namespace. Use that instance or specify an alternate namespace in the config.";
       }

       this.config = config;

       // a couple of basic timesaver functions
       function id() {
           return "SwfStore_" + config.namespace.replace(reId, "_") + "_" + (counter++);
       }

       function div(visible) {
           var d = document.createElement('div');
           document.body.appendChild(d);
           d.id = id();
           if (!visible) {
               // setting display:none causes the .swf to not render at all
               d.style.position = "absolute";
               d.style.top = "-2000px";
               d.style.left = "-2000px";
           }
           return d;
       }

       // get a logger ready
       var logFun = log$1(config.debug,'SwfStore-' + config.namespace);
       this.log = function(type, source, msg){
           source = (source === 'SwfStore') ? 'swf' : source;
           logFun(type,source,msg);
       } 

       this.log('info', 'js', 'Initializing...');

       // the callback functions that javascript provides to flash must be globally accessible
       SwfStore[config.namespace] = this;

       var swfContainer = div(config.debug);

       var swfName = id();

       var flashvars = "namespace=" + encodeURIComponent(config.namespace) + '&policyVer=' + config.policyVer;

       swfContainer.innerHTML = '<object height="100" width="500" codebase="https://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab" id="' +
           swfName + '" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">' +
           '   <param value="' + config.swf_url + '" name="movie">' +
           '   <param value="' + flashvars + '" name="FlashVars">' +
           '   <param value="always" name="allowScriptAccess">' +
           '   <embed height="375" align="middle" width="500" pluginspage="https://www.macromedia.com/go/getflashplayer" ' +
           'flashvars="' + flashvars + '" type="application/x-shockwave-flash" allowscriptaccess="always" quality="high" loop="false" play="true" ' +
           'name="' + swfName + '" bgcolor="#ffffff" src="' + config.swf_url + '">' +
           '</object>';

       this.swf = document[swfName] || window[swfName];

       this._timeout = setTimeout(function() {
           SwfStore[config.namespace].onerror(new Error(config.swf_url + ' failed to load within ' + config.timeout + ' seconds.'), 'js');
       }, config.timeout * 1000);
   }

   // we need to check everything we send to flash because it can't take functions as arguments
   function checkData(data) {
       if (typeof data === "function") {
           throw new Error('SwfStore Error: Functions cannot be used as keys or values.');
       }
   }

   SwfStore.prototype = {

       /**
        * This is an indicator of whether or not the SwfStore is initialized.
        * Use the onready and onerror config options rather than checking this variable.
        */
       ready: false,

       /**
        * Sets the given key to the given value in the swf
        * @param {string} key
        * @param {string} value
        */
       set: function(key, value) {
           this._checkReady();
           checkData(key);
           checkData(value);
           if (value === null || typeof value == "undefined") {
               this.swf.clear(key);
           } else {
               this.swf.set(key, value);
           }
       },

       /**
        * Retrieves the specified value from the swf.
        * @param {string} key
        * @return {string} value
        */
       get: function(key) {
           this._checkReady();
           checkData(key);
           //this.log('debug', 'js', 'Reading ' + key);
           var v = this.swf.get(key);
           return v === null ? undefined : v;
       },

       /**
        * Retrieves all stored values from the swf.
        * @return {object}
        */
       getAll: function() {
           this._checkReady();
           var pairs = this.swf.getAll();
           var data = {};
           for (var i = 0, len = pairs.length, pair; i < len; i++) {
               pair = pairs[i];
               data[pair.key] = pair.value;
           }
           return data;
       },

       clearAll: function() {
           var all = this.getAll();
           for (var key in all) {
               if (all.hasOwnProperty(key)) {
                   this.clear(key);
               }
           }
       },

       /**
        * Delete the specified key from the swf
        *
        * @param {string} key
        */
       clear: function(key) {
           this._checkReady();
           checkData(key);
           this.swf.clear(key);
       },

       /**
        * We need to run this check before tying to work with the swf
        *
        * @private
        */
       _checkReady: function() {
           if (!this.ready) {
               throw 'SwfStore is not yet finished initializing. Pass a config.onready callback or wait until this.ready is true before trying to use a SwfStore instance.';
           }
       },

       /**
        * This is the function that the swf calls to announce that it has loaded.
        * This function in turn fires the onready function if provided in the config.
        *
        * @private
        */
       onload: function() {
           // deal with scope the easy way
           var that = this;
           // wrapping everything in a timeout so that the JS can finish initializing first
           // (If the .swf is cached in IE, it fires the callback *immediately* before JS has
           // finished executing.  setTimeout(function, 0) fixes that)
           setTimeout(function() {
               clearTimeout(that._timeout);
               try {
                   //回调AS的方法，检测AS是否能调起
                   var canCall = that.swf.callAS();
                   if (canCall) {
                       that.ready = true;
                       that.log('info', 'js', 'swfStore is Ready!')
                       if (that.config.onready) {
                           that.config.onready.call(that);
                       }
                   }
               } catch (e) {
                   //调不起AS，虽然flash已经ready，但是是不可用的
                   that.log('warn', 'js', 'flash is ready,but can not call AS method, maybe your DOMAIN is NOT add into policy.txt.');
               }

           }, 0);
       },
       checkCrossDomain: function() {
           this.log('info', 'js', 'js checkCrossDomain is called ...')
           var crossDomain = false;
           var swfUrl = this.config.swf_url;
           if ((/http:\/\//i).test(swfUrl) && swfUrl.indexOf(window.location.host) == -1) {
               crossDomain = true;
           }
           return crossDomain;
       },


       /**
        * If the swf had an error but is still able to communicate with JavaScript, it will call this function.
        * This function is also called if the time limit is reached and flash has not yet loaded.
        * This function is most commonly called when either flash is not installed or local storage has been disabled.
        * If an onerror function was provided in the config, this function will fire it.
        *
        * @private
        */
       onerror: function(err, source) {
           clearTimeout(this._timeout);
           if (!(err instanceof Error)) {
               err = new Error(err);
           }
           this.log('error', source || 'swf', err.message);
           if (this.config.onerror) {
               this.config.onerror(err);
           }
       }
   };

   //暴露全局变量给flash调用
   window.SwfStore = SwfStore;

   var reNamespace$1 = /[^a-z0-9_\/]/ig; //a regex to find anything that's not letters, numbers underscore and forward slash
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
       config.namespace = config.namespace.replace(reNamespace$1, '_');

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

   var reNamespace$2 = /[^a-z0-9_\/]/ig; //a regex to find anything that's not letters, numbers underscore and forward slash

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
       config.namespace = config.namespace.replace(reNamespace$2, '_');

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

   var flashStoreConfig = {
       namespace: baseConfig.namespace, // 命名空间
       debug: baseConfig.debug,
       swf_url: 'http://localhost/dist/storage.swf?v=1', //swf文件的url
       policyVer: 2, //poclicy文件的版本号
       onready: function() {
           //ready to do 	
           //flash存储get/set需要等flash对象加载完成之后才能调用,如果你init之后就要get/set，就需要放在这个函数里操作
           // console.log('get aaa:',this.get('aaa'));
           //this.set('xxx','this is xxxx'); 
       },
       onerror: function() {
           // in case we had an error. (The most common cause is that the user disabled flash cookies.)
       }
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
   var arrEng = [
   {
   	name:'flashStore',
   	engin:SwfStore,
   	config:flashStoreConfig
   },{
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