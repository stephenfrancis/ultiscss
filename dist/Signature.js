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
var css_1 = __importDefault(require("css"));
var Node_1 = __importDefault(require("./Node"));
var Utils = __importStar(require("./Utils"));
var layout_forbidden_css = [
    "color",
    "font-family",
    "font-size",
    "font-weight",
    "text-decoration",
];
var Signature = /** @class */ (function () {
    function Signature(namespace, component_id, title, hide_in_gallery, leniency_level) {
        if (!namespace || !component_id) {
            throw new Error("namespace " + namespace + " and component_id " + component_id + " must be non-blank");
        }
        this.namespace = namespace;
        this.component_id = component_id;
        this.type = component_id.charAt(0);
        this.title = title;
        this.hide_in_gallery = hide_in_gallery;
        this.leniency_level = decodeLeniencyLevel(leniency_level);
        if (!Utils.isClassComponentPattern(component_id)) {
            throw new Error("invalid component id: " + component_id);
        }
        if (component_id.indexOf(namespace) !== 2) {
            throw new Error("component id: " + component_id + " doesn't incorporate namespace: " + namespace);
        }
    }
    Signature.create = function (namespace, component_id, title, hide_in_gallery, leniency_level) {
        return new Signature(namespace, component_id, title, hide_in_gallery, leniency_level);
    };
    Signature.createFromCheerioNode = function (namespace, component_id, cheerio_node) {
        var title = cheerio_node.attr("data-title");
        var hide_in_gallery = (cheerio_node.attr("data-hide") === "true");
        var leniency_level = cheerio_node.attr("data-leniency-level");
        var sig = new Signature(namespace, component_id, title, hide_in_gallery, leniency_level);
        sig.cheerio_node = cheerio_node; // hack to support validateMixedContent()
        var parent_node = [null];
        Utils.drillDownMarkup(cheerio_node, "*", function (child, data) {
            if (sig && !sig.includeElement(child)) {
                return;
            }
            var node = Node_1["default"].createFromCheerioNode(child, parent_node[data.level], sig);
            if (data.level === 0) {
                sig.setRootNode(node);
            }
            parent_node[data.level + 1] = node;
        });
        return sig;
    };
    ;
    Signature.prototype.display = function () {
        return this.toString() + "\n" + this.root_node.toString();
    };
    Signature.prototype.getId = function () {
        return this.component_id;
    };
    Signature.prototype.getLeniencyLevel = function () {
        return this.leniency_level;
    };
    Signature.prototype.getNamespace = function () {
        return this.namespace;
    };
    Signature.prototype.getRootNode = function () {
        return this.root_node;
    };
    Signature.prototype.getTitle = function () {
        return this.title;
    };
    Signature.prototype.getType = function () {
        return this.type;
    };
    Signature.prototype.includeElement = function (cheerio_node) {
        // return (node && node[0] && node[0].name === "div");
        return (!this.isLayout() || (cheerio_node[0].name === "div"));
    };
    Signature.prototype.isHideInGallery = function () {
        return this.hide_in_gallery;
    };
    Signature.prototype.isLayout = function () {
        return (this.getType() === "l");
    };
    Signature.prototype.isLenient = function (type) {
        return (this.leniency_level.indexOf(type) > -1);
    };
    Signature.prototype.isWidget = function () {
        return (this.getType() === "w");
    };
    Signature.prototype.setRootNode = function (root_node) {
        this.root_node = root_node;
    };
    Signature.prototype.testMarkup = function (div, reporter) {
        if (!this.root_node) {
            throw new Error("root node not set");
        }
        this.root_node.testMarkup(div, reporter);
    };
    Signature.prototype.toString = function () {
        return "[" + this.getId() + "] " + this.getTitle();
    };
    Signature.prototype.validate = function (reporter) {
        if (!this.root_node) {
            throw new Error("root node not set");
        }
        if (!this.root_node.containsRequiredClass(this.component_id)) {
            reporter.error("top level element must have " + this.component_id + " as a required class");
        }
        if (this.isLayout()) {
            if (this.root_node.getTagName() !== "div") {
                reporter.error("layout component top level element must be a div");
            }
            this.validateMixedContent(reporter);
        }
        this.root_node.validate(reporter);
    };
    Signature.prototype.validateMixedContent = function (reporter) {
        var contains_divs = false;
        var contains_non_divs = false;
        this.cheerio_node.children().each(function (index, child) {
            if (child.name === "div") {
                contains_divs = true;
            }
            else {
                contains_non_divs = true;
            }
        });
        if (contains_divs && contains_non_divs) {
            reporter.error("div contains mixture of div and non-div content");
        }
    };
    ;
    Signature.prototype.validateSCSS = function (data, reporter) {
        var _this = this;
        if (!this.root_node) {
            throw new Error("root node not set");
        }
        try {
            var css_ast = css_1["default"].parse(data);
            var classes_1 = this.root_node.getAllClasses();
            Utils.forEachClassInCSS(css_ast, function (class_name) {
                if (!Utils.testClassMatches(classes_1, class_name)) {
                    reporter[_this.isLenient("classes") ? "warn" : "error"]("unrecognized class for signature: " + class_name);
                }
            });
            if (this.isLayout()) {
                Utils.forEachPropertyInCSS(css_ast, function (property_name) {
                    if (layout_forbidden_css.indexOf(property_name) > -1) {
                        reporter[_this.isLenient("css-decls") ? "warn" : "error"]("invalid CSS declaration for layout: " + property_name);
                    }
                });
            }
        }
        catch (e) {
            reporter.error("exception parsing CSS: " + e);
        }
    };
    return Signature;
}());
exports["default"] = Signature;
;
var decodeLeniencyLevel = function (leniency_level) {
    if (!leniency_level) {
        return ["class-naming",];
    }
    if (leniency_level === "1") {
        leniency_level = "cardinality,classes,css-decls";
    }
    var out = leniency_level.split(",");
    // out.forEach((type) => {
    //   if (leniency_types.indexOf(type) === -1) {
    //     throw new Error(`invalid leniency level: ${type}`);
    //   }
    // });
    out.push("class-naming");
    return out;
};
