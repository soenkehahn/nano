// @flow

import * as stepDriver from "./stepDriver";
import { rational } from "./rational";
import { wait } from "./utils";

class Mock {
  count: number = 0;
  wait: number | null = null;
  concurrencyCounter: number = 0;
  maxConcurrency: number = 0;

  step: () => Promise<void> = async () => {
    this.concurrencyCounter++;
    this.maxConcurrency = Math.max(
      this.concurrencyCounter,
      this.maxConcurrency,
    );
    this.count++;
    if (this.wait !== null) {
      await wait(this.wait);
    }
    this.concurrencyCounter--;
  };
}

function multipleTries(
  test: () => Promise<void>,
  n?: number = 0,
): () => Promise<void> {
  return async () => {
    if (n > 10) {
      throw "test failed 10 times";
    }
    try {
      await test();
    } catch (e) {
      multipleTries(test, n + 1);
    }
  };
}

describe("stepDriver", () => {
  it("calls step asynchronously in the given time interval", async () => {
    const mock = new Mock();
    stepDriver.start(mock, rational(10, 1000));
    await wait(rational(5, 1000));
    expect(mock.count).toEqual(1);
  });

  it(
    "calls step multiple times",
    multipleTries(async () => {
      const mock = new Mock();
      stepDriver.start(mock, rational(10, 1000));
      await wait(rational(45, 1000));
      expect(mock.count).toEqual(5);
    }),
  );

  it(
    "runs longer running operations as often as faster ones",
    multipleTries(async () => {
      const mock = new Mock();
      mock.wait = 5 / 1000;
      stepDriver.start(mock, rational(10, 1000));
      await wait(rational(45, 1000));
      expect(mock.count).toEqual(5);
    }),
  );

  it("does not run operations concurrently", async () => {
    const mock = new Mock();
    mock.wait = 20 / 1000;
    stepDriver.start(mock, rational(10, 1000));
    await wait(rational(65, 1000));
    expect(mock.maxConcurrency).toEqual(1);
  });
});
