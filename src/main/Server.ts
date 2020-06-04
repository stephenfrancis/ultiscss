
import Ejs from "ejs";
import Express from "express";
import * as EntryPoint from "./EntryPoint";

const app: Express.Application = Express();
const cwd: string = process.cwd();
const project = EntryPoint.getProject();
const ultiscss_path = cwd + (project.isUltiscss() ? "" : "/node_modules/ultiscss");


app.get("/gallery/:template.html", (req: Express.Request, res: Express.Response) => {
  const template = ultiscss_path + "/src/assets/gallery/" + req.params.template + ".ejs";
  const data = {
    gallery_head_include_file: project.getGalleryHeadIncludeFile(),
  };

  Ejs.renderFile(template, data, {}, (err, str: string) => {
    if (err) {
      console.error(err);
      res.writeHead(500);
      res.end(err);
    } else {
      res.writeHead(200);
      res.end(str);
    }
  });
});

app.use("/gallery",
  Express.static(ultiscss_path + "/src/assets/gallery"));

  app.use(Express.static(cwd           + "/node_modules"));
  app.use(Express.static(ultiscss_path + "/node_modules"));

app.use(Express.static(cwd + "/build"));

export default app;
