// @flow

import { type Rational } from "./rational";
import { wait } from "./utils";

export function start(
  object: { step: () => Promise<void> },
  timeDelta: Rational,
): void {
  let lastRun: number | null = null;
  async function loop() {
    if (lastRun !== null) {
      const waitTime = timeDelta.toNumber() - (Date.now() - lastRun) / 1000;
      await wait(waitTime);
    }
    lastRun = Date.now();
    await object.step();
    loop();
  }
  loop();
}
