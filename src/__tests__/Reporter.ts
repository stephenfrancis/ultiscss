
import Reporter from "../main/Reporter";


test("reporter", () => {
  const reporter = new Reporter();

  reporter.debug("do");
  reporter.info ("re");
  reporter.warn ("mi");
  reporter.error("fa");

  expect(reporter.get(0)).toEqual({ msg: "do", level: "debug", });
  expect(reporter.get(1)).toEqual({ msg: "re", level: "info" , });
  expect(reporter.get(2)).toEqual({ msg: "mi", level: "warn" , });
  expect(reporter.get(3)).toEqual({ msg: "fa", level: "error", });

  expect( reporter.collate()).toBe("DEBUG: do\nINFO: re\nWARN: mi\nERROR: fa\n");
  expect(reporter.collate("DEBUG")).toBe("do\n");
});

