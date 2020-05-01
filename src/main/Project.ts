
import RefObject from "./RefObject";
import Reporter from "./Reporter";
import Signature from "./Signature";
import * as Utils from "./Utils";


export default class Project {
  private collection: { [key: string]: RefObject };
  private entry_point_template?: string;
  private gallery_head_include_file?: string;
  private namespaces: string[];
  private object_cache: { [object_id: string]: any };
  private object_count: { [key: string]: number };
  private project_name: string;
  private project_version: string;
  private sig_map: {[id: string]: string | Signature};
  private source_dir: string;
  private target_dir: string;
  private source_refs_loaded: boolean;
  private ultiscss_version: string;


  constructor() {
    this.collection = {};
    this.entry_point_template = null;
    this.gallery_head_include_file = null;
    this.namespaces = [];
    this.object_cache = {};
    this.sig_map = {};
    this.source_refs_loaded = false;
    this.readSettings();
    this.scanLibraryDir();
    this.namespaces.sort();
  }


  private collectTemplateUIComponents(template_id: string, collector: string[]): void {
    const template = this.collection[template_id];
    if (!template) {
      throw new Error(`unrecognized template id: ${template_id}`);
    }
    template.forEachReference((object_id: string) => {
      const type = object_id.charAt(0);
      if ((type === "l") || (type === "w")) {
        if (collector.indexOf(object_id) === -1) {
          collector.push(object_id);
        }
      } else if (type === "s") {
        this.collectTemplateUIComponents(object_id, collector);
      }
    });
  }


  public convertEJSFile(filename: string): Promise<string> {
    const html_file: string = filename.replace(this.source_dir, this.target_dir).replace(/\.ejs$/, ".html");
    return Utils.convertEJSFile(filename, html_file, this.project_name);
  }


  public extractReferences(source_file_data: string) {
    const regex = /\W([lws]\-[a-z]+\-[\-a-z0-9]+)\W/g;
    const out: string[] = [];
    let match;
    while ((match = regex.exec(source_file_data)) !== null) {
      const ref_to: string = match[1];
      if (out.indexOf(ref_to) === -1) {
        out.push(ref_to);
      }
    }
    return out;
  }


  public forEachComponent(callback: (sig: Signature) => void): void {
    Object.keys(this.sig_map).forEach((comp_id: string) => {
      const signature = this.getSignature(comp_id);
      if (!signature || (typeof signature.getId !== "function")) {
        throw new Error(`signature not found for component: ${comp_id}`);
      }
      callback(signature)
    });
  }


  public forEachNamespace(callback: (namespace: string) => void): void {
    this.namespaces.forEach(callback);
  }


  public forEachObject(callback: (component: RefObject) => void): void {
    Object.keys(this.collection).forEach((component_id) => {
      callback(this.collection[component_id]);
    });
  }


  public generateSCSSFileForObject(object_id: string): void {
    this.loadSourceReferences();
    const collector: string[] = [];
    const parts = Utils.getPartsFromObjectId(object_id);
    const scss_file = `${this.target_dir}/${parts.namespace}/${object_id}.scss`;
    this.collectTemplateUIComponents(object_id, collector);
    // Cp.execSync(`mkdir -p ${this.target_dir}/${namespace}`);
    this.generateSCSSFileFromReferences(collector, scss_file);
  }


  public generateSCSSFileFromReferences(components: string[], target_file: string): void {
    const content =  `\n@import "../../${this.source_dir}/base/core";\n`
      + components.map((comp_id) => {
        const parts = Utils.getPartsFromObjectId(comp_id);
        return `@import "../../${this.source_dir}/${parts.namespace}/${comp_id}";`;
      })
      .join("\n") + "\n"
    Utils.writeFile(target_file, content);
  }


  public getGalleryHeadIncludeFile(): string {
    return this.gallery_head_include_file;
  }


  public getObjectData(object_id: string): any {
    if (!this.object_cache[object_id]) {
      this.object_cache[object_id] = this.getObjectDataInternal(object_id);
    }
    return this.object_cache[object_id];
  }


