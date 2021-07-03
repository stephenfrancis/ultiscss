import Cheerio from "cheerio";
import * as Ejs from "ejs";
import * as Fs from "fs";

export function convertEJSFile(
  ejs_file: string,
  html_file: string,
  project_name?: string
): Promise<string> {
  let data = {};
  const options = {};
  const js_file = ejs_file.replace(/\.ejs$/, ".js");
  // console.log(`__dirname: ${__dirname}, ejs_file: ${ejs_file}, project_name: ${project_name}, js_file: ${js_file}`);
  return new Promise((resolve, reject) => {
    let require_path = "<no require>";
    if (project_name && Fs.existsSync(js_file)) {
      // in "normal" usage, __dirname here is "/app/node_modules/ultiscss/dist"; in "npm link" usage it is e.g. "/home/stephen/Dev/ultiscss/dist"
      // needs to be "../../" if coming from "/node_modules/ultiscss/dist"
      require_path = "../../../" + js_file; // coming from "/node_modules/ultiscss/dist"
      if (__dirname.indexOf("/node_modules/ultiscss/dist") === -1) {
        if (__dirname.indexOf("/dist") > -1) {
          require_path = "../../" + project_name + "/" + js_file; // coming from "<elsewhere>/ultiscss/dist"
        } else {
          require_path = "../../../" + project_name + "/" + js_file; // coming from "<elsewhere>/ultiscss/src/main" or "<elsewhere>/ultiscss/build/main"
        }
      }
      try {
        data = require(require_path);
      } catch (e) {
        reject(
          `error ${e} loading ${require_path} from ${__dirname}; skipping conversion of ${ejs_file}`
        );
        return;
      }
    }
    Ejs.renderFile(ejs_file, data, options, (err, str) => {
      if (err) {
        reject(err);
      } else {
        writeFile(html_file, str);
        resolve(require_path);
      }
    });
  });
}

export function drillDownMarkup(
  node: cheerio.Cheerio,
  selector: string,
  callback: (node: cheerio.Cheerio, parent_data: any) => boolean | void,
  parent_data?: any
) {
  if (!parent_data) {
    parent_data = {};
  }
  parent_data.position = parent_data.position || "-";
  parent_data.level = parent_data.level || 0;
  parent_data.sibling_nbr = parent_data.sibling_nbr || 0;
  if (callback(node, parent_data) === false) {
    return;
  }
  node.children(selector).each((index, child) => {
    let this_data = Object.assign({}, parent_data);
    this_data.sibling_nbr = index;
    this_data.position = parent_data.position + index + "-";
    this_data.level = parent_data.level + 1;
    drillDownMarkup(Cheerio(child), selector, callback, this_data);
  });
}

export function forEachClassInCSS(
  css_ast: any,
  callback: (selector: string) => void
) {
  if (!css_ast || !css_ast.stylesheet || !css_ast.stylesheet.rules) {
    return;
  }
  css_ast.stylesheet.rules.forEach((rule) => {
    if (!rule.selectors) {
      return;
    }
    rule.selectors.forEach((selector) => {
      const regexp = /\.([a-zA-Z0-9_-]+)/g;
      let matches;
      while ((matches = regexp.exec(selector)) !== null) {
        callback(matches[1]);
      }
    });
  });
}

export function forEachPropertyInCSS(css_ast, callback): void {
  if (!css_ast || !css_ast.stylesheet || !css_ast.stylesheet.rules) {
    return;
  }
  css_ast.stylesheet.rules.forEach((rule) => {
    if (!rule.selectors) {
      return;
    }
    rule.declarations.forEach((declaration) => {
      callback(declaration.property);
    });
  });
}

export function getCheerio(data: string): cheerio.Root {
  if (!data) {
    throw new Error("getCheerio(): no data");
  }
  return Cheerio.load(data);
}

export function getHTMLNode(data: string): cheerio.Cheerio {
  return getRoot(getCheerio(data)).children("html");
}

// to act on a file path: 1 = namespace, 2 = filename, 3 = ref, 4 = type, 5 = file suffix
const obj_regex_in_path =
  /\/([a-z]+)\/((([alsw])\-[a-z]+\-[a-z0-9\-]+)\.([a-z]+))$/;

