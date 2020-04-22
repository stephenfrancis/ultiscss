"use strict";
exports.__esModule = true;
var Reporter = /** @class */ (function () {
    function Reporter() {
        this.collector = [];
        this.show_in_console = false;
    }
    Reporter.prototype.addToObject = function (obj, level_selector) {
        if (level_selector === void 0) { level_selector = ">ALL"; }
        var oper = level_selector.substr(0, 1);
        if ((oper === "=") || (oper === "!") || (oper === ">") || (oper === "<")) {
            level_selector = level_selector.substr(1);
        }
        else {
            oper = "=";
        }
        this.collector.forEach(function (item) {
            if (isLevelMatch(level_selector, item.level, oper)) {
                obj[item.level] = obj[item.level] || [];
                obj[item.level].push(item.msg);
            }
        });
    };
    Reporter.prototype.collate = function (level_selector) {
        if (level_selector === void 0) { level_selector = ">ALL"; }
        var out = "";
        var oper = level_selector.substr(0, 1);
        if ((oper === "=") || (oper === "!") || (oper === ">") || (oper === "<")) {
            level_selector = level_selector.substr(1);
        }
        else {
            oper = "=";
        }
        this.collector.forEach(function (item) {
            if ((oper === "=") && (getLevelIndex(level_selector) === getLevelIndex(item.level))) {
                out += item.msg + "\n";
            }
            else if (isLevelMatch(level_selector, item.level, oper)) {
                out += item.level.toUpperCase() + ": " + item.msg + "\n";
            }
        });
        return out;
    };
    Reporter.prototype.count = function (level_selector) {
        if (level_selector === void 0) { level_selector = ">ALL"; }
        if (level_selector === ">ALL") {
            return this.collector.length;
        }
        var oper = level_selector.substr(0, 1);
        if ((oper === "=") || (oper === "!") || (oper === ">") || (oper === "<")) {
            level_selector = level_selector.substr(1);
        }
        else {
            oper = "=";
        }
        return this.collector.reduce(function (prev, curr) {
            return prev + (isLevelMatch(level_selector, curr.level, oper) ? 1 : 0);
        }, 0);
    };
    Reporter.prototype.debug = function (msg) {
        this["do"]("debug", msg);
    };
    Reporter.prototype["do"] = function (level, msg) {
        this.collector.push({
            level: level,
            msg: msg
        });
        if (this.show_in_console) {
            if (typeof console[level] === "function") {
                console[level](msg);
            }
            else {
                console.log(" " + level.toUpperCase() + ": " + msg);
            }
        }
    };
    Reporter.prototype.forEach = function (callback) {
        this.collector.forEach(callback);
    };
    Reporter.prototype.get = function (index, at_level) {
        if (at_level) {
            return this.collector.filter(function (curr) { return (curr.level.toUpperCase() === at_level.toUpperCase()); })[index];
        }
        return this.collector[index];
    };
    Reporter.prototype.info = function (msg) {
        this["do"]("info", msg);
    };
    Reporter.prototype.warn = function (msg) {
        this["do"]("warn", msg);
    };
    Reporter.prototype.error = function (msg) {
        this["do"]("error", msg);
    };
    Reporter.prototype.instancesFound = function (component_id) {
        var out = 0;
        this.collector.forEach(function (item) {
            if ((item.level === "info")
                && (item.msg.indexOf("checking class " + component_id + " at position") === 0)
                && (item.msg.indexOf("against found signature") > -1)) {
                out += 1;
            }
        });
        return out;
    };
    Reporter.prototype.reset = function () {
        this.collector = [];
    };
    Reporter.prototype.showInConsole = function (arg) {
        this.show_in_console = arg;
    };
    return Reporter;
}());
exports["default"] = Reporter;
var levels = [
    "ERROR",
    "WARN",
    "INFO",
    "DEBUG",
    "ALL",
];
function getLevelIndex(level) {
    return levels.indexOf(level.toUpperCase());
}
function isLevelMatch(level_a, level_b, oper) {
    return (((oper === "=") && (getLevelIndex(level_a) === getLevelIndex(level_b)))
        || ((oper === ">") && (getLevelIndex(level_a) > getLevelIndex(level_b)))
        || ((oper === "<") && (getLevelIndex(level_a) < getLevelIndex(level_b)))
        || ((oper === "!") && (getLevelIndex(level_a) != getLevelIndex(level_b))));
}
