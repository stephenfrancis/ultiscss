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
var RefObject_1 = __importDefault(require("./RefObject"));
var Reporter_1 = __importDefault(require("./Reporter"));
var Signature_1 = __importDefault(require("./Signature"));
var Utils = __importStar(require("./Utils"));
var Project = /** @class */ (function () {
    function Project() {
        this.collection = {};
        this.entry_point_template = null;
        this.namespaces = [];
        this.object_cache = {};
        this.sig_map = {};
        this.source_refs_loaded = false;
        // this.universal_components = null;
        this.readSettings();
        this.scanLibraryDir();
        this.namespaces.sort();
    }
    Project.prototype.collectTemplateUIComponents = function (template_id, collector) {
        var _this = this;
        var template = this.collection[template_id];
        if (!template) {
            throw new Error("unrecognized template id: " + template_id);
        }
        template.forEachReference(function (object_id) {
            var type = object_id.charAt(0);
            if ((type === "l") || (type === "w")) {
                if (collector.indexOf(object_id) === -1) {
                    collector.push(object_id);
                }
            }
            else if (type === "s") {
                _this.collectTemplateUIComponents(object_id, collector);
            }
        });
    };
    Project.prototype.convertEJSFile = function (filename) {
        var html_file = filename.replace(this.source_dir, this.target_dir).replace(/\.ejs$/, ".html");
        return Utils.convertEJSFile(filename, html_file, this.project_name);
    };
    /*
      public deploy(git_branch): number {
        if (!this.s3_bucket_name || !this.project_name || !git_branch) {
          throw new Error(`all arguments are required: s3_bucket_name: ${this.s3_bucket_name}, project: ${this.project_name}, git_branch: ${git_branch}`);
        }
        let count = 0;
        const copyToS3 = (from_path: string, to_path?: string) => {
          let copy_args = "";
          if (to_path) { // dir copy
            copy_args = "--recursive --follow-symlinks";
          } else {
            to_path = from_path;
          }
          const output: Buffer = Cp.execSync(`aws s3 cp ${copy_args} ${from_path} s3://${this.s3_bucket_name}/${this.project_name}/${to_path}`, {
            encoding: "UTF-8",
          });
          String(output).split(/\r/).forEach((line) => {
            if (line.indexOf("upload:") === 0) {
              count += 1;
            }
          });
        }
        copyToS3("node_modules/jquery/dist/jquery.min.js");
        copyToS3("node_modules/bootstrap/dist/js/bootstrap.bundle.min.js");
        copyToS3(`${this.target_dir}/fontawesome`, `${git_branch}/fontawesome`);
        copyToS3(`${this.target_dir}/gallery`    , `${git_branch}/gallery`);
        copyToS3(`${this.target_dir}/googlefonts`, `${git_branch}/googlefonts`);
        copyToS3(`${this.target_dir}/summary`    , `${git_branch}/summary`);
        copyToS3(`${this.target_dir}/webfonts`   , `${git_branch}/webfonts`);
        this.forEachNamespace((namespace: string) => {
          copyToS3(`${this.target_dir}/${namespace}`, `${git_branch}/${namespace}`);
        });
        return count;
      }
    */
    Project.prototype.extractReferences = function (source_file_data) {
        var regex = /\W([lws]\-[a-z]+\-[\-a-z0-9]+)\W/g;
        var out = [];
        var match;
        while ((match = regex.exec(source_file_data)) !== null) {
            var ref_to = match[1];
            if (out.indexOf(ref_to) === -1) {
                out.push(ref_to);
            }
            // console.log(`loadSourceReferences() ${ref_from} -> ${ref_to}`);
            // this.makeReferences(ref_from, ref_to);
        }
        return out;
    };
    Project.prototype.forEachComponent = function (callback) {
        var _this = this;
        Object.keys(this.sig_map).forEach(function (comp_id) {
            var signature = _this.getSignature(comp_id);
            if (!signature || (typeof signature.getId !== "function")) {
                throw new Error("signature not found for component: " + comp_id);
            }
            callback(signature);
        });
    };
    Project.prototype.forEachNamespace = function (callback) {
        this.namespaces.forEach(callback);
    };
    Project.prototype.forEachObject = function (callback) {
        var _this = this;
        Object.keys(this.collection).forEach(function (component_id) {
            callback(_this.collection[component_id]);
        });
    };
    Project.prototype.generateSCSSFileForObject = function (object_id) {
        this.loadSourceReferences();
        var collector = [];
        var parts = Utils.getPartsFromObjectId(object_id);
        var scss_file = this.target_dir + "/" + parts.namespace + "/" + object_id + ".scss";
        this.collectTemplateUIComponents(object_id, collector);
        // Cp.execSync(`mkdir -p ${this.target_dir}/${namespace}`);
        this.generateSCSSFileFromReferences(collector, scss_file);
    };
    Project.prototype.generateSCSSFileFromReferences = function (components, target_file) {
        var _this = this;
        var content = "\n@import \"../../" + this.source_dir + "/base/core\";\n"
            + components.map(function (comp_id) {
                var parts = Utils.getPartsFromObjectId(comp_id);
                return "@import \"../../" + _this.source_dir + "/" + parts.namespace + "/" + comp_id + "\";";
            })
                .join("\n") + "\n";
        Utils.writeFile(target_file, content);
    };
    /*
      private getCollector(): string[] {
        if (!this.universal_components) {
          this.universal_components = [];
          if (this.entry_point_templates) {
            this.collection[this.entry_point_templates]
              .forEachReference((comp_id: string) => {
                if (comp_id.startsWith("l") || comp_id.startsWith("w")) {
                  this.universal_components.push(comp_id);
                }
              });
          }
        }
        // console.log(`Generating SCSS for Template: ${template_id}`);
        return this.universal_components.slice(); // shallow copy
      }
    */
    /*
      public getEntryPointTemplates(): string[] {
        this.loadSourceReferences();
        const out = [];
        if (this.entry_point_templates) {
          this.collection[this.entry_point_templates]
            .forEachReference((comp_id: string) => {
              out.push(comp_id);
            }, "s-");
        }
        return out;
      }
    */
    Project.prototype.getObjectData = function (object_id) {
        if (!this.object_cache[object_id]) {
            this.object_cache[object_id] = this.getObjectDataInternal(object_id);
        }
        return this.object_cache[object_id];
    };
    Project.prototype.getObjectDataInternal = function (object_id) {
        var parts = Utils.getPartsFromObjectId(object_id);
        var defn_file = this.source_dir + "/" + parts.namespace + "/" + object_id + ".ejs";
        var ejs_data = Utils.loadFile(defn_file);
        var reporter = new Reporter_1["default"]();
        var out = {
            id: object_id,
            namespace: parts.namespace,
            references: this.extractReferences(ejs_data),
            type: parts.type
        };
        if ((parts.type === "l") || (parts.type === "w")) {
            var signature = this.getSignature(object_id);
            out.title = signature.getTitle();
            out.signature = signature.getRootNode().toString();
            out.hide_in_gallery = signature.isHideInGallery();
            out.leniency_level = signature.getLeniencyLevel();
            signature.validate(reporter);
            var filename = this.target_dir + "/" + parts.namespace + "/" + object_id + ".css";
            var css_data = Utils.loadFile(filename);
            signature.validateSCSS(css_data, reporter);
        }
        else if (parts.type === "a") {
            var filename = this.target_dir + "/" + parts.namespace + "/" + object_id + ".html";
            out.title = this.processAggregate(filename, reporter);
        }
        reporter.addToObject(out, ">DEBUG");
        return out;
    };
    Project.prototype.getOrSetReferenceObject = function (object_id) {
        var object = this.collection[object_id];
        if (!object) {
            object = new RefObject_1["default"](object_id);
            this.collection[object_id] = object;
            var parts = Utils.getPartsFromObjectId(object_id);
            if (parts.namespace && this.namespaces.indexOf(parts.namespace) === -1) {
                this.namespaces.push(parts.namespace);
            }
            if ((parts.type === "l") || (parts.type === "w")) {
                this.sig_map[object_id] = parts.namespace; // to be created later if necessary
            }
        }
        return object;
    };
    Project.prototype.getProjectName = function () {
        return this.project_name;
    };
    Project.prototype.getProjectVersion = function () {
        return this.project_version;
    };
    Project.prototype.getObject = function (ref) {
        return this.collection[ref];
    };
    Project.prototype.getObjects = function () {
        return Object.keys(this.collection);
    };
    Project.prototype.getSignature = function (component_id) {
        if (!this.sig_map[component_id]) {
            var parts = Utils.getPartsFromObjectId(component_id);
            var defn_file = this.source_dir + "/" + parts.namespace + "/" + component_id + ".ejs";
            this.makeNewSignature(component_id, parts.namespace, Utils.loadFile(defn_file));
        }
        return this.sig_map[component_id];
    };
    Project.prototype.getSourceDir = function () {
        return this.source_dir;
    };
    Project.prototype.getTargetDir = function () {
        return this.target_dir;
    };
    Project.prototype.getVersion = function () {
        return this.ultiscss_version;
    };
    Project.prototype.isUltiscss = function () {
        return (this.project_name === "ultiscss");
    };
    Project.prototype.loadSourceReferences = function () {
        var _this = this;
        if (this.source_refs_loaded) {
            return;
        }
        Object.keys(this.collection).forEach(function (ref_from) {
            var parts = Utils.getPartsFromObjectId(ref_from);
            var data = JSON.parse(Utils.loadFile(_this.target_dir + "/" + parts.namespace + "/" + ref_from + ".json"));
            if (data && data.references) {
                data.references.forEach(function (ref_to) {
                    _this.makeReferences(ref_from, ref_to);
                });
            }
        });
        /*
            try {
              Cp.execSync(`grep -r -o -E -w '[lws]-[a-z]+-[-a-z0-9]+' ${this.source_dir}`, {
                encoding: "utf8",
              })
                .split(/\n/)
                .forEach((line) => {
                  this.loadSourceRefLine(line);
              });
              this.source_refs_loaded = true;
            } catch (e) {
              if (e.status !== 1) { // 1 means no matches found
                console.error(e);
              }
            }
        */
        /*
            const regex = /\W([lws]\-[a-z]+\-[\-a-z0-9]+)\W/g;
            Utils.processDir(this.source_dir, null, true, (filename: string) => {
              const ref_from: string = filename.substr(filename.lastIndexOf("/") + 1, filename.lastIndexOf(".") - filename.lastIndexOf("/") - 1);
              const source = Utils.loadFile(filename);
              let match;
              while ((match = regex.exec(source)) !== null) {
                const ref_to: string = match[1];
                // console.log(`loadSourceReferences() ${ref_from} -> ${ref_to}`);
                this.makeReferences(ref_from, ref_to);
                }
            });
        */
    };
    /*
      private loadSourceRefLine(line: string): void {
        if (!line) {
          return; // ignore blank lines
        }
        const parts = line.split(":");
        // console.log(`loadSourceReferences() ${parts}`);
        const ref_from: string = parts[0].substr(parts[0].lastIndexOf("/") + 1, parts[0].lastIndexOf(".") - parts[0].lastIndexOf("/") - 1);
        const ref_to  : string = parts[1];
        // console.log(`loadSourceReferences() ${ref_from} -> ${ref_to}`);
        this.makeReferences(ref_from, ref_to);
      }
    */
    Project.prototype.makeNewSignature = function (component_id, namespace, ejs_data) {
        var root_div = Utils.getRootElement(Utils.getCheerio(ejs_data));
        this.sig_map[component_id] = Signature_1["default"].createFromCheerioNode(namespace, component_id, root_div);
    };
    Project.prototype.makeReferences = function (ref_from, ref_to) {
        var obj_ref_from = this.getOrSetReferenceObject(ref_from);
        var obj_ref_to = this.getOrSetReferenceObject(ref_to);
        if (obj_ref_to) {
            obj_ref_to.setReferencedBy(ref_from);
        }
        if (obj_ref_from) {
            obj_ref_from.setReference(ref_to);
        }
    };
    Project.prototype.makeSummary = function () {
        var _this = this;
        var out = {
            namespaces: this.namespaces,
            error: {},
            warn: {},
            unused: this.reportUnusedObjects()
        };
        Object.keys(this.collection).forEach(function (object_id) {
            var obj = _this.getObjectData(object_id);
            if (obj.error) {
                out.error[object_id] = obj.error;
            }
            if (obj.warn) {
                out.warn[object_id] = obj.warn;
            }
        });
        return out;
    };
    Project.prototype.processAggregate = function (filename, reporter) {
        try {
            var root_div = Utils.getRootElement(Utils.getCheerio(Utils.loadFile(filename)));
            this.testMarkup(root_div, reporter);
            return root_div.attr("data-title");
        }
        catch (e) {
            reporter.error(e.toString());
        }
    };
    Project.prototype.readSettings = function () {
        var _this = this;
        var containing_package = Utils.getPackage(".");
        this.source_dir = "src";
        this.target_dir = "build";
        this.project_name = containing_package.name;
        this.project_version = containing_package.version;
        if (containing_package.ultiscss_settings) {
            Object.keys(containing_package.ultiscss_settings).forEach(function (param) {
                _this[param] = containing_package.ultiscss_settings[param]; // TODO should validate?
            });
        }
        if (this.isUltiscss()) {
            this.ultiscss_version = this.project_version;
        }
        else {
            var ultiscss_package = Utils.getPackage("./node_modules/ultiscss");
            this.ultiscss_version = ultiscss_package.version;
        }
    };
    Project.prototype.reportUnusedObjects = function () {
        var _this = this;
        this.loadSourceReferences();
        var out = [];
        Object.keys(this.collection).forEach(function (key) {
            if ((key.charAt(0) === "a") || (key === _this.entry_point_template)) { // ignore aggregates
                return;
            }
            var ref_found = false;
            _this.collection[key].forEachReferencedBy(function (ref_from) {
                ref_found = ref_found || (key !== ref_from && (ref_from.charAt(0) === "s"));
            });
            if (!ref_found) {
                out.push(key);
            }
        });
        return out;
    };
    Project.prototype.scanLibraryDir = function () {
        var _this = this;
        try {
            this.object_count = {
                a: 0,
                l: 0,
                s: 0,
                w: 0
            };
            Utils.processDir(this.source_dir, /\.ejs$/, true, function (filename) {
                var parts;
                try {
                    parts = Utils.getPartsFromFilepath(filename);
                }
                catch (e) {
                    return; // swallow invalid filename
                }
                try {
                    _this.collection[parts.object_id] = new RefObject_1["default"](parts.object_id);
                    _this.object_count[parts.type] += 1;
                    if (_this.namespaces.indexOf(parts.namespace) === -1) {
                        _this.namespaces.push(parts.namespace);
                    }
                }
                catch (e2) {
                    console.log("scanLibraryDir() " + filename + " -> " + e2);
                }
            });
        }
        catch (e) {
            console.error(e);
        }
    };
    /*
      public setup(): void {
        if (!this.include_gallery) {
          return;
        }
        Cp.execSync(`mkdir -p ${this.target_dir}/summary`);
        Cp.execSync(`rm -fr ${this.target_dir}/fontawesome ${this.target_dir}/gallery ${this.target_dir}/googlefonts ${this.target_dir}/webfonts`);
        Cp.execSync(`cp -r node_modules/ultiscss/src/assets/fontawesome/ ${this.target_dir}`);
        Cp.execSync(`cp -r node_modules/ultiscss/src/assets/gallery/     ${this.target_dir}`);
        Cp.execSync(`cp -r node_modules/ultiscss/src/assets/googlefonts/ ${this.target_dir}`);
        Cp.execSync(`cp -r node_modules/ultiscss/src/assets/webfonts/    ${this.target_dir}`);
      }
    */
    Project.prototype.testMarkup = function (markup, reporter) {
        var _this = this;
        if (typeof markup === "string") {
            markup = Utils.getRootElement(Utils.getCheerio(markup));
        }
        Utils.drillDownMarkup(markup, "*", function (child, data) {
            Utils.splitClasses(child.attr("class")).forEach(function (class_name) {
                try {
                    Utils.getPartsFromObjectId(class_name);
                }
                catch (e) {
                    return; // swallow invalid object id
                }
                try {
                    var signature = _this.getSignature(class_name);
                    reporter.info("checking class " + class_name + " at position " + data.position + " against found signature");
                    signature.testMarkup(child, reporter);
                }
                catch (e) {
                    if (e.toString().indexOf("ENOENT: no such file or directory, open") > 0) {
                        reporter.error("component not recognized: " + class_name);
                    }
                    else {
                        reporter.error(e);
                    }
                }
            });
        });
    };
    ;
    Project.prototype.toString = function () {
        return "ultiscss " + this.ultiscss_version + ": project " + this.project_name + ":" + this.project_version
            + (" " + this.source_dir + " -> " + this.target_dir + " initialised with")
            + (" " + this.object_count["a"] + " aggregates,")
            + (" " + this.object_count["l"] + " layouts,")
            + (" " + this.object_count["s"] + " server templates and")
            + (" " + this.object_count["w"] + " widgets");
    };
    return Project;
}());
exports["default"] = Project;
