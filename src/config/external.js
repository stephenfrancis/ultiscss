#!/usr/bin/env node

const Ultimake = require("ultimake");
const EntryPoint = require("../../dist/index.min");
const { exec, glob, run, task } = Ultimake.getBuildFunctions();

const project = EntryPoint.getProject();
project.addToBuild(exec, glob, task);
// const project = new Project();

// const { rule, task } = require("jake");

try {
  run();
} catch (e) {
  console.error(e);
}
