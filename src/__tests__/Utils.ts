
import * as Utils from "../main/Utils";


test("get from filename", () => {
  expect(Utils.getPartsFromFilepath("build/blah/a-blah-foo.html").type).toEqual("a");
  expect(Utils.getPartsFromFilepath("build/blah/a-blah-foo.html").namespace).toEqual("blah");
  expect(Utils.getPartsFromFilepath("build/blah/a-blah-foo.html").object_id).toEqual("a-blah-foo");
  expect(Utils.getPartsFromFilepath("build/blah/a-blah-foo.html").filename).toEqual("a-blah-foo.html");
  expect(Utils.getPartsFromFilepath("build/blah/a-blah-foo.html").suffix).toEqual("html");
  expect(Utils.getPartsFromFilepath("build/blah/a-foo-bar.html").namespace).toEqual("blah");
  expect(Utils.getPartsFromFilepath("build/blah/a-foo-bar.html").filename).toEqual("a-foo-bar.html");
  expect(Utils.getPartsFromFilepath("build/blah/a-foo-bar.html").object_id).toEqual("a-foo-bar");
  expect(() => { Utils.getPartsFromFilepath("build/blah/a-bar.html") }).toThrow();
  expect(() => { Utils.getPartsFromFilepath("build/blah/blah-foo.html") }).toThrow();

  expect(Utils.getPartsFromFilepath("src/scss/blah/l-blah-foo.scss").type).toEqual("l");
  expect(Utils.getPartsFromFilepath("src/scss/blah/l-blah-foo.scss").namespace).toEqual("blah");
  expect(Utils.getPartsFromFilepath("src/scss/blah/l-blah-foo.scss").object_id).toEqual("l-blah-foo");
  expect(Utils.getPartsFromFilepath("src/scss/blah/l-blah-foo.scss").suffix).toEqual("scss");
  expect(Utils.getPartsFromFilepath("src/scss/blah/w-a-bar.scss").namespace).toEqual("blah");
  expect(Utils.getPartsFromFilepath("src/scss/blah/w-a-bar.scss").object_id).toEqual("w-a-bar");
  expect(() => { Utils.getPartsFromFilepath("src/scss/blah/z-blah-foo.scss") }).toThrow();
});


test("parse classes", () => {
  let req = [];
  let opt = [];

  Utils.parseClasses(["do", "re?", "mi", "fa", "so?"],
    (cl) => { req.push(cl); },
    (cl) => { opt.push(cl); }
  );

  expect(req.join(",") === "do,mi,fa");
  expect(opt.join(",") === "re,so");
});


test("process dirs", () => {
  let files = [];
  Utils.processDir("src/main", /\.ts$/, true, (filename) => {
    files.push(filename);
    // console.log(filename);
  });
  expect(files).toEqual([
    "src/main/Build.ts",
    "src/main/EntryPoint.ts",
    "src/main/Node.ts",
    "src/main/Project.ts",
    "src/main/RefObject.ts",
    "src/main/Reporter.ts",
    "src/main/Server.ts",
    "src/main/Signature.ts",
    "src/main/Types.ts",
    "src/main/Utils.ts",
  ]);
});


test("CSS AST walking", () => {
  const ast = {
    "type": "stylesheet",
    "stylesheet": {
      "rules": [
        {
          "type": "rule",
          "selectors": [
            "body",
            ".classA",
            ".classA.class-B",
            "div.class_C",
            "a.classD:hover"
          ],
          "declarations": [
            {
              "type": "declaration",
              "property": "background",
              "value": "#eee",
              "position": {
                "start": {
                  "line": 2,
                  "column": 3
                },
                "end": {
                  "line": 2,
                  "column": 19
                }
              }
            },
            {
              "type": "declaration",
              "property": "color",
              "value": "#888",
              "position": {
                "start": {
                  "line": 3,
                  "column": 3
                },
                "end": {
                  "line": 3,
                  "column": 14
                }
              }
            }
          ],
          "position": {
            "start": {
              "line": 1,
              "column": 1
            },
            "end": {
              "line": 4,
              "column": 2
            }
          }
        }
      ]
    }
  };

  let arr = [];
  Utils.forEachClassInCSS(ast, (class_name) => {
    arr.push(class_name);
  });
  expect(arr).toEqual([ "classA", "classA", "class-B", "class_C", "classD" ]);

  arr = [];
  Utils.forEachPropertyInCSS(ast, (property_name) => {
    arr.push(property_name);
  });
  expect(arr).toEqual([ "background", "color" ]);
});
