// @flow

import { type Rational } from "./rational";
import { wait } from "./utils";

export function start(object: { step: () => void }, timeDelta: Rational): void {
  async function loop() {
    await wait(timeDelta.toNumber());
    object.step();
    loop();
  }
  loop();
}