  private getObjectDataInternal(object_id: string): any {
    const parts = Utils.getPartsFromObjectId(object_id);
    const defn_file: string = this.source_dir + "/" + parts.namespace + "/" + object_id + ".ejs";
    const ejs_data = Utils.loadFile(defn_file);
    const reporter: Reporter = new Reporter();
    const out: any = {
      id: object_id,
      namespace: parts.namespace,
      references: this.extractReferences(ejs_data),
      type: parts.type,
    };
    if (out.references.indexOf(object_id) > -1) { // remove self reference
      out.references.splice(out.references.indexOf(object_id), 1);
    }

    if ((parts.type === "l") || (parts.type === "w")) {
      const signature = this.getSignature(object_id);
      out.title = signature.getTitle();
      out.signature = signature.getRootNode().toString();
      out.hide_in_gallery = signature.isHideInGallery();
      out.leniency_level  = signature.getLeniencyLevel();

      signature.validate(reporter);
      const filename = `${this.target_dir}/${parts.namespace}/${object_id}.css`;
      const css_data = Utils.loadFile(filename);
      signature.validateSCSS(css_data, reporter);
    } else if (parts.type === "a") {
      const filename = `${this.target_dir}/${parts.namespace}/${object_id}.html`;
      out.title = this.processAggregate(filename, reporter);
    }
    reporter.addToObject(out, ">DEBUG");
    return out;
  }


  private getOrSetReferenceObject(object_id: string): RefObject {
    let object: RefObject = this.collection[object_id];
    if (!object) {
      object = new RefObject(object_id);
      this.collection[object_id] = object;
      const parts = Utils.getPartsFromObjectId(object_id);
      if (parts.namespace && this.namespaces.indexOf(parts.namespace) === -1) {
        this.namespaces.push(parts.namespace);
      }
      if ((parts.type === "l") || (parts.type === "w")) {
        this.sig_map[object_id] = parts.namespace; // to be created later if necessary
      }
    }
    return object;
  }


  public getProjectName(): string {
    return this.project_name;
  }


  public getProjectVersion(): string {
    return this.project_version;
  }


  public getObject(ref: string): RefObject {
    return this.collection[ref];
  }


  public getObjects(): string[] {
    return Object.keys(this.collection);
  }


  public getSignature(component_id: string): Signature {
    if (!this.sig_map[component_id]) {
      const parts = Utils.getPartsFromObjectId(component_id);
      const defn_file: string = this.source_dir + "/" + parts.namespace + "/" + component_id + ".ejs";
      this.makeNewSignature(component_id, parts.namespace, Utils.loadFile(defn_file));
    }
    return this.sig_map[component_id] as Signature;
  }


  public getSourceDir(): string {
    return this.source_dir;
  }


  public getTargetDir(): string {
    return this.target_dir;
  }


  public getVersion(): string {
    return this.ultiscss_version;
  }


  public isUltiscss(): boolean {
    return (this.project_name === "ultiscss");
  }


