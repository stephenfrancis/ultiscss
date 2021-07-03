import ChildProcess from "child_process";
import * as Utils from "../main/Utils";

expect.extend({
  toMatchSnapshot(received, snapshot) {
    try {
      ChildProcess.execSync(`diff ${received} ${snapshot}`);
      return {
        message: () => `expected ${received} not to match snapshot`,
        pass: true,
      };
    } catch (e) {
      console.error(e);
      return {
        message: () =>
          `expected ${received} to match snapshot, instead they are different as follows:\n${e.output.join(
            "\n"
          )}`,
        pass: false,
      };
    }
  },
});

test("all snapshots", () => {
  expect.assertions(34);

  Utils.processDir("src/__tests__/snapshots", null, true, (snapshot_path) => {
    const asset_path = snapshot_path.replace(
      /src\/__tests__\/snapshots/,
      "build"
    );
    expect(asset_path).toMatchSnapshot(snapshot_path);
  });
});
