
import Cheerio from "cheerio";
import Reporter from "./Reporter";
import Signature from "./Signature";
import * as Types from "./Types";
import * as Utils from "./Utils";

const allowed_class_names = [
  /^[chlw]\-/,
  /^collapse$/,
  /^fa/,
  /^highcharts-/,
  /^sr-only$/,
];


export default class Node {
  private cardinality: number[];
  private chi: Node[];
  private ident: string;
  private level: number;
  private opt: string[];
  private parent_node: Node;
  private req: string[];
  private sibling_nbr: number;
  private signature: Signature;
  private tag_name: string;

  constructor(tag_name: string, class_string: string, parent_node: Node, signature: Signature, cardinality: string) {
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

    const class_list = Utils.splitClasses(class_string);
    Utils.parseClasses(class_list,
      (req_class) => {
        this.req.push(req_class);
      },
      (opt_class) => {
        this.opt.push(opt_class);
      },
    );
  }


  public addChild(child: Node): number {
    this.chi.push(child);
    return this.chi.length;
  }


  public containsRequiredClass(class_name: string): boolean {
    return (this.req.indexOf(class_name) > -1);
  }


  public static create(tag_name, class_string, parent_node, signature, cardinality): Node {
    return new Node(tag_name, class_string, parent_node, signature, cardinality);
  }


  public static createFromCheerioNode(cheerio_node, parent_node, signature): Node {
    return new Node(cheerio_node[0].name, cheerio_node.attr("class"),
      parent_node, signature, cheerio_node.attr("data-cardinality"));
  }


  public getAllClasses(): string[] {
    let out = this.req.concat(this.opt);
    this.chi.forEach((child) => {
      out = out.concat(child.getAllClasses());
    });
    return out;
  }


  public getTagName(): string {
    return this.tag_name;
  }


  public report(reporter: Reporter, str: string, leniency_type?: Types.LeniencyType): void {
    let level = "error";
    if (leniency_type && this.signature && this.signature.isLenient(leniency_type)) {
      level = "warn";
    }
    const full_str = (this.signature && (typeof this.signature.getId === "function") ? this.signature.getId() : "") + "/" + this.ident + ": " + str;
    reporter[level](full_str);
  }


  private shouldAdvanceChildTag(tag_name: string, chi_index: number, tag_count: number): boolean {
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
  }


  private testCardinality(tag_name: string, tag_count: number, reporter: Reporter): void {
    if (tag_count < this.cardinality[0]) {
      this.report(reporter, `(${tag_name}) ${tag_count} is below lower-bound cardinality: ${this.cardinality}`, "cardinality");
    }
    if (tag_count > this.cardinality[1]) {
      this.report(reporter, `(${tag_name}) ${tag_count} is above upper-bound cardinality: ${this.cardinality}`, "cardinality");
    }
  }


  public testMarkup(test_node: Cheerio, reporter: Reporter): void {
    const test_class_list = Utils.splitClasses(test_node.attr("class"));
    reporter.debug(`testMarkup node: ${this.toString()}, classes: ${test_class_list.length > 0 ? test_class_list : "<none>"}`);
    // Errors in Widget Usage are warnings for the moment...
    test_class_list.forEach((test_class) => {
      const match_class = Utils.testClassMatches(this.req, test_class);
      if (typeof this.signature.getId !== "function") {
        this.report(reporter, `error finding signature`);
      } else if (Utils.isClassComponentPattern(test_class) && (test_class !== this.signature.getId())) {
        this.report(reporter, `component not allowed: ${test_class}`, "classes");
      } else if (match_class) {
        reporter.debug(`req class found: ${match_class}`);
      } else if (Utils.testClassMatches(this.opt, test_class)) {
        reporter.debug(`opt class found: ${match_class}`);
      } else {
        this.report(reporter, `class not allowed: ${test_class}`, "classes");
      }
    });
    const temp_req = Array.from(this.req);
    test_class_list.forEach((test_class) => {
      const match_class = Utils.testClassMatches(temp_req, test_class);
      if (match_class) {
        temp_req.splice(temp_req.indexOf(match_class), 1);
      }
    });
    if (temp_req.length > 0) {
      this.report(reporter, `required class(es) not present: ${temp_req}`, "classes");
    }
    if (this.signature && this.signature.isLayout() && this.chi.length === 0) {
      reporter.debug(`layout receptacle`);
      return; // anything allowed from here
    }
    this.testMarkupChildNodes(test_node, reporter);
  }