  public loadSourceReferences(): void {
    if (this.source_refs_loaded) {
      return;
    }
    Object.keys(this.collection).forEach((ref_from) => {
      const parts = Utils.getPartsFromObjectId(ref_from);
      const data = JSON.parse(Utils.loadFile(this.target_dir + "/" + parts.namespace + "/" + ref_from + ".json"));
      if (data && data.references) {
        data.references.forEach((ref_to) => {
          this.makeReferences(ref_from, ref_to);
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
  }

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

  private makeNewSignature(component_id: string, namespace: string, ejs_data: string): void {
    const root_div = Utils.getRootElement(Utils.getCheerio(ejs_data));
    this.sig_map[component_id] = Signature.createFromCheerioNode(namespace, component_id, root_div);
  }


  private makeReferences(ref_from: string, ref_to: string): void {
    const obj_ref_from = this.getOrSetReferenceObject(ref_from);
    const obj_ref_to   = this.getOrSetReferenceObject(ref_to);
    if (obj_ref_to) {
      obj_ref_to.setReferencedBy(ref_from);
    }
    if (obj_ref_from) {
      obj_ref_from.setReference(ref_to);
    }
  }


  public makeSummary(): any {
    const out = {
      namespaces: this.namespaces,
      error: {},
      warn: {},
      unused: this.reportUnusedObjects(),
    };
    Object.keys(this.collection).forEach((object_id: string) => {
      const obj = this.getObjectData(object_id);
      if (obj.error) {
        out.error[object_id] = obj.error;
      }
      if (obj.warn) {
        out.warn[object_id] = obj.warn;
      }
    });
    return out;
  }


  public processAggregate(filename: string, reporter: Reporter): string {
    try {
      const root_div = Utils.getRootElement(Utils.getCheerio(Utils.loadFile(filename)));
      this.testMarkup(root_div, reporter);
      return root_div.attr("data-title");
    } catch (e) {
      reporter.error(e.toString());
    }
  }


  private readSettings(): void {
    const containing_package = Utils.getPackage(".");
    this.source_dir      = "src";
    this.target_dir      = "build";
    this.project_name    = containing_package.name;
    this.project_version = containing_package.version;
    if (containing_package.ultiscss_settings) {
      Object.keys(containing_package.ultiscss_settings).forEach((param) => {
        this[param] = containing_package.ultiscss_settings[param]; // TODO should validate?
      });
    }

    if (this.isUltiscss()) {
      this.ultiscss_version = this.project_version;
    } else {
      const ultiscss_package = Utils.getPackage("./node_modules/ultiscss");
      this.ultiscss_version  = ultiscss_package.version;
    }
  }


  private reportUnusedObjects(): string[] {
    this.loadSourceReferences();
    const out = [];
    Object.keys(this.collection).forEach((key: string) => {
      if ((key.charAt(0) === "a") || (key === this.entry_point_template)) { // ignore aggregates
        return;
      }
      let ref_found: boolean = false;
      this.collection[key].forEachReferencedBy((ref_from: string) => {
        ref_found = ref_found || (key !== ref_from && (ref_from.charAt(0) === "s"));
      });
      if (!ref_found) {
        out.push(key);
      }
    });
    return out;
  }


  private scanLibraryDir(): void {
    try {
      this.object_count = {
        a: 0,
        l: 0,
        s: 0,
        w: 0,
      };
      Utils.processDir(this.source_dir, /\.ejs$/, true, (filename: string) => {
        let parts;
        try {
          parts = Utils.getPartsFromFilepath(filename);
        } catch (e) {
          return; // swallow invalid filename
        }
        try {
          this.collection[parts.object_id] = new RefObject(parts.object_id);
          this.object_count[parts.type] += 1;
          if (this.namespaces.indexOf(parts.namespace) === -1) {
            this.namespaces.push(parts.namespace);
          }
        } catch (e2) {
          console.log(`scanLibraryDir() ${filename} -> ${e2}`);
        }
      });
    } catch (e) {
      console.error(e);
    }
  }


  public testMarkup(markup: Cheerio | string, reporter: Reporter): void {
    if (typeof markup === "string") {
      markup = Utils.getRootElement(Utils.getCheerio(markup));
    }
    Utils.drillDownMarkup(markup, "*", (child: Cheerio, data: any) => {
      Utils.splitClasses(child.attr("class")).forEach((class_name) => {
        try {
          Utils.getPartsFromObjectId(class_name);
        } catch (e) {
          return; // swallow invalid object id
        }
        try {
          const signature: Signature = this.getSignature(class_name);
          reporter.info(`checking class ${class_name} at position ${data.position} against found signature`);
          signature.testMarkup(child, reporter);
        } catch (e) {
          if (e.toString().indexOf("ENOENT: no such file or directory, open") > 0) {
            reporter.error(`component not recognized: ${class_name}`);
          } else {
            reporter.error(e);
          }
        }
      });
    });
  };


  public toString(): string {
    return `ultiscss ${this.ultiscss_version}: project ${this.project_name}:${this.project_version}`
      + ` ${this.source_dir} -> ${this.target_dir} initialised with`
      + ` ${this.object_count["a"]} aggregates,`
      + ` ${this.object_count["l"]} layouts,`
      + ` ${this.object_count["s"]} server templates and`
      + ` ${this.object_count["w"]} widgets`;
  }

}
