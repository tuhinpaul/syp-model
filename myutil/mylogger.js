"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MyLogger {
    constructor(enabled = true) {
        /* you may enable/disable logging */
        this.isEnabled = null;
        this.isEnabled = enabled;
    }
    newline() {
        console.log();
    }
    log(x) {
        if (!this.isEnabled)
            return;
        // If no argument is provided
        if (typeof (x) == 'undefined')
            return console.log();
        else
            return console.log(x);
    }
    // adds an extra newline
    logln(x) {
        if (!this.isEnabled)
            return;
        this.log(x);
        this.newline();
    }
}
exports.default = MyLogger;