interface FilepathParts {
  namespace: string;
  filename: string;
  object_id: string;
  type: "a" | "l" | "s" | "w";
  suffix: string;
}

export function getPartsFromFilepath(filepath: string): FilepathParts {
  const parts = obj_regex_in_path.exec(filepath);
  if (!parts || parts.length < 6) {
    throw new Error(`invalid path: ${filepath}`);
  }
  return {
    namespace: parts[1],
    filename: parts[2],
    object_id: parts[3],
    type: parts[4],
    suffix: parts[5],
  } as FilepathParts;
}

// to act on a reference: 1 = type, 2 = namespace, 3 = rest
const obj_regex_in_ref = /^([alsw])\-([a-z]+)\-([a-z0-9\-]+)$/;

interface ObjectIdParts {
  namespace: string;
  rest: string;
  type: "a" | "l" | "s" | "w";
}

export function getPartsFromObjectId(object_id: string): ObjectIdParts {
  const parts = obj_regex_in_ref.exec(object_id);
  if (!parts || parts.length < 4) {
    throw new Error(`invalid object id: ${object_id}`);
  }
  return {
    type: parts[1],
    namespace: parts[2],
    rest: parts[3],
  } as ObjectIdParts;
}

export function getPackage(path: string): any {
  return JSON.parse(
    Fs.readFileSync(path + "/package.json", {
      encoding: "utf8",
    })
  );
}

export function getRoot(cheerio: cheerio.Root): cheerio.Cheerio {
  return cheerio.root();
}

export function getRootElement(cheerio: cheerio.Root): cheerio.Cheerio {
  let div = getRoot(cheerio).children("html").children("body").children("*");
  if (div.length > 1) {
    div = div.parent();
  } else if (div.length === 0) {
    throw new Error(`getRootDiv() found no root node`);
  }
  return div;
}

export function getRootElementFromData(data: string): cheerio.Cheerio {
  return getRootElement(getCheerio(data));
}

export function isClassComponentPattern(class_name: string): boolean {
  return !!class_name.match(/^[lw]\-[\w\d]+\-[\w\d]+/);
}

export function isPatternClass(class_name: string): boolean {
  return class_name.indexOf("*") === class_name.length - 1;
}

export function isSignatureClassMatch(
  sig_class: string,
  test_class: string
): boolean {
  return (
    sig_class === test_class ||
    (isPatternClass(sig_class) &&
      test_class.indexOf(sig_class.substr(0, sig_class.length - 1)) === 0)
  );
}

export function loadFile(filename: string): string {
  return Fs.readFileSync(filename, {
    encoding: "utf8",
  });
}

export function parseClasses(
  class_list: string[],
  cb_req: (class_name: string) => void,
  cb_opt: (class_name: string) => void
): void {
  if (!class_list) {
    return;
  }
  class_list.forEach((class_name) => {
    if (class_name.substr(class_name.length - 1) === "?") {
      cb_opt(class_name.substr(0, class_name.length - 1));
    } else {
      cb_req(class_name);
    }
  });
}

export function processDir(
  dirname: string,
  pattern: RegExp,
  recurse: boolean,
  callback: (path: string) => void
): void {
  Fs.readdirSync(dirname, {
    encoding: "utf8",
  }).forEach((name) => {
    const path = dirname + "/" + name;
    const stats = Fs.lstatSync(path);
    if (stats.isFile() && (!pattern || pattern.exec(path))) {
      callback(path);
    }
    if (stats.isDirectory() && recurse) {
      processDir(path, pattern, recurse, callback);
    }
  });
}

export function splitClasses(class_list: string): string[] {
  return class_list ? class_list.trim().split(/\s+/) : [];
}

export function testClassMatches(
  sig_class_array: string[],
  test_class: string
): string {
  let match_class = null;
  sig_class_array.forEach((sig_class) => {
    if (!match_class && isSignatureClassMatch(sig_class, test_class)) {
      match_class = sig_class;
    }
  });
  return match_class;
}

// testedComponent() -> Reporter.instancesFound()

export function writeFile(filename: string, data: string): void {
  Fs.writeFileSync(filename, data, {
    encoding: "utf8",
  });
}
