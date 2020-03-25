
import * as Utils from "../main/Utils";
import Reporter from "../main/Reporter";
import Signature from "../main/Signature";


test("cardinality", () => {
  const div = Utils.getRootElement(Utils.getCheerio(Utils.loadFile("src/scss/demo/w-demo-complex.ejs")));
  const sig = Signature.createFromCheerioNode("demo", "w-demo-complex", div);
  const rep = new Reporter();

  sig.testMarkup(Utils.getRootElement(Utils.getCheerio(Utils.loadFile("src/__tests__/examples/cardinality_1.html"))), rep);
  expect(rep.count(">DEBUG")).toBe(0);

  rep.reset();
  sig.testMarkup(Utils.getRootElement(Utils.getCheerio(Utils.loadFile("src/__tests__/examples/cardinality_2.html"))), rep);
  expect(rep.get(0, "ERROR")).toEqual(
    { level: "error", msg: "w-demo-complex/0.0: (div) 1 is below lower-bound cardinality: 2,2", },
  );

  rep.reset();
  sig.testMarkup(Utils.getRootElement(Utils.getCheerio(Utils.loadFile("src/__tests__/examples/cardinality_3.html"))), rep);
  expect(rep.get(0, "ERROR")).toEqual(
    { level: "error", msg: "w-demo-complex/0.0: (div) 3 is above upper-bound cardinality: 2,2", },
  );

  rep.reset();
  sig.testMarkup(Utils.getRootElement(Utils.getCheerio(Utils.loadFile("src/__tests__/examples/cardinality_4.html"))), rep);
  expect(rep.count(">DEBUG")).toBe(0);

  const div2 = Utils.getRootElement(Utils.getCheerio(Utils.loadFile("src/scss/demo/w-demo-complex-2.ejs")));
  const sig2 = Signature.createFromCheerioNode("demo", "w-demo-complex-2", div2);

  rep.reset();
  sig2.testMarkup(Utils.getRootElement(Utils.getCheerio(Utils.loadFile("src/__tests__/examples/cardinality_5.html"))), rep);
  expect(rep.count(">DEBUG")).toBe(0);

});
