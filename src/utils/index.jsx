// @flow

import * as React from "react";
import { type Rational } from "../rational";

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

export function filter<A>(array: Array<A>, predicate: A => boolean): Array<A> {
  let result: Array<A> = [];
  for (let element of array) {
    if (predicate(element)) {
      result.push(element);
    }
  }
  return result;
}

export function when(condition: boolean, node: () => React.Node): ?React.Node {
  if (condition) {
    return node();
  }
}

export function sepBy(
  separator: React.Node,
  elements: Array<React.Node>,
): React.Node {
  if (elements.length == 0) {
    return null;
  }
  const result = [];
  elements.forEach((element, i) => {
    if (i != 0) {
      result.push(<div key={`sep-${i}`}>{separator}</div>);
    }
    result.push(<div key={i}>{element}</div>);
  });
  return result;
}
