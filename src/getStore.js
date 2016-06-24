'use strict';
export default function getStore(arrEng, log) {
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
