"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.testMarkup = exports.testFile = exports.showSignatures = exports.showSignature = exports.showNamespaces = exports.Server = exports.getSignature = exports.getReporter = exports.getProject = exports.getInfo = exports.processDir = exports.getPartsFromObjectId = exports.getPartsFromFilepath = exports.getCheerio = exports.addToBuild = void 0;
var Project_1 = __importDefault(require("./Project"));
// import RefObject from "./RefObject";
var Reporter_1 = __importDefault(require("./Reporter"));
var Utils = __importStar(require("./Utils"));
var project = new Project_1["default"]();
var Build_1 = require("./Build");
__createBinding(exports, Build_1, "default", "addToBuild");
var Utils_1 = require("./Utils");
__createBinding(exports, Utils_1, "getCheerio");
__createBinding(exports, Utils_1, "getPartsFromFilepath");
__createBinding(exports, Utils_1, "getPartsFromObjectId");
__createBinding(exports, Utils_1, "processDir");
function getInfo(object_id) {
    console.log(JSON.stringify(project.getObject(object_id)));
}
exports.getInfo = getInfo;
function getProject() {
    return project;
}
exports.getProject = getProject;
function getReporter() {
    return new Reporter_1["default"]();
}
exports.getReporter = getReporter;
function getSignature(component_id) {
    return project.getSignature(component_id);
}
exports.getSignature = getSignature;
var Server_1 = require("./Server");
__createBinding(exports, Server_1, "default", "Server");
function showNamespaces() {
    project.forEachNamespace(function (namespace) {
        console.log(namespace);
    });
}
exports.showNamespaces = showNamespaces;
function showSignature(component_id) {
    console.log(project.getSignature(component_id).display());
}
exports.showSignature = showSignature;
function showSignatures() {
    project.forEachComponent(function (sig) {
        console.log(sig.display());
    });
}
exports.showSignatures = showSignatures;
function testFile(filename) {
    var reporter = new Reporter_1["default"]();
    project.testMarkup(Utils.loadFile(filename), reporter);
    return reporter;
}
exports.testFile = testFile;
function testMarkup(data) {
    var reporter = new Reporter_1["default"]();
    project.testMarkup(data, reporter);
    return reporter;
}
exports.testMarkup = testMarkup;
