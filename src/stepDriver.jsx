// @flow

import { type Rational } from "./data/rational";
import { wait } from "./utils";

export function start(
  object: { step: () => Promise<void> },
  timeDelta: Rational,
): void {
  startLoop(object, timeDelta);
}

async function startLoop(object, timeDelta): Promise<void> {
  let lastRun: number | null = null;
  while (true) {
    if (lastRun !== null) {
      const waitTime = timeDelta.toNumber() - (Date.now() - lastRun) / 1000;
      await wait(waitTime);
    }
    lastRun = Date.now();
    await object.step();
  }
}
