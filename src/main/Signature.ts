
import Css from "css";
import Node from "./Node";
import Reporter from "./Reporter";
import * as Types from "./Types";
import * as Utils from "./Utils";

const layout_forbidden_css = [
  "color",
  "font-family",
  "font-size",
  "font-weight",
  "text-decoration",
];


export default class Signature {
  private cheerio_node?: Cheerio;
  private component_id: string;
  private hide_in_gallery: boolean;
  private leniency_level: Types.LeniencyType[];
  private namespace: string;
  private root_node?: Node;
  private title: string;
  private type: string;

  constructor(namespace: string, component_id: string, title: string, hide_in_gallery: boolean, leniency_level: string) {
    if (!namespace || !component_id) {
      throw new Error(`namespace ${namespace} and component_id ${component_id} must be non-blank`);
    }
    this.namespace    = namespace;
    this.component_id = component_id;
    this.type         = component_id.charAt(0);
    this.title        = title;
    this.hide_in_gallery = hide_in_gallery;
    this.leniency_level  = decodeLeniencyLevel(leniency_level) as Types.LeniencyType[];
    if (!Utils.isClassComponentPattern(component_id)) {
      throw new Error(`invalid component id: ${component_id}`);
    }
    if (component_id.indexOf(namespace) !== 2) {
      throw new Error(`component id: ${component_id} doesn't incorporate namespace: ${namespace}`);
    }
  }


  public static create(namespace: string, component_id: string, title: string, hide_in_gallery: boolean, leniency_level: string): Signature {
    return new Signature(namespace, component_id, title, hide_in_gallery, leniency_level);
  }


  public static createFromCheerioNode(namespace: string, component_id: string, cheerio_node: Cheerio): Signature {
    const title = cheerio_node.attr("data-title");
    const hide_in_gallery = (cheerio_node.attr("data-hide") === "true");
    const leniency_level = cheerio_node.attr("data-leniency-level");
    const sig = new Signature(namespace, component_id, title, hide_in_gallery, leniency_level);
    sig.cheerio_node = cheerio_node; // hack to support validateMixedContent()
    const parent_node = [ null ];
    Utils.drillDownMarkup(cheerio_node, "*", (child: Cheerio, data: any) => {
      if (sig && !sig.includeElement(child)) {
        return;
      }
      const node = Node.createFromCheerioNode(child, parent_node[data.level], sig);
      if (data.level === 0) {
        sig.setRootNode(node);
      }
      parent_node[data.level + 1] = node;
    });
    return sig;
  };


  public display(): string {
    return this.toString() + "\n" + this.root_node.toString();
  }


  public getId(): string {
    return this.component_id;
  }


  public getLeniencyLevel(): string[] {
    return this.leniency_level;
  }


  public getNamespace(): string {
    return this.namespace;
  }


  public getRootNode(): Node {
    return this.root_node;
  }


  public getTitle(): string {
    return this.title;
  }


  public getType(): string {
    return this.type;
  }


  public includeElement(cheerio_node: Cheerio): boolean {
    // return (node && node[0] && node[0].name === "div");
    return (!this.isLayout() || (cheerio_node[0].name === "div"));
  }


  public isHideInGallery(): boolean {
    return this.hide_in_gallery;
  }


  public isLayout(): boolean {
    return (this.getType() === "l");
  }


  public isLenient(type: Types.LeniencyType): boolean {
    return (this.leniency_level.indexOf(type) > -1);
  }


  public isWidget(): boolean {
    return (this.getType() === "w");
  }


  private setRootNode(root_node: Node) {
    this.root_node = root_node;
  }


  public testMarkup(div: Cheerio, reporter: Reporter): void {
    if (!this.root_node) {
      throw new Error(`root node not set`);
    }
    this.root_node.testMarkup(div, reporter);
  }


  public toString(): string {
    return `[${this.getId()}] ${this.getTitle()}`;
  }


  public validate(reporter: Reporter): void {
    if (!this.root_node) {
      throw new Error(`root node not set`);
    }
    if (!this.root_node.containsRequiredClass(this.component_id)) {
      reporter.error(`top level element must have ${this.component_id} as a required class`);
    }
    if (this.isLayout()) {
      if (this.root_node.getTagName() !== "div") {
        reporter.error(`layout component top level element must be a div`);
      }
      this.validateMixedContent(reporter);
    }

    this.root_node.validate(reporter);
  }


  public validateMixedContent(reporter: Reporter): void {
    let contains_divs = false;
    let contains_non_divs = false;
    this.cheerio_node.children().each((index, child) => {
      if (child.name === "div") {
        contains_divs = true;
      } else {
        contains_non_divs = true;
      }
    });
    if (contains_divs && contains_non_divs) {
      reporter.error(`div contains mixture of div and non-div content`);
    }
  };


  public validateSCSS(data, reporter: Reporter): void {
    if (!this.root_node) {
      throw new Error(`root node not set`);
    }
    try {
      const css_ast = Css.parse(data);
      const classes = this.root_node.getAllClasses();
      Utils.forEachClassInCSS(css_ast, (class_name) => {
        if (!Utils.testClassMatches(classes, class_name)) {
          reporter[this.isLenient("classes") ? "warn" : "error"](`unrecognized class for signature: ${class_name}`);
        }
      });
      if (this.isLayout()) {
        Utils.forEachPropertyInCSS(css_ast, (property_name) => {
          if (layout_forbidden_css.indexOf(property_name) > -1) {
            reporter[this.isLenient("css-decls") ? "warn" : "error"](`invalid CSS declaration for layout: ${property_name}`);
          }
        });
      }
    } catch (e) {
      reporter.error(`exception parsing CSS: ${e}`);
    }
  }

};


const decodeLeniencyLevel = (leniency_level: string) => {
  if (!leniency_level) {
    return [ "class-naming", ];
  }
  if (leniency_level === "1") {
    leniency_level = "cardinality,classes,css-decls";
  }
  const out = leniency_level.split(",");
  // out.forEach((type) => {
  //   if (leniency_types.indexOf(type) === -1) {
  //     throw new Error(`invalid leniency level: ${type}`);
  //   }
  // });
  out.push("class-naming");
  return out as Types.LeniencyType[];
}
