"use strict";
export var baseConfig = {
    namespace: 'ppStore',
    //debug为true是会打印所有的日志信息，线上关闭debug
    debug: true
};

export  var flashStoreConfig = {
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

export  var localStoreConfig = {
    namespace: baseConfig.namespace,
    debug: baseConfig.debug
};

export  var cookieStoreConfig = {
    namespace: baseConfig.namespace,
    debug: baseConfig.debug,
    path: '/',
    domain: '.58.com',
    //cookie保留的天数，例如10年为10*365
    expires: 10 * 365
};