  private testMarkupChildNodes(test_node: Cheerio, reporter: Reporter): void {
    let chi_index = 0;
    let tag_count = 0;
    let tag_name;
    test_node.children("*").each((index, child) => {
      const ch = Cheerio(child);
      tag_name = ch[0].tagName;
      const advance: boolean = this.shouldAdvanceChildTag(tag_name, chi_index, tag_count);
      reporter.debug(`child tag ${index}: ${tag_name}, tag_count: ${tag_count}, sig chi index: ${chi_index}, advance? ${advance}`);
      if (advance) {
        this.chi[chi_index].testCardinality(tag_name, tag_count, reporter);
        chi_index += 1;
        tag_count = 0;
      }
      tag_count += 1;
      if (chi_index < this.chi.length) {
        if (tag_name !== this.chi[chi_index].tag_name) {
          this.report(reporter, `unexpected child <${tag_name}> at index ${index}, expecting ${this.chi[chi_index]}`, "cardinality");
          return;
        }
        this.chi[chi_index].testMarkup(ch, reporter);
      } else {
        this.report(reporter, `unexpected child <${tag_name}> at index ${index}, expecting nothing`, "unexpected_content");
        // reporter.debug(`reached end of sign children`);
      }
    });
    while (chi_index < this.chi.length) {
      this.chi[chi_index].testCardinality(tag_name, tag_count, reporter);
      chi_index += 1;
      tag_count = 0;
    }
  }


  public toString(): string {
    let out = "<" + this.tag_name;
    if (this.cardinality[0] !== 1 || this.cardinality[1] !== 1) {
      out += "[" + encodeCardinality(this.cardinality) + "]";
    }
    this.req.forEach((class_name) => {
      out += "." + class_name;
    });
    this.opt.forEach((class_name) => {
      out += "." + class_name + "?";
    });
    if (this.chi.length > 0) {
      out += ">";
    }
    this.chi.forEach((child) => {
      out += child.toString();
    });
    if (this.chi.length > 0) {
      out += "</" + this.tag_name + ">";
    } else {
      out += " />";
    }
    return out;
  }


  public validate(reporter: Reporter): void {
    this.req.forEach((class_name) => {
      this.validateClass(class_name, reporter);
    });
    this.opt.forEach((class_name) => {
      this.validateClass(class_name, reporter);
    });
    let prev_tag_name = null;
    let prev_cardinality = null;
    this.chi.forEach((child) => {
      child.validate(reporter);
      if (prev_tag_name
          && (prev_tag_name === child.tag_name)
          && (typeof prev_cardinality === "string" && prev_cardinality !== "1-1")) {
            this.report(reporter, `subsequent tag cannot be the same given ${prev_cardinality} cardinality`);
      }
      prev_tag_name = child.tag_name;
      prev_cardinality = encodeCardinality(child.cardinality);
    });
  }


  private validateClass(class_name: string, reporter: Reporter): void {
    if (class_name === "filler") {
      this.report(reporter, `'filler' is not allowed in normative mark-up`);
    }
    if ((class_name !== this.signature.getId()) && Utils.isClassComponentPattern(class_name)) {
      this.report(reporter, `class name cannot appear to be another component id: ${class_name}`);
    }
    const regex1 = /[-_a-zA-Z0-9]+\*?/; // allow ending with '*
    if (!regex1.exec(class_name)) {
      this.report(reporter, `class name contains invalid characters: ${class_name}`);
    }
    let matched = false;
    allowed_class_names.forEach((regex) => {
      matched = matched || !!(regex.exec(class_name));
    });
    if (!matched) {
      this.report(reporter, `class name is not valid: ${class_name}`, "class-naming");
    }
  }

}


const decodeCardinality = (cardinality: string) => {
  if (cardinality === undefined) {
    return [ 1, 1, ];
  }
  function convert(part: string): number {
    if (part === "*") {
      return Number.POSITIVE_INFINITY;
    }
    const num = parseInt(part, 10);
    if (String(num) !== part) {
      throw new Error(`invalid cardinality part ${part} of ${cardinality}`);
    }
    return num;
  }
  const parts = cardinality.split("-");
  const out: [number, number] = [
    convert(parts[0]),
    convert(parts.length > 1 ? parts[1] : parts[0]),
  ];
  if (out[1] < out[0]) {
    throw new Error(`invalid cardinality: ${cardinality} upper bound < lower bound`);
  }
  return out;
};

const encodeCardinality = (cardinality) => {
  return cardinality[0] + "-"
    + (cardinality[1] === Number.POSITIVE_INFINITY ? "*" : cardinality[1]);
};
