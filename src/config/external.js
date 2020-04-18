#!/usr/bin/env node

const Ultimake = require("ultimake");
const EntryPoint = require("../../dist/index.min");
const addToBuild = require("./addToBuild");
const { run, task } = Ultimake.getBuildFunctions();
const project = EntryPoint.getProject();

addToBuild(project, task);

run();
