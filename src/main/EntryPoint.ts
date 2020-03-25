
import Project from "./Project";
// import RefObject from "./RefObject";
import Reporter from "./Reporter";
import Signature from "./Signature";
import * as Utils from "./Utils";


const project = new Project();

// export { default as addToBuild } from "./Build";

export { getCheerio, getPartsFromFilepath, getPartsFromObjectId, processDir } from "./Utils";


export function getInfo(object_id: string): void {
  console.log(JSON.stringify(project.getObject(object_id)));
}


export function getProject(): Project {
  return project;
}


export function getReporter(): Reporter {
  return new Reporter();
}


export function getSignature(component_id: string): Signature {
  return project.getSignature(component_id);
}


export function showNamespaces(): void {
  project.forEachNamespace((namespace: string) => {
    console.log(namespace);
  });
}


export function showSignature(component_id: string): void {
  console.log(project.getSignature(component_id).display());
}


export function showSignatures(): void {
  project.forEachComponent((sig: Signature) => {
    console.log(sig.display());
  });
}


export function testFile(filename: string): Reporter {
  const reporter = new Reporter();
  project.testMarkup(Utils.loadFile(filename), reporter);
  return reporter;
}


export function testMarkup(data: string): Reporter {
  const reporter = new Reporter();
  project.testMarkup(data, reporter);
  return reporter;
}
