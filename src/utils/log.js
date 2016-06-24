'use strict';
export default function log(debug, logTag) {
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
