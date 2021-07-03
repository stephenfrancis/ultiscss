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
var cheerio_1 = __importDefault(require("cheerio"));
var Utils = __importStar(require("./Utils"));
var allowed_class_names = [
    /^[chlw]\-/,
    /^collapse$/,
    /^fa/,
    /^highcharts-/,
    /^sr-only$/,
];
var Node = /** @class */ (function () {
    function Node(tag_name, class_string, parent_node, signature, cardinality) {
        var _this = this;
        this.req = [];
        this.opt = [];
        this.chi = [];
        this.level = 0;
        this.sibling_nbr = 0;
        this.tag_name = tag_name;
        this.signature = signature;
        this.cardinality = decodeCardinality(cardinality);
        this.parent_node = parent_node;
        this.ident = "0";
        if (parent_node) {
            this.level = parent_node.level + 1;
            this.sibling_nbr = parent_node.addChild(this) - 1;
            this.ident = parent_node.ident + "." + this.sibling_nbr;
        }
        // this.ident = `L${this.level}-${this.sibling_nbr}`;
        var class_list = Utils.splitClasses(class_string);
        Utils.parseClasses(class_list, function (req_class) {
            _this.req.push(req_class);
        }, function (opt_class) {
            _this.opt.push(opt_class);
        });
    }
    Node.prototype.addChild = function (child) {
        this.chi.push(child);
        return this.chi.length;
    };
    Node.prototype.containsRequiredClass = function (class_name) {
        return (this.req.indexOf(class_name) > -1);
    };
    Node.create = function (tag_name, class_string, parent_node, signature, cardinality) {
        return new Node(tag_name, class_string, parent_node, signature, cardinality);
    };
    Node.createFromCheerioNode = function (cheerio_node, parent_node, signature) {
        return new Node(cheerio_node[0].name, cheerio_node.attr("class"), parent_node, signature, cheerio_node.attr("data-cardinality"));
    };
    Node.prototype.getAllClasses = function () {
        var out = this.req.concat(this.opt);
        this.chi.forEach(function (child) {
            out = out.concat(child.getAllClasses());
        });
        return out;
    };
    Node.prototype.getTagName = function () {
        return this.tag_name;
    };
    Node.prototype.report = function (reporter, str, leniency_type) {
        var level = "error";
        if (leniency_type && this.signature && this.signature.isLenient(leniency_type)) {
            level = "warn";
        }
        var full_str = (this.signature && (typeof this.signature.getId === "function") ? this.signature.getId() : "") + "/" + this.ident + ": " + str;
        reporter[level](full_str);
    };
    Node.prototype.shouldAdvanceChildTag = function (tag_name, chi_index, tag_count) {
        if (!tag_name) {
            return true; // text node, I think
        }
        // test node tag name has changed
        if ((chi_index < this.chi.length)
            && (tag_name !== this.chi[chi_index].tag_name)) {
            return true;
        }
        // reached current signature tag's upper cardinality and next sig tag is the same
        if ((chi_index < (this.chi.length - 1))
            && (this.chi[chi_index].tag_name === this.chi[chi_index + 1].tag_name)
            && (tag_count >= this.chi[chi_index].cardinality[1])) {
            return true;
        }
        return false;
    };
    Node.prototype.testCardinality = function (tag_name, tag_count, reporter) {
        if (tag_count < this.cardinality[0]) {
            this.report(reporter, "(" + tag_name + ") " + tag_count + " is below lower-bound cardinality: " + this.cardinality, "cardinality");
        }
        if (tag_count > this.cardinality[1]) {
            this.report(reporter, "(" + tag_name + ") " + tag_count + " is above upper-bound cardinality: " + this.cardinality, "cardinality");
        }
    };
    Node.prototype.testMarkup = function (test_node, reporter) {
        var _this = this;
        var test_class_list = Utils.splitClasses(test_node.attr("class"));
        reporter.debug("testMarkup node: " + this.toString() + ", classes: " + (test_class_list.length > 0 ? test_class_list : "<none>"));
        // Errors in Widget Usage are warnings for the moment...
        test_class_list.forEach(function (test_class) {
            var match_class = Utils.testClassMatches(_this.req, test_class);
            if (typeof _this.signature.getId !== "function") {
                _this.report(reporter, "error finding signature");
            }
            else if (Utils.isClassComponentPattern(test_class) && (test_class !== _this.signature.getId())) {
                _this.report(reporter, "component not allowed: " + test_class, "classes");
            }
            else if (match_class) {
                reporter.debug("req class found: " + match_class);
            }
            else if (Utils.testClassMatches(_this.opt, test_class)) {
                reporter.debug("opt class found: " + match_class);
            }
            else {
                _this.report(reporter, "class not allowed: " + test_class, "classes");
            }
        });
        var temp_req = Array.from(this.req);
        test_class_list.forEach(function (test_class) {
            var match_class = Utils.testClassMatches(temp_req, test_class);
            if (match_class) {
                temp_req.splice(temp_req.indexOf(match_class), 1);
            }
        });
        if (temp_req.length > 0) {
            this.report(reporter, "required class(es) not present: " + temp_req, "classes");
        }
        if (this.signature && this.signature.isLayout() && this.chi.length === 0) {
            reporter.debug("layout receptacle");
            return; // anything allowed from here
        }
        this.testMarkupChildNodes(test_node, reporter);
    };
    Node.prototype.testMarkupChildNodes = function (test_node, reporter) {
        var _this = this;
        var chi_index = 0;
        var tag_count = 0;
        var tag_name;
        test_node.children("*").each(function (index, child) {
            var ch = cheerio_1["default"](child);
            tag_name = ch[0].tagName;
            var advance = _this.shouldAdvanceChildTag(tag_name, chi_index, tag_count);
            reporter.debug("child tag " + index + ": " + tag_name + ", tag_count: " + tag_count + ", sig chi index: " + chi_index + ", advance? " + advance);
            if (advance) {
                _this.chi[chi_index].testCardinality(tag_name, tag_count, reporter);
                chi_index += 1;
                tag_count = 0;
            }
            tag_count += 1;
            if (chi_index < _this.chi.length) {
                if (tag_name !== _this.chi[chi_index].tag_name) {
                    _this.report(reporter, "unexpected child <" + tag_name + "> at index " + index + ", expecting " + _this.chi[chi_index], "cardinality");
                    return;
                }
                _this.chi[chi_index].testMarkup(ch, reporter);
            }
            else {
                _this.report(reporter, "unexpected child <" + tag_name + "> at index " + index + ", expecting nothing", "unexpected_content");
                // reporter.debug(`reached end of sign children`);
            }
        });
        while (chi_index < this.chi.length) {
            this.chi[chi_index].testCardinality(tag_name, tag_count, reporter);
            chi_index += 1;
            tag_count = 0;
        }
    };
    Node.prototype.toString = function () {
        var out = "<" + this.tag_name;
        if (this.cardinality[0] !== 1 || this.cardinality[1] !== 1) {
            out += "[" + encodeCardinality(this.cardinality) + "]";
        }
        this.req.forEach(function (class_name) {
            out += "." + class_name;
        });
        this.opt.forEach(function (class_name) {
            out += "." + class_name + "?";
        });
        if (this.chi.length > 0) {
            out += ">";
        }
        this.chi.forEach(function (child) {
            out += child.toString();
        });
        if (this.chi.length > 0) {
            out += "</" + this.tag_name + ">";
        }
        else {
            out += " />";
        }
        return out;
    };
    Node.prototype.validate = function (reporter) {
        var _this = this;
        this.req.forEach(function (class_name) {
            _this.validateClass(class_name, reporter);
        });
        this.opt.forEach(function (class_name) {
            _this.validateClass(class_name, reporter);
        });
        var prev_tag_name = null;
        var prev_cardinality = null;
        this.chi.forEach(function (child) {
            child.validate(reporter);
            if (prev_tag_name
                && (prev_tag_name === child.tag_name)
                && (typeof prev_cardinality === "string" && prev_cardinality !== "1-1")) {
                _this.report(reporter, "subsequent tag cannot be the same given " + prev_cardinality + " cardinality");
            }
            prev_tag_name = child.tag_name;
            prev_cardinality = encodeCardinality(child.cardinality);
        });
    };
    Node.prototype.validateClass = function (class_name, reporter) {
        if (class_name === "filler") {
            this.report(reporter, "'filler' is not allowed in normative mark-up");
        }
        if ((class_name !== this.signature.getId()) && Utils.isClassComponentPattern(class_name)) {
            this.report(reporter, "class name cannot appear to be another component id: " + class_name);
        }
        var regex1 = /[-_a-zA-Z0-9]+\*?/; // allow ending with '*
        if (!regex1.exec(class_name)) {
            this.report(reporter, "class name contains invalid characters: " + class_name);
        }
        var matched = false;
        allowed_class_names.forEach(function (regex) {
            matched = matched || !!(regex.exec(class_name));
        });
        if (!matched) {
            this.report(reporter, "class name is not valid: " + class_name, "class-naming");
        }
    };
    return Node;
}());
exports["default"] = Node;
var decodeCardinality = function (cardinality) {
    if (cardinality === undefined) {
        return [1, 1,];
    }
    function convert(part) {
        if (part === "*") {
            return Number.POSITIVE_INFINITY;
        }
        var num = parseInt(part, 10);
        if (String(num) !== part) {
            throw new Error("invalid cardinality part " + part + " of " + cardinality);
        }
        return num;
    }
    var parts = cardinality.split("-");
    var out = [
        convert(parts[0]),
        convert(parts.length > 1 ? parts[1] : parts[0]),
    ];
    if (out[1] < out[0]) {
        throw new Error("invalid cardinality: " + cardinality + " upper bound < lower bound");
    }
    return out;
};
var encodeCardinality = function (cardinality) {
    return cardinality[0] + "-"
        + (cardinality[1] === Number.POSITIVE_INFINITY ? "*" : cardinality[1]);
};
