
import Cp from "child_process";
import Project from "../main/Project";
import Reporter from "../main/Reporter";
import * as Utils from "../main/Utils";


test("multiple components", () => {
  const rep = new Reporter();
  const project = new Project();

  let root_div = Utils.getRootElement(Utils.getCheerio(Utils.loadFile("src/__tests__/examples/multiple_components_1.html")));
  project.testMarkup(root_div, rep);
  // console.log("testMarkup() output: " + rep.collate());
  expect(rep.collate("ERROR")).toEqual([
    "w-demo-h1/0: unexpected child <i> at index 0, expecting nothing",
    "component not recognized: w-demo-main",
    "",
  ].join("\n"));

  rep.reset();
  root_div = Utils.getRootElement(Utils.getCheerio(Utils.loadFile("src/__tests__/examples/multiple_components_2.html")));
  project.testMarkup(root_div, rep);
  // console.log("testMarkup() output: " + rep.collate("ERROR"));
  expect(rep.collate("ERROR")).toEqual([
    "l-demo-main/0.2: component not allowed: w-demo-h1",
    // "component not recognized: w-demo-pattern",
    "w-demo-h1/0: unexpected child <i> at index 0, expecting nothing",
    "",
  ].join("\n"));

});


test.only("a different package.json file", () => {
  // console.log(`DOING a different package.json file, cwd: ${process.cwd()}`);
  const output = Cp.execSync("node ../../src/config/external.js uruguay", {
    encoding: "utf8",
    cwd: process.cwd() + "/build/project"
  });
  expect(output).toEqual(expect.stringMatching(/project example_project:1 blah_src -> blah_tgt initialised/));
});


test("object references", () => {
  const project = new Project();

  project.loadSourceReferences();

  expect(project.getObject("s-base-main")).toEqual(expect.objectContaining({
    id: "s-base-main",
    referenced_by: expect.arrayContaining([
      "s-demo-entry",
      "s-demo-other",
    ]),
  }));

  expect(project.getObject("s-demo-entry")).toEqual(expect.objectContaining({
    id: "s-demo-entry",
    references: expect.arrayContaining([
      "s-base-main",
      "s-demo-other",
      "l-demo-main",
      "w-demo-h1",
    ]),
  }));

  expect(project.getObject("s-demo-other")).toEqual(expect.objectContaining({
    id: "s-demo-other",
    references: expect.arrayContaining([
      "s-base-main",
      "w-demo-complex",
    ]),
    referenced_by: expect.arrayContaining([
      "s-demo-entry",
    ]),
  }));

  expect(project.getObject("s-demo-unused")).toEqual(expect.objectContaining({
    id: "s-demo-unused",
    references: expect.arrayContaining([
      "w-demo-pattern",
    ]),
  }));

});

