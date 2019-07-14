// @flow

import * as stepDriver from "./stepDriver";
import { wait } from "./utils";
import { fromInt, rational } from "./rational";

class Mock {
  count: number = 0;

  step: () => void = () => {
    this.count++;
  };
}

describe("stepDriver", () => {
  it("calls step asynchronously in the given time interval", async () => {
    const mock = new Mock();
    stepDriver.start(mock, rational(10, 1000));
    await wait(rational(5, 1000));
    expect(mock.count).toEqual(0);
    await wait(rational(10, 1000));
    expect(mock.count).toEqual(1);
  });

  it("calls step multiple times", async () => {
    const mock = new Mock();
    stepDriver.start(mock, rational(10, 1000));
    await wait(rational(5, 1000));
    expect(mock.count).toEqual(0);
    await wait(rational(50, 1000));
    expect(mock.count).toEqual(5);
  });
});
