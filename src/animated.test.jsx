// @flow

import { animated } from "./animated";
import { mount } from "enzyme";
import { wait } from "./utils";
import React, { createElement } from "react";

let propsList;
let wrapper;

beforeEach(async () => {
  propsList = [];
  class Mock extends React.Component<{ time: number, timeDelta: number }> {
    render() {
      propsList.push(this.props);
      return <div />;
    }
  }
  wrapper = mount(createElement(animated(null, Mock)));
  await waitUntil(() => propsList.length > 10, 0.5);
});

afterEach(() => {
  wrapper.unmount();
});

it("passes in new props for every new animation frame", async () => {
  expect(propsList.length).toBeGreaterThan(10);
});

it("passes in a monotonically increasing time as a prop", async () => {
  for (let i = 1; i < propsList.length; i++) {
    expect(propsList[i].time).toBeGreaterThan(propsList[i - 1].time);
  }
});

it("passes in the timeDelta to the last rendering", async () => {
  for (let i = 1; i < propsList.length; i++) {
    expect(propsList[i].timeDelta).toEqual(
      propsList[i].time - propsList[i - 1].time
    );
  }
});

async function waitUntil(
  predicate: () => boolean,
  seconds = 4.5
): Promise<void> {
  if (predicate() || seconds <= 0) {
    return;
  } else {
    await wait(0.01);
    await waitUntil(predicate, seconds - 0.01);
  }
}
