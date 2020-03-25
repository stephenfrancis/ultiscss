
import * as Lib from "../main/Utils";
import Reporter from "../main/Reporter";
import Signature from "../main/Signature";

const makeNode = (node_map, elmt) => {
  return {
    "0": {
      "name": elmt,
    },
    "attr": (attr_id) => {
      return node_map[attr_id];
    },
    "children": () => {
      return {
        "each": () => {},
      };
    },
  } as unknown as Cheerio;
};


test("all signature", () => {

  const node1 = {
    "data-title": "Test Title",
    "data-hide": "false",
    "class": "l-test-main some-optional?"
  };

  const rep = new Reporter();
  const new_sig = Signature.createFromCheerioNode("test", "l-test-main", makeNode(node1, "div"));
  expect(new_sig.getId()).toBe("l-test-main");
  expect(new_sig.getTitle()).toBe("Test Title");
  expect(new_sig.getType()).toBe("l");
  expect(new_sig.toString()).toBe("[l-test-main] Test Title");
  expect(new_sig.getRootNode().toString()).toBe("<div.l-test-main.some-optional? />");


  new_sig.validate(rep);
  expect(rep.count()).toEqual(1);
  expect(rep.get(0, "WARN")).toEqual(
    { level: "warn", msg: "l-test-main/0: class name is not valid: some-optional" },
  );


  rep.reset();
  new_sig.testMarkup(makeNode({ // successful - optional class not present
    "class": "l-test-main"
  }, "div"), rep);
  expect(rep.count(">DEBUG")).toEqual(0);


  rep.reset();
  new_sig.testMarkup(makeNode({ // successful - optional class present
    "class": "l-test-main some-optional"
  }, "div"), rep);
  expect(rep.count(">DEBUG")).toEqual(0);


  rep.reset();
  new_sig.testMarkup(makeNode({ // failure - wrong class
    "class": "blah"
  }, "div"), rep);
  expect(rep.count(">DEBUG")).toEqual(2);
  expect(rep.get(0, "ERROR")).toEqual(
    { level: "error", msg: "l-test-main/0: class not allowed: blah", },
  );
  expect(rep.get(1, "ERROR")).toEqual(
    { level: "error", msg: "l-test-main/0: required class(es) not present: l-test-main", },
  );


  rep.reset();
  new_sig.testMarkup(makeNode({ // failure - no class
  }, "div"), rep);
  expect(rep.count(">DEBUG")).toEqual(1);
  expect(rep.get(0, "ERROR")).toEqual(
    { level: "error", msg: "l-test-main/0: required class(es) not present: l-test-main", },
  );


  rep.reset();
  new_sig.testMarkup(makeNode({ // failure - optional class only
    "class": "some-optional"
  }, "div"), rep);
  expect(rep.count(">DEBUG")).toEqual(1);
  expect(rep.get(0, "ERROR")).toEqual(
    { level: "error", msg: "l-test-main/0: required class(es) not present: l-test-main", },
  );


  rep.reset();
  new_sig.testMarkup(makeNode({ // failure - unrecognized class
    "class": "l-test-main blah"
  }, "div"), rep);
  expect(rep.count(">DEBUG")).toEqual(1);
  expect(rep.get(0, "ERROR")).toEqual(
    { level: "error", msg: "l-test-main/0: class not allowed: blah", },
  );

  rep.reset();
  new_sig.validateSCSS(".l-test-main { border: 1px solid blue; }", rep);
  expect(rep.count(">DEBUG")).toEqual(0);

  rep.reset();
  new_sig.validateSCSS(".l-blah { border: 1px solid blue; }", rep);
  expect(rep.count(">DEBUG")).toEqual(1);
  expect(rep.get(0, "ERROR")).toEqual(
    { level: "error", msg: "unrecognized class for signature: l-blah", },
  );

  rep.reset();
  new_sig.validateSCSS(".some-optional { text-decoration: underline; }", rep);
  expect(rep.count(">DEBUG")).toEqual(1);
  expect(rep.get(0, "ERROR")).toEqual(
    { level: "error", msg: "invalid CSS declaration for layout: text-decoration", },
  );

});


