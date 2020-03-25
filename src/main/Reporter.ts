

export default class Reporter {
  private collector: any[];
  private show_in_console: boolean;

  constructor() {
    this.collector = [];
    this.show_in_console = false;
  }


  public addToObject(obj: any, level_selector: string = ">ALL"): void {
    let oper = level_selector.substr(0, 1);
    if ((oper === "=") || (oper === "!") || (oper === ">") || (oper === "<")) {
      level_selector = level_selector.substr(1);
    } else {
      oper = "=";
    }
    this.collector.forEach((item) => {
      if (isLevelMatch(level_selector, item.level, oper)) {
        obj[item.level] = obj[item.level] || [];
        obj[item.level].push(item.msg);
      }
    });
  }


  public collate(level_selector: string = ">ALL"): string {
    let out = "";
    let oper = level_selector.substr(0, 1);
    if ((oper === "=") || (oper === "!") || (oper === ">") || (oper === "<")) {
      level_selector = level_selector.substr(1);
    } else {
      oper = "=";
    }
    this.collector.forEach((item) => {
      if ((oper === "=") && (getLevelIndex(level_selector) === getLevelIndex(item.level))) {
        out += item.msg + "\n";
      } else if (isLevelMatch(level_selector, item.level, oper)) {
        out += `${item.level.toUpperCase()}: ${item.msg}\n`;
      }
    });
    return out;
  }


  public count(level_selector: string = ">ALL"): number {
    if (level_selector === ">ALL") {
      return this.collector.length;
    }
    let oper = level_selector.substr(0, 1);
    if ((oper === "=") || (oper === "!") || (oper === ">") || (oper === "<")) {
      level_selector = level_selector.substr(1);
    } else {
      oper = "=";
    }
    return this.collector.reduce((prev: number, curr) => {
      return prev + (isLevelMatch(level_selector, curr.level, oper) ? 1 : 0);
    }, 0);
  }


  public debug(msg: string): void {
    this.do("debug", msg);
  }


  private do(level: string, msg: string): void {
    this.collector.push({
      level,
      msg,
    });
    if (this.show_in_console) {
      if (typeof console[level] === "function") {
        console[level](msg);
      } else {
        console.log(` ${level.toUpperCase()}: ${msg}`);
      }
    }
  }

  public forEach(callback: (item: any) => void): void {
    this.collector.forEach(callback);
  }


  public get(index: number, at_level?: string): any {
    if (at_level) {
      return this.collector.filter((curr) => (curr.level.toUpperCase() === at_level.toUpperCase()))[index];
    }
    return this.collector[index];
  }


  public info(msg: string): void {
    this.do("info" , msg);
  }


  public warn(msg: string): void {
    this.do("warn" , msg);
  }


  public error(msg: string): void {
    this.do("error", msg);
  }


  public instancesFound(component_id): number {
    let out = 0;
    this.collector.forEach((item) => {
      if ((item.level === "info")
          && (item.msg.indexOf("checking class " + component_id + " at position") === 0)
          && (item.msg.indexOf("against found signature") > -1)) {
        out += 1;
      }
    });
    return out;
  }


  public reset(): void {
    this.collector = [];
  }


  public showInConsole(arg: boolean): void {
    this.show_in_console = arg;
  }

}


const levels = [
  "ERROR",
  "WARN",
  "INFO",
  "DEBUG",
  "ALL",
];

function getLevelIndex(level: string): number {
  return levels.indexOf(level.toUpperCase());
}


function isLevelMatch(level_a: string, level_b: string, oper: string) {
  return (
       ((oper === "=") && (getLevelIndex(level_a) === getLevelIndex(level_b)))
    || ((oper === ">") && (getLevelIndex(level_a)  >  getLevelIndex(level_b)))
    || ((oper === "<") && (getLevelIndex(level_a)  <  getLevelIndex(level_b)))
    || ((oper === "!") && (getLevelIndex(level_a) !=  getLevelIndex(level_b)))
  );
}
