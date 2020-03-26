
import Fs from "fs";
import Ultimake from "ultimake";
import { ExecFunction, GlobFunction, TaskFunction } from "ultimake/src/Types";
import Project from "./Project";
import * as Utils from "./Utils";
// const EntryPoint = require("../../dist/index.min.js");


export default function (project: Project,
    exec: ExecFunction,
    glob: GlobFunction,
    task: TaskFunction,
    aggreg_html_deps?: string[]) {

  console.log(project.toString());

  const source_prefix = project.getSourceDir();
  const target_prefix = project.getTargetDir();


  // helper functions

  const makeHTML = function (target: string): Promise<void> {
    // console.log(`makeHTML() ${this.name}, ${this.prereqs}, ${this.prereq}, ${this.source}`);
    // ongoing issue: how to access prereqs inside these recipe functions?
    const  ejs_file = convertTargetHtmlToSourceEjs(target);
    const html_file = target;
    Ultimake.createDir(html_file);
    return project.convertEJSFile(ejs_file)
      .then(() => {});
      // const require_file = ; console.log(`makeHTML() done ${require_file}`);
    // } catch (e) { // promake is very reticent on logging failures in recipes...
    //   console.log(`makeHTML() ${ejs_file} -> ${html_file}`);
    //   console.error(e);
    // }
  };

  const makeJSON = async function (targets: string, prereqs: string, name: string): Promise<void> {
    // console.log(`makeJSON() ${name}, ${targets}, ${prereqs}`);
    const json_file = targets;
    const parts = Utils.getPartsFromFilepath(targets);
    // console.log(`makeJSON() ${parts.object_id} -> ${json_file}`);
    Ultimake.createDir(json_file);
    const data = project.getObjectData(parts.object_id);
    Fs.writeFileSync(json_file, JSON.stringify(data, null, "  "), {
      encoding: "UTF-8",
    });
    // exec(`touch ${this.name}`);
  };

  // converters
  const json_file_regexp = new RegExp(target_prefix + "([a-z\-0-9\/]+).json$");
  const html_file_regexp = new RegExp(target_prefix + "([a-z\-0-9\/]+).html$");

  const convertTargetJsonToSourceEjs = Ultimake.convert(json_file_regexp, source_prefix, ".ejs");
  const convertTargetJsonToTargetCss = Ultimake.convert(json_file_regexp, target_prefix, ".css");
  const convertTargetHtmlToSourceEjs = Ultimake.convert(html_file_regexp, source_prefix, ".ejs");
  const convertTargetCssToPublicCss  = Ultimake.convert(new RegExp(target_prefix + ".*(/[a-z\-0-9]+).css"), target_prefix + "/public/css", ".css");
  const convertSourceEjsToTargetJson = Ultimake.convertSourceToTarget(source_prefix, target_prefix, ".ejs" , ".json");
  const convertSourceEjsToTargetHtml = Ultimake.convertSourceToTarget(source_prefix, target_prefix, ".ejs" , ".html");
  const convertSourceEjsToTargetScss = Ultimake.convertSourceToTarget(source_prefix, target_prefix, ".ejs" , ".scss");
  const convertSourceEjsToTargetCss  = Ultimake.convertSourceToTarget(source_prefix, target_prefix, ".ejs" , ".css");
  const convertSourceScssToTargetCss = Ultimake.convertSourceToTarget(source_prefix, target_prefix, ".scss", ".css");

  const file_list: { [key: string]: string[] } = {};

  // source file lists
  file_list.layout_ejs  = glob(source_prefix + "/**/l-*.ejs");
  file_list.layout_scss = glob(source_prefix + "/**/l-*.scss");
  file_list.widget_ejs  = glob(source_prefix + "/**/w-*.ejs");
  file_list.widget_scss = glob(source_prefix + "/**/w-*.scss");
  file_list.templt_ejs  = glob(source_prefix + "/**/s-*.ejs");
  file_list.aggreg_ejs  = glob(source_prefix + "/**/a-*.ejs");
  file_list.gallery_src = glob((project.isUltiscss() ? "" : "node_modules/ultiscss/") + "src/assets/gallery/*");

  // intermediary and target file lists
  file_list.uicomp_ejs  = file_list.layout_ejs .concat(file_list.widget_ejs );
  file_list.uicomp_json = file_list.uicomp_ejs .map(convertSourceEjsToTargetJson);
  file_list.uicomp_html = file_list.uicomp_ejs .map(convertSourceEjsToTargetHtml);
  file_list.uicomp_scss = file_list.layout_scss.concat(file_list.widget_scss);
  file_list.uicomp_css  = file_list.uicomp_scss.map(convertSourceScssToTargetCss);

  file_list.templt_scss = file_list.templt_ejs .map(convertSourceEjsToTargetScss);
  file_list.templt_json = file_list.templt_ejs .map(convertSourceEjsToTargetJson);
  file_list.templt_css  = file_list.templt_ejs .map(convertSourceEjsToTargetCss);

  file_list.aggreg_json = file_list.aggreg_ejs .map(convertSourceEjsToTargetJson);
  file_list.aggreg_scss = file_list.aggreg_ejs .map(convertSourceEjsToTargetScss);
  file_list.aggreg_css  = file_list.aggreg_ejs .map(convertSourceEjsToTargetCss);
  file_list.aggreg_html = file_list.aggreg_ejs .map(convertSourceEjsToTargetHtml);

  file_list.public_css  = file_list.templt_css .map(convertTargetCssToPublicCss);

  file_list.all____json = file_list.uicomp_json
    .concat(file_list.templt_json)
    .concat(file_list.aggreg_json);

  const objects_file = target_prefix + "/ultiscss/objects.json";
  const summary_file = target_prefix + "/ultiscss/summary.json";

  file_list.gallery_tgt = file_list.gallery_src
    .map(path => path.replace(/^.*src\/assets/, target_prefix));


  file_list.all         = file_list.all____json
    .concat(file_list.uicomp_html)
    .concat(file_list.aggreg_html)
    .concat(file_list.uicomp_css)
    .concat(file_list.templt_css)
    .concat(file_list.aggreg_css)
    .concat(file_list.public_css)
    .concat(file_list.gallery_tgt)
    .concat([ objects_file, summary_file ]);


  // uicomp - l-ayouts and w-idgets

  task("build_uicomp_json", null, file_list.uicomp_json, async () => {}, {
    description: "build UI Component JSON",
  });

  file_list.uicomp_json.forEach((json_file) => {
    const ejs_file = convertTargetJsonToSourceEjs(json_file);
    const css_file = convertTargetJsonToTargetCss(json_file);
    // console.log(`making uicomp JSON rule ${ejs_file} -> ${json_file}`);
    task(null, json_file, [ ejs_file, css_file ], makeJSON);
  });


  task("build_uicomp_html", null, file_list.uicomp_html, async () => {}, {
    description: "build UI Component HTML",
  });

  file_list.uicomp_html.forEach((html_file) => {
    const ejs_file = convertTargetHtmlToSourceEjs(html_file);
    // console.log(`making uicomp HTML rule ${ejs_file} -> ${html_file}`);
    task(null, html_file, ejs_file, makeHTML);
  });



  task("build_uicomp_css", file_list.uicomp_css , file_list.uicomp_scss, async () => {
    const path_regex = new RegExp("(^" + target_prefix + ".*?)\/[^\/]+.css$");
    file_list.uicomp_css
      .map((path) => path_regex.exec(path)[1])
      .forEach((path) => {
        Ultimake.createDir(path);
      });
    await Ultimake.exec(`npx node-sass -q -r ${source_prefix} --output ${target_prefix}`);
  }, {
    description: "build UI Component CSS",
  });


  // templt - s-erver templates

  task("build_templt_json", null, file_list.templt_json, async () => {}, {
    description: "build template JSON",
  });

  file_list.templt_json.forEach((json_file) => {
    const ejs_file = convertTargetJsonToSourceEjs(json_file);
    // console.log(`making templt JSON rule ${ejs_file} -> ${json_file}`);
    task(null, json_file, ejs_file, makeJSON);
  });



  task("build_templt_scss", file_list.templt_scss, file_list.all____json, async () => {
    // console.log(`making template SCSS...`);
    file_list.templt_scss.forEach((path) => {
      const parts = Utils.getPartsFromFilepath(path);
      // console.log(`creating templt SCSS for ${parts.object_id}`);
      project.generateSCSSFileForObject(parts.object_id);
    });
  }, {
    description: "build template JSON",
  });


  // aggreg - a-ggregate templates

  task("build_aggreg_json", null, file_list.aggreg_json, async () => {}, {
    description: "build aggregate JSON",
  });

  file_list.aggreg_json.forEach((json_file) => {
    const ejs_file = convertTargetJsonToSourceEjs(json_file);
    const html_file = json_file.replace(/\.json$/, ".html");
    // console.log(`making aggreg HTML rule ${ejs_file} -> ${html_file}`);
    task(null, json_file, [ ejs_file, html_file ], makeJSON);
  });


  task("build_aggreg_html", null, file_list.aggreg_html, async () => {}, {
    description: "build aggregate HTML",
  });

  file_list.aggreg_html.forEach((html_file) => {
    const ejs_file = convertTargetHtmlToSourceEjs(html_file);
    const prereq = aggreg_html_deps ? aggreg_html_deps.concat([ ejs_file ] ) : ejs_file;
    // console.log(`making aggreg HTML rule ${ejs_file} -> ${html_file}`);
    task(null, html_file, prereq, makeHTML);
  });


  task("build_aggreg_scss", file_list.aggreg_scss, file_list.all____json, async () => {
    file_list.aggreg_scss.forEach((path) => {
      const parts = Utils.getPartsFromFilepath(path);
      project.generateSCSSFileForObject(parts.object_id);
    });
  }, {
    description: "build aggreg json",
  });


  // target css - s- and a- generated SCSS -> CSS

  task("compile_target_css_to_scss", [ ...file_list.templt_css, ...file_list.aggreg_css ], [ ...file_list.templt_scss, ...file_list.aggreg_scss ], async () => {
    await Ultimake.exec(`npx node-sass -q -r ${target_prefix} --output ${target_prefix}`);
  });

  // console.log(` public_css: ${file_list.public_css}`);
  // console.log(` templt_css: ${file_list.templt_css}`);

  task("copy_public_css", file_list.public_css, file_list.templt_css , () => {
    Ultimake.createDir(`${target_prefix}/public/css/`);
    const promises = file_list.templt_css
      .map(templt_css => Ultimake.basedir(templt_css))
      .sort()
      .filter((elem, index, array) => (index === 0) || (elem !== array[index - 1]))
      .map((dir) => {
        // console.log(`copying ${dir}/s-*.css to ${target_prefix}/public/css`);
        return Ultimake.exec(`cp ${dir}/s-*.css ${target_prefix}/public/css`);
      });
    return Promise.all(promises);
  });


  // summary JSON

  task("make_objects_file", objects_file, file_list.all____json, async () => {
    Ultimake.createDir(objects_file);
    const data = project.getObjects();
    Fs.writeFileSync(objects_file, JSON.stringify(data, null, "  "), {
      encoding: "UTF-8",
    });
  });


  task("make_summary_file", summary_file, file_list.all____json, async () => {
    Ultimake.createDir(summary_file);
    const data = project.makeSummary();
    Fs.writeFileSync(summary_file, JSON.stringify(data, null, "  "), {
      encoding: "UTF-8",
    });
  });


  task("copy_gallery_files", file_list.gallery_tgt, file_list.gallery_src, async () => {
    let cmd = "mkdir -p " + target_prefix + "/gallery; cp ";
    if (!project.isUltiscss()) {
      cmd += "node_modules/ultiscss/";
    }
    cmd += "src/assets/gallery/* " + target_prefix + "/gallery";
    // console.log(`copy_gallery_files: ${cmd}`);
    await Ultimake.exec(cmd);
  });


  // complete build

  task("ultiscss", null, file_list.all, async () => {}, {
    description: "ultiscss complete build",
  })

}