test("deep signature", () => {
  const div = Lib.getRootElement(Lib.getCheerio(Lib.loadFile("src/scss/demo/l-demo-main.ejs")));
  const sig = Signature.createFromCheerioNode("demo", "l-demo-main", div);
  expect(sig.getId()).toBe("l-demo-main");
  expect(sig.getTitle()).toBe("Main Demo Layout");
  expect(sig.getType()).toBe("l");
  expect(sig.toString()).toBe("[l-demo-main] Main Demo Layout");
  expect(sig.getRootNode().toString()).toBe(
    "<div.l-demo-main><div /><div><div /><div /><div.h-open? /></div><div /></div>");

  const node1 = {
    "data-title": "Test Title",
    "data-hide": "false",
    "class": "l-test-main some-optional? some-pat*"
  };

  expect(sig.includeElement(makeNode(node1, "div" ))).toBe(true);
  expect(sig.includeElement(makeNode(node1, "span"))).toBe(false);
});


test("class patterns", () => {
  let div = Lib.getRootElement(Lib.getCheerio(Lib.loadFile("src/scss/demo/w-demo-pattern.ejs")));
  let sig = Signature.createFromCheerioNode("demo", "w-demo-pattern", div);

  const rep = new Reporter();

  sig.validate(rep);
  expect(rep.count(">DEBUG")).toEqual(0);

  rep.reset();
  sig.testMarkup(Lib.getRootElement(Lib.getCheerio(Lib.loadFile("src/__tests__/examples/class_pattern_1.html"))), rep);
  expect(rep.count(">DEBUG")).toEqual(0);

  rep.reset();
  sig.testMarkup(Lib.getRootElement(Lib.getCheerio(Lib.loadFile("src/__tests__/examples/class_pattern_2.html"))), rep);
  expect(rep.count(">DEBUG")).toEqual(0);

  rep.reset();
  sig.testMarkup(Lib.getRootElement(Lib.getCheerio(Lib.loadFile("src/__tests__/examples/class_pattern_3.html"))), rep);
  expect(rep.count(">DEBUG")).toEqual(2);
  expect(rep.get(0, "ERROR")).toEqual(
    { level: "error", msg: "w-demo-pattern/0.0: class not allowed: fb-bobbins", },
  );
  expect(rep.get(1, "ERROR")).toEqual(
    { level: "error", msg: "w-demo-pattern/0.0: required class(es) not present: fa-*" },
  );

  // two classes in the markup that match the same pattern
  rep.reset();
  sig.testMarkup(Lib.getRootElement(Lib.getCheerio(Lib.loadFile("src/__tests__/examples/class_pattern_4.html"))), rep);
  expect(rep.count(">DEBUG")).toEqual(0);

  // pattern class is optional
  div = Lib.getRootElement(Lib.getCheerio(Lib.loadFile("src/scss/demo/w-demo-pattern-2.ejs")));
  sig = Signature.createFromCheerioNode("demo", "w-demo-pattern", div);

  rep.reset();
  sig.testMarkup(Lib.getRootElement(Lib.getCheerio(Lib.loadFile("src/__tests__/examples/class_pattern_1.html"))), rep);
  expect(rep.count(">DEBUG")).toEqual(0);

  rep.reset();
  sig.testMarkup(Lib.getRootElement(Lib.getCheerio(Lib.loadFile("src/__tests__/examples/class_pattern_2.html"))), rep);
  expect(rep.count(">DEBUG")).toEqual(0);

  rep.reset();
  sig.testMarkup(Lib.getRootElement(Lib.getCheerio(Lib.loadFile("src/__tests__/examples/class_pattern_3.html"))), rep);
  expect(rep.count(">DEBUG")).toEqual(1);
  expect(rep.get(0, "ERROR")).toEqual(
    { level: "error", msg: "w-demo-pattern/0.0: class not allowed: fb-bobbins", },
  );

  rep.reset();
  sig.testMarkup(Lib.getRootElement(Lib.getCheerio(Lib.loadFile("src/__tests__/examples/class_pattern_4.html"))), rep);
  expect(rep.count(">DEBUG")).toEqual(0);

});
