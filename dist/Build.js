"use strict";
/// <reference path = "../../node_modules/ultimake/src/Types.d.ts" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var fs_1 = __importDefault(require("fs"));
var Ultimake = __importStar(require("ultimake"));
var Utils = __importStar(require("./Utils"));
function default_1(project, task, aggreg_html_deps) {
    var _this = this;
    console.log(project.toString());
    var source_prefix = project.getSourceDir();
    var target_prefix = project.getTargetDir();
    // helper functions
    var makeHTML = function (target) {
        // console.log(`makeHTML() ${this.name}, ${this.prereqs}, ${this.prereq}, ${this.source}`);
        // ongoing issue: how to access prereqs inside these recipe functions?
        var ejs_file = convertTargetHtmlToSourceEjs(target);
        var html_file = target;
        Ultimake.createDir(html_file);
        return project.convertEJSFile(ejs_file)
            .then(function () { });
        // const require_file = ; console.log(`makeHTML() done ${require_file}`);
        // } catch (e) { // promake is very reticent on logging failures in recipes...
        //   console.log(`makeHTML() ${ejs_file} -> ${html_file}`);
        //   console.error(e);
        // }
    };
    var makeJSON = function (targets, prereqs, name) {
        return __awaiter(this, void 0, void 0, function () {
            var json_file, parts, data;
            return __generator(this, function (_a) {
                json_file = targets;
                parts = Utils.getPartsFromFilepath(targets);
                // console.log(`makeJSON() ${parts.object_id} -> ${json_file}`);
                Ultimake.createDir(json_file);
                data = project.getObjectData(parts.object_id);
                fs_1["default"].writeFileSync(json_file, JSON.stringify(data, null, "  "), {
                    encoding: "utf8"
                });
                return [2 /*return*/];
            });
        });
    };
    // converters
    var json_file_regexp = new RegExp(target_prefix + "([a-z\-0-9\/]+).json$");
    var html_file_regexp = new RegExp(target_prefix + "([a-z\-0-9\/]+).html$");
    var convertTargetJsonToSourceEjs = Ultimake.convert(json_file_regexp, source_prefix, ".ejs");
    var convertTargetJsonToTargetCss = Ultimake.convert(json_file_regexp, target_prefix, ".css");
    var convertTargetHtmlToSourceEjs = Ultimake.convert(html_file_regexp, source_prefix, ".ejs");
    var convertTargetCssToPublicCss = Ultimake.convert(new RegExp(target_prefix + ".*(/[a-z\-0-9]+).css"), target_prefix + "/public/css", ".css");
    var convertSourceEjsToTargetJson = Ultimake.convertSourceToTarget(source_prefix, target_prefix, ".ejs", ".json");
    var convertSourceEjsToTargetHtml = Ultimake.convertSourceToTarget(source_prefix, target_prefix, ".ejs", ".html");
    var convertSourceEjsToTargetScss = Ultimake.convertSourceToTarget(source_prefix, target_prefix, ".ejs", ".scss");
    var convertSourceEjsToTargetCss = Ultimake.convertSourceToTarget(source_prefix, target_prefix, ".ejs", ".css");
    var convertSourceScssToTargetCss = Ultimake.convertSourceToTarget(source_prefix, target_prefix, ".scss", ".css");
    var file_list = {};
    // source file lists
    file_list.layout_ejs = Ultimake.glob(source_prefix + "/**/l-*.ejs");
    file_list.layout_scss = Ultimake.glob(source_prefix + "/**/l-*.scss");
    file_list.widget_ejs = Ultimake.glob(source_prefix + "/**/w-*.ejs");
    file_list.widget_scss = Ultimake.glob(source_prefix + "/**/w-*.scss");
    file_list.templt_ejs = Ultimake.glob(source_prefix + "/**/s-*.ejs");
    file_list.aggreg_ejs = Ultimake.glob(source_prefix + "/**/a-*.ejs");
    // intermediary and target file lists
    file_list.uicomp_ejs = file_list.layout_ejs.concat(file_list.widget_ejs);
    file_list.uicomp_json = file_list.uicomp_ejs.map(convertSourceEjsToTargetJson);
    file_list.uicomp_html = file_list.uicomp_ejs.map(convertSourceEjsToTargetHtml);
    file_list.uicomp_scss = file_list.layout_scss.concat(file_list.widget_scss);
    file_list.uicomp_css = file_list.uicomp_scss.map(convertSourceScssToTargetCss);
    file_list.templt_scss = file_list.templt_ejs.map(convertSourceEjsToTargetScss);
    file_list.templt_json = file_list.templt_ejs.map(convertSourceEjsToTargetJson);
    file_list.templt_css = file_list.templt_ejs.map(convertSourceEjsToTargetCss);
    file_list.aggreg_json = file_list.aggreg_ejs.map(convertSourceEjsToTargetJson);
    file_list.aggreg_scss = file_list.aggreg_ejs.map(convertSourceEjsToTargetScss);
    file_list.aggreg_css = file_list.aggreg_ejs.map(convertSourceEjsToTargetCss);
    file_list.aggreg_html = file_list.aggreg_ejs.map(convertSourceEjsToTargetHtml);
    file_list.public_css = file_list.templt_css.map(convertTargetCssToPublicCss);
    file_list.all____json = file_list.uicomp_json
        .concat(file_list.templt_json)
        .concat(file_list.aggreg_json);
    var objects_file = target_prefix + "/ultiscss/objects.json";
    var summary_file = target_prefix + "/ultiscss/summary.json";
    // file_list.gallery_src = Ultimake.glob((project.isUltiscss() ? "" : "node_modules/ultiscss/") + "src/assets/gallery/*");
    // file_list.gallery_tgt = file_list.gallery_src
    //   .map(path => path.replace(/^.*src\/assets/, target_prefix).replace(/.ejs$/, ".html"));
    file_list.all = file_list.all____json
        .concat(file_list.uicomp_html)
        .concat(file_list.aggreg_html)
        .concat(file_list.uicomp_css)
        .concat(file_list.templt_css)
        .concat(file_list.aggreg_css)
        .concat(file_list.public_css)
        .concat(file_list.gallery_tgt)
        .concat([objects_file, summary_file]);
    // uicomp - l-ayouts and w-idgets
    task("build_uicomp_json", null, file_list.uicomp_json, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); }, {
        description: "build UI Component JSON"
    });
    file_list.uicomp_json.forEach(function (json_file) {
        var ejs_file = convertTargetJsonToSourceEjs(json_file);
        var css_file = convertTargetJsonToTargetCss(json_file);
        // console.log(`making uicomp JSON rule ${ejs_file} -> ${json_file}`);
        task(null, json_file, [ejs_file, css_file], makeJSON);
    });
    task("build_uicomp_html", null, file_list.uicomp_html, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); }, {
        description: "build UI Component HTML"
    });
    file_list.uicomp_html.forEach(function (html_file) {
        var ejs_file = convertTargetHtmlToSourceEjs(html_file);
        // console.log(`making uicomp HTML rule ${ejs_file} -> ${html_file}`);
        task(null, html_file, ejs_file, makeHTML);
    });
    task("build_uicomp_css", file_list.uicomp_css, file_list.uicomp_scss, function () { return __awaiter(_this, void 0, void 0, function () {
        var path_regex;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    path_regex = new RegExp("(^" + target_prefix + ".*?)\/[^\/]+.css$");
                    file_list.uicomp_css
                        .map(function (path) { return path_regex.exec(path)[1]; })
                        .forEach(function (path) {
                        Ultimake.createDir(path);
                    });
                    return [4 /*yield*/, Ultimake.exec("npx node-sass -q -r " + source_prefix + " --output " + target_prefix)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, {
        description: "build UI Component CSS"
    });
    // templt - s-erver templates
    task("build_templt_json", null, file_list.templt_json, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); }, {
        description: "build template JSON"
    });
    file_list.templt_json.forEach(function (json_file) {
        var ejs_file = convertTargetJsonToSourceEjs(json_file);
        // console.log(`making templt JSON rule ${ejs_file} -> ${json_file}`);
        task(null, json_file, ejs_file, makeJSON);
    });
    task("build_templt_scss", file_list.templt_scss, file_list.all____json, function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // console.log(`making template SCSS...`);
            file_list.templt_scss.forEach(function (path) {
                var parts = Utils.getPartsFromFilepath(path);
                // console.log(`creating templt SCSS for ${parts.object_id}`);
                project.generateSCSSFileForObject(parts.object_id);
            });
            return [2 /*return*/];
        });
    }); }, {
        description: "build template JSON"
    });
    // aggreg - a-ggregate templates
    task("build_aggreg_json", null, file_list.aggreg_json, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); }, {
        description: "build aggregate JSON"
    });
    file_list.aggreg_json.forEach(function (json_file) {
        var ejs_file = convertTargetJsonToSourceEjs(json_file);
        var html_file = json_file.replace(/\.json$/, ".html");
        // console.log(`making aggreg HTML rule ${ejs_file} -> ${html_file}`);
        task(null, json_file, [ejs_file, html_file], makeJSON);
    });
    task("build_aggreg_html", null, file_list.aggreg_html, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); }, {
        description: "build aggregate HTML"
    });
    file_list.aggreg_html.forEach(function (html_file) {
        var ejs_file = convertTargetHtmlToSourceEjs(html_file);
        var prereq = aggreg_html_deps ? aggreg_html_deps.concat([ejs_file]) : ejs_file;
        // console.log(`making aggreg HTML rule ${ejs_file} -> ${html_file}`);
        task(null, html_file, prereq, makeHTML);
    });
    task("build_aggreg_scss", file_list.aggreg_scss, file_list.all____json, function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            file_list.aggreg_scss.forEach(function (path) {
                var parts = Utils.getPartsFromFilepath(path);
                project.generateSCSSFileForObject(parts.object_id);
            });
            return [2 /*return*/];
        });
    }); }, {
        description: "build aggreg json"
    });
    // target css - s- and a- generated SCSS -> CSS
    task("compile_target_scss_to_css", file_list.templt_css.concat(file_list.aggreg_css), [file_list.templt_scss, file_list.aggreg_scss, file_list.layout_scss, file_list.widget_scss], function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Ultimake.exec("npx node-sass -q -r " + target_prefix + " --output " + target_prefix)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    // console.log(` public_css: ${file_list.public_css}`);
    // console.log(` templt_css: ${file_list.templt_css}`);
    task("copy_public_css", file_list.public_css, file_list.templt_css, function () {
        Ultimake.createDir(target_prefix + "/public/css/");
        var promises = file_list.templt_css
            .map(function (templt_css) { return Ultimake.basedir(templt_css); })
            .sort()
            .filter(function (elem, index, array) { return (index === 0) || (elem !== array[index - 1]); })
            .map(function (dir) {
            // console.log(`copying ${dir}/s-*.css to ${target_prefix}/public/css`);
            return Ultimake.exec("cp " + dir + "/s-*.css " + target_prefix + "/public/css");
        });
        return Promise.all(promises);
    });
    // summary JSON
    task("make_objects_file", objects_file, file_list.all____json, function () { return __awaiter(_this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            Ultimake.createDir(objects_file);
            data = project.getObjects();
            fs_1["default"].writeFileSync(objects_file, JSON.stringify(data, null, "  "), {
                encoding: "utf8"
            });
            return [2 /*return*/];
        });
    }); });
    task("make_summary_file", summary_file, file_list.all____json, function () { return __awaiter(_this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            Ultimake.createDir(summary_file);
            data = project.makeSummary();
            fs_1["default"].writeFileSync(summary_file, JSON.stringify(data, null, "  "), {
                encoding: "utf8"
            });
            return [2 /*return*/];
        });
    }); });
    /*
      task("copy_gallery_files", file_list.gallery_tgt, file_list.gallery_src, async () => {
        const source_dir = (project.isUltiscss() ? "" : "node_modules/ultiscss/") + "src/assets/gallery";
        const target_dir = target_prefix + "/gallery/";
        Ultimake.createDir(target_dir);
    
        await Ultimake.exec(`cp ${source_dir}/*.css ${target_dir}`);
        await Ultimake.exec(`cp ${source_dir}/*.js  ${target_dir}`);
        await Ultimake.exec(`find node_modules/ -name           jquery.min.js -exec cp '{}' ${target_dir} \\;`);
        await Ultimake.exec(`find node_modules/ -name        bootstrap.min.js -exec cp '{}' ${target_dir} \\;`);
        await Ultimake.exec(`find node_modules/ -name bootstrap.bundle.min.js -exec cp '{}' ${target_dir} \\;`);
        await Ultimake.exec(`find node_modules/ -name       bootstrap.min.css -exec cp '{}' ${target_dir} \\;`);
    
        const data = {
          gallery_head_include_file: project.getGalleryHeadIncludeFile(),
        };
        const convert = (ejs_file, html_file) => {
          return new Promise((resolve, reject) => {
            Ejs.renderFile(ejs_file, data, null, (err, html) => {
              if (err) {
                reject(err);
              } else {
                Fs.writeFileSync(html_file, html);
                resolve();
              }
            });
          });
        }
        await convert(source_dir + "/iframe.ejs", target_dir + "/iframe.html");
        await convert(source_dir + "/layout.ejs", target_dir + "/layout.html");
        await convert(source_dir + "/widget.ejs", target_dir + "/widget.html");
      });
    */
    // complete build
    task("ultiscss", null, file_list.all, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/];
    }); }); }, {
        description: "ultiscss complete build"
    });
}
exports["default"] = default_1;
