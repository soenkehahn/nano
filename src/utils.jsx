// @flow

import { type Rational } from "./rational";

export function wait(seconds: number | Rational): Promise<void> {
  const milliSeconds =
    (typeof seconds === "number" ? seconds : seconds.toNumber()) * 1000;
  return new Promise(resolve => {
    setTimeout(resolve, milliSeconds);
  });
}

export function iife<A>(fun: () => A): A {
  return fun();
}

type Printable = number | string | { toString: () => string };

export function print(...x: Array<Printable>) {
  console.log(x.map(f => f.toString()).join(", "));
}
