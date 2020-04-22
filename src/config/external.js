#!/usr/bin/env node

const Ultimake = require("ultimake");
const EntryPoint = require("../../dist/EntryPoint");
const { run, task } = Ultimake.getBuildFunctions();
const project = EntryPoint.getProject();

EntryPoint.addToBuild(project, task);

run();
