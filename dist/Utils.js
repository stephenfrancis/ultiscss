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
exports.writeFile = exports.testClassMatches = exports.splitClasses = exports.processDir = exports.parseClasses = exports.loadFile = exports.isSignatureClassMatch = exports.isPatternClass = exports.isClassComponentPattern = exports.getRootElementFromData = exports.getRootElement = exports.getRoot = exports.getPackage = exports.getPartsFromObjectId = exports.getPartsFromFilepath = exports.getHTMLNode = exports.getCheerio = exports.forEachPropertyInCSS = exports.forEachClassInCSS = exports.drillDownMarkup = exports.convertEJSFile = void 0;
var cheerio_1 = __importDefault(require("cheerio"));
var Ejs = __importStar(require("ejs"));
var Fs = __importStar(require("fs"));
function convertEJSFile(ejs_file, html_file, project_name) {
    var data = {};
    var options = {};
    var js_file = ejs_file.replace(/\.ejs$/, ".js");
    // console.log(`__dirname: ${__dirname}, ejs_file: ${ejs_file}, project_name: ${project_name}, js_file: ${js_file}`);
    return new Promise(function (resolve, reject) {
        var require_path = "<no require>";
        if (project_name && Fs.existsSync(js_file)) {
            // in "normal" usage, __dirname here is "/app/node_modules/ultiscss/dist"; in "npm link" usage it is e.g. "/home/stephen/Dev/ultiscss/dist"
            // needs to be "../../" if coming from "/node_modules/ultiscss/dist"
            require_path = "../../../" + js_file; // coming from "/node_modules/ultiscss/dist"
            if (__dirname.indexOf("/node_modules/ultiscss/dist") === -1) {
                if (__dirname.indexOf("/dist") > -1) {
                    require_path = "../../" + project_name + "/" + js_file; // coming from "<elsewhere>/ultiscss/dist"
                }
                else {
                    require_path = "../../../" + project_name + "/" + js_file; // coming from "<elsewhere>/ultiscss/src/main" or "<elsewhere>/ultiscss/build/main"
                }
            }
            try {
                data = require(require_path);
            }
            catch (e) {
                reject("error " + e + " loading " + require_path + " from " + __dirname + "; skipping conversion of " + ejs_file);
                return;
            }
        }
        Ejs.renderFile(ejs_file, data, options, function (err, str) {
            if (err) {
                reject(err);
            }
            else {
                writeFile(html_file, str);
                resolve(require_path);
            }
        });
    });
}
exports.convertEJSFile = convertEJSFile;
function drillDownMarkup(node, selector, callback, parent_data) {
    if (!parent_data) {
        parent_data = {};
    }
    parent_data.position = parent_data.position || "-";
    parent_data.level = parent_data.level || 0;
    parent_data.sibling_nbr = parent_data.sibling_nbr || 0;
    if (callback(node, parent_data) === false) {
        return;
    }
    node.children(selector).each(function (index, child) {
        var this_data = Object.assign({}, parent_data);
        this_data.sibling_nbr = index;
        this_data.position = parent_data.position + index + "-";
        this_data.level = parent_data.level + 1;
        drillDownMarkup(cheerio_1["default"](child), selector, callback, this_data);
    });
}
exports.drillDownMarkup = drillDownMarkup;
function forEachClassInCSS(css_ast, callback) {
    if (!css_ast || !css_ast.stylesheet || !css_ast.stylesheet.rules) {
        return;
    }
    css_ast.stylesheet.rules.forEach(function (rule) {
        if (!rule.selectors) {
            return;
        }
        rule.selectors.forEach(function (selector) {
            var regexp = /\.([a-zA-Z0-9_-]+)/g;
            var matches;
            while ((matches = regexp.exec(selector)) !== null) {
                callback(matches[1]);
            }
        });
    });
}
exports.forEachClassInCSS = forEachClassInCSS;
function forEachPropertyInCSS(css_ast, callback) {
    if (!css_ast || !css_ast.stylesheet || !css_ast.stylesheet.rules) {
        return;
    }
    css_ast.stylesheet.rules.forEach(function (rule) {
        if (!rule.selectors) {
            return;
        }
        rule.declarations.forEach(function (declaration) {
            callback(declaration.property);
        });
    });
}
exports.forEachPropertyInCSS = forEachPropertyInCSS;
function getCheerio(data) {
    if (!data) {
        throw new Error("getCheerio(): no data");
    }
    return cheerio_1["default"].load(data);
}
exports.getCheerio = getCheerio;
function getHTMLNode(data) {
    return getRoot(getCheerio(data)).children("html");
}
exports.getHTMLNode = getHTMLNode;
// to act on a file path: 1 = namespace, 2 = filename, 3 = ref, 4 = type, 5 = file suffix
var obj_regex_in_path = /\/([a-z]+)\/((([alsw])\-[a-z]+\-[a-z0-9\-]+)\.([a-z]+))$/;
function getPartsFromFilepath(filepath) {
    var parts = obj_regex_in_path.exec(filepath);
    if (!parts || parts.length < 6) {
        throw new Error("invalid path: " + filepath);
    }
    return {
        namespace: parts[1],
        filename: parts[2],
        object_id: parts[3],
        type: parts[4],
        suffix: parts[5]
    };
}
exports.getPartsFromFilepath = getPartsFromFilepath;
// to act on a reference: 1 = type, 2 = namespace, 3 = rest
var obj_regex_in_ref = /^([alsw])\-([a-z]+)\-([a-z0-9\-]+)$/;
function getPartsFromObjectId(object_id) {
    var parts = obj_regex_in_ref.exec(object_id);
    if (!parts || parts.length < 4) {
        throw new Error("invalid object id: " + object_id);
    }
    return {
        type: parts[1],
        namespace: parts[2],
        rest: parts[3]
    };
}
exports.getPartsFromObjectId = getPartsFromObjectId;
function getPackage(path) {
    return JSON.parse(Fs.readFileSync(path + "/package.json", {
        encoding: "UTF-8"
    }));
}
exports.getPackage = getPackage;
function getRoot(cheerio) {
    return cheerio.root();
}
exports.getRoot = getRoot;
function getRootElement(cheerio) {
    var div = getRoot(cheerio).children("html").children("body").children("*");
    if (div.length > 1) {
        div = div.parent();
    }
    else if (div.length === 0) {
        throw new Error("getRootDiv() found no root node");
    }
    return div;
}
exports.getRootElement = getRootElement;
function getRootElementFromData(data) {
    return getRootElement(getCheerio(data));
}
exports.getRootElementFromData = getRootElementFromData;
function isClassComponentPattern(class_name) {
    return !!class_name.match(/^[lw]\-[\w\d]+\-[\w\d]+/);
}
exports.isClassComponentPattern = isClassComponentPattern;
function isPatternClass(class_name) {
    return (class_name.indexOf("*") === (class_name.length - 1));
}
exports.isPatternClass = isPatternClass;
function isSignatureClassMatch(sig_class, test_class) {
    return (sig_class === test_class) || (isPatternClass(sig_class)
        && (test_class.indexOf(sig_class.substr(0, sig_class.length - 1)) === 0));
}
exports.isSignatureClassMatch = isSignatureClassMatch;
function loadFile(filename) {
    return Fs.readFileSync(filename, {
        encoding: "UTF-8"
    });
}
exports.loadFile = loadFile;
function parseClasses(class_list, cb_req, cb_opt) {
    if (!class_list) {
        return;
    }
    class_list.forEach(function (class_name) {
        if (class_name.substr(class_name.length - 1) === "?") {
            cb_opt(class_name.substr(0, class_name.length - 1));
        }
        else {
            cb_req(class_name);
        }
    });
}
exports.parseClasses = parseClasses;
function processDir(dirname, pattern, recurse, callback) {
    Fs.readdirSync(dirname, {
        encoding: "UTF-8"
    }).forEach(function (name) {
        var path = dirname + "/" + name;
        var stats = Fs.lstatSync(path);
        if (stats.isFile() && (!pattern || pattern.exec(path))) {
            callback(path);
        }
        if (stats.isDirectory() && recurse) {
            processDir(path, pattern, recurse, callback);
        }
    });
}
exports.processDir = processDir;
function splitClasses(class_list) {
    return class_list ? class_list.trim().split(/\s+/) : [];
}
exports.splitClasses = splitClasses;
function testClassMatches(sig_class_array, test_class) {
    var match_class = null;
    sig_class_array.forEach(function (sig_class) {
        if (!match_class && isSignatureClassMatch(sig_class, test_class)) {
            match_class = sig_class;
        }
    });
    return match_class;
}
exports.testClassMatches = testClassMatches;
// testedComponent() -> Reporter.instancesFound()
function writeFile(filename, data) {
    Fs.writeFileSync(filename, data, {
        encoding: "UTF-8"
    });
}
exports.writeFile = writeFile;
