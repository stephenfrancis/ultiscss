"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
exports.__esModule = true;
var Project_1 = __importDefault(require("./Project"));
// import RefObject from "./RefObject";
var Reporter_1 = __importDefault(require("./Reporter"));
var Utils = __importStar(require("./Utils"));
var project = new Project_1["default"]();
var Build_1 = require("./Build");
exports.addToBuild = Build_1["default"];
var Utils_1 = require("./Utils");
exports.getCheerio = Utils_1.getCheerio;
exports.getPartsFromFilepath = Utils_1.getPartsFromFilepath;
exports.getPartsFromObjectId = Utils_1.getPartsFromObjectId;
exports.processDir = Utils_1.processDir;
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
