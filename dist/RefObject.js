"use strict";
exports.__esModule = true;
var RefObject = /** @class */ (function () {
    function RefObject(id) {
        this.id = id;
    }
    RefObject.prototype.forEachReference = function (callback, type) {
        this.iterateCallback(this.references, callback, type);
    };
    RefObject.prototype.forEachReferencedBy = function (callback, type) {
        this.iterateCallback(this.referenced_by, callback, type);
    };
    RefObject.prototype.getId = function () {
        return this.id;
    };
    RefObject.prototype.getType = function () {
        return this.id.charAt(0);
    };
    RefObject.prototype.iterateCallback = function (array, callback, type) {
        var _this = this;
        if (!array) {
            return;
        }
        array.forEach(function (object_id) {
            if ((object_id !== _this.id) && (!type || object_id.startsWith(type))) {
                callback(object_id);
            }
        });
    };
    RefObject.prototype.setReferencedBy = function (ref_from) {
        this.referenced_by = this.referenced_by || [];
        if (this.referenced_by.indexOf(ref_from) === -1) {
            this.referenced_by.push(ref_from);
        }
    };
    RefObject.prototype.setReference = function (ref_to) {
        this.references = this.references || [];
        if (this.references.indexOf(ref_to) === -1) {
            this.references.push(ref_to);
        }
    };
    return RefObject;
}());
exports["default"] = RefObject;
