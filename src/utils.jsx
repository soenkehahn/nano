// @flow

export function wait(seconds: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000);
  });
}

export function iife<A>(fun: () => A): A {
  return fun();
}
