"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MyLogger {
    constructor() {
    }
    newline() {
        console.log();
    }
    log(x) {
        // If no argument is provided
        if (typeof (x) == 'undefined')
            return console.log();
        else
            return console.log(x);
    }
    // adds an extra newline
    logln(x) {
        this.log(x);
        this.newline();
    }
}
exports.default = MyLogger;
