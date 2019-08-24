// @flow

import * as React from "react";
import { type Animated, animate } from "./animated";
import { createElement } from "react";
import { mount } from "enzyme";
import { wait } from "./utils";

let wrapper;

afterEach(() => {
  wrapper.unmount();
});

it("re-renders the given object in a loop", async () => {
  let counter = 0;
  const mock: Animated = {
    draw: () => {
      counter += 1;
      return <div />;
    },
  };
  wrapper = mount(createElement(animate(mock)));
  await waitUntil(() => counter > 10, 0.5);
});

async function waitUntil(predicate: () => boolean, seconds): Promise<void> {
  if (predicate() || seconds <= 0) {
    return;
  } else {
    await wait(0.01);
    await waitUntil(predicate, seconds - 0.01);
  }
}
