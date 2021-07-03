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
var ejs_1 = __importDefault(require("ejs"));
var express_1 = __importDefault(require("express"));
var EntryPoint = __importStar(require("./EntryPoint"));
var app = express_1["default"]();
var cwd = process.cwd();
var project = EntryPoint.getProject();
var ultiscss_path = cwd + (project.isUltiscss() ? "" : "/node_modules/ultiscss");
app.get("/gallery/:template.html", function (req, res) {
    var template = ultiscss_path + "/src/assets/gallery/" + req.params.template + ".ejs";
    var data = {
        gallery_head_include_file: project.getGalleryHeadIncludeFile()
    };
    ejs_1["default"].renderFile(template, data, {}, function (err, str) {
        if (err) {
            console.error(err);
            res.writeHead(500);
            res.end(err);
        }
        else {
            res.writeHead(200);
            res.end(str);
        }
    });
});
app.use("/gallery", express_1["default"].static(ultiscss_path + "/src/assets/gallery"));
app.use(express_1["default"].static(cwd + "/node_modules"));
app.use(express_1["default"].static(ultiscss_path + "/node_modules"));
app.use(express_1["default"].static(cwd + "/build"));
exports["default"] = app;
