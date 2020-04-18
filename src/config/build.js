#!/usr/bin/env node

const Process = require("process");
const Ultimake = require("ultimake");
const { run, task } = Ultimake.getBuildFunctions();
const file_list = {};

// source file lists
file_list.source_ts  = Ultimake.glob("src/!(__tests__)/**/*.ts");
file_list.target_ts  = file_list.source_ts
	.map   ((source_file) => "build/" + /src\/(.*)\.ts/.exec(source_file)[1] + ".js")
	.filter((target_file) => !/\.d\.js$/.exec(target_file));
file_list.distrib    = [ "dist/index.min.js" ];

// console.log(file_list.target_ts);

// Make Target Group 1: clean

task("clean", null, null, async () => {
	await Ultimake.exec(`rm -fr build/* dist/*`);
});


// Make Target Group 2: build

task("build_distrib", file_list.distrib, file_list.source_ts, async () => {
	await Ultimake.exec(`mkdir -p build/cache`);
	await Ultimake.exec(`rm -f -r dist/*`);
	await Ultimake.exec(`npx parcel build src/main/EntryPoint.ts -d dist --target node --bundle-node-modules --cache-dir build/cache --out-file index.min.js`);
});

task("build_separate_js", file_list.target_ts, file_list.source_ts, async () => {
	await Ultimake.exec("npx tsc", {
		cwd: Process.cwd() + "/src",
	});
});

task("build_assets", null, file_list.distrib, async () => {
	await Ultimake.exec(`cp -r src/assets/* build`);
	await Ultimake.exec(`./src/config/external.js ultiscss`);
});

task("build", null, file_list.target_ts.concat(file_list.distrib).concat([ "build_assets" ]), async () => {});


// Make Target Group 3: test

task("test", null, null, async () => {
	await Ultimake.exec(`rm -f -r build/project`);
	await Ultimake.exec(`cp -r src/__tests__/project build`);
	await Ultimake.exec(`cd build/project && mkdir -p blah_src && mkdir -p node_modules && cd node_modules && rm -f ultiscss && ln -s ../../.. ultiscss`);
	await Ultimake.exec(`npx jest --config=src/__tests__/jest.config.json`);
});


// Make Target Group 4: deploy

task("deploy", null, null, async () => {
	// exec(`npx ./src/bin/Program.js deploy ${props.branch}`);
});


task("version_click", null, null, async () => {
	const args = Ultimake.getArgs();
	Ultimake.versionClick(args._[1], args._[2] || "");
});


run();
