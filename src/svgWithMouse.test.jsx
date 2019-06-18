// @flow

import { Scene, mkSceneRender } from "./scene";
import { SvgWithMouse } from "./svgWithMouse";
import { mockSvgJsdomExtensions, setupTestConfig } from "./test/utils";
import { mount } from "enzyme";
import { toClickEvent } from "./vector";
import React from "react";

expect.extend({
  toBeCloseToViewBox(viewBox, expected) {
    const result = viewBox.split(" ").map(parseFloat);
    expect(result.length).toEqual(expected.length);
    let pass = true;
    const epsilon = 0.0001;
    for (let i = 0; i < result.length; i++) {
      if (Math.abs(result[i] - expected[i]) > epsilon) {
        pass = false;
      }
    }
    return {
      pass,
      message: () => this.utils.diff(result, expected),
    };
  },
});

describe("SvgWithMouse", () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(
      <SvgWithMouse
        width={800}
        height={600}
        zoomVelocity={1.1}
        onClick={() => {}}
      >
        <g />
      </SvgWithMouse>,
    );
    mockSvgJsdomExtensions(wrapper.find("svg"), { x: 400, y: 300 });
  });

  it("sets an initial viewBox", () => {
    expect(wrapper.find("svg").props().viewBox).toEqual("-400 -300 800 600");
  });

  describe("zoom", () => {
    it("allows to zoom out with a scroll wheel", () => {
      wrapper.simulate("wheel", { clientX: 400, clientY: 300, deltaY: 3 });
      expect(wrapper.find("svg").props().viewBox).toEqual(
        [-400, -300, 800, 600].map(x => x * 1.1).join(" "),
      );
    });

    it("allows to zoom in with a scroll wheel", () => {
      wrapper.simulate("wheel", { clientX: 400, clientY: 300, deltaY: -3 });
      expect(wrapper.find("svg").props().viewBox).toEqual(
        [-400, -300, 800, 600].map(x => x / 1.1).join(" "),
      );
    });

    it("zooms in on the mouse position", () => {
      wrapper.simulate("wheel", { clientX: 600, clientY: 200, deltaY: -3 });
      expect(wrapper.find("svg").props().viewBox).toEqual(
        [
          (-400 - 200) * (1 / 1.1) + 200,
          (-300 - -100) * (1 / 1.1) + -100,
          800 / 1.1,
          600 / 1.1,
        ].join(" "),
      );
    });

    it("zooms out the same", () => {
      wrapper.simulate("wheel", { clientX: 600, clientY: 200, deltaY: 3 });
      expect(wrapper.find("svg").props().viewBox).toEqual(
        [
          (-400 - 200) * (1 * 1.1) + 200,
          (-300 - -100) * (1 * 1.1) + -100,
          800 * 1.1,
          600 * 1.1,
        ].join(" "),
      );
    });
  });

  describe("mouse drag", () => {
    it("allows to drag the map", () => {
      wrapper.simulate("mousedown");
      wrapper.simulate("mousemove", { movementX: 10, movementY: -5 });
      expect(wrapper.find("svg").props().viewBox).toEqual("-410 -295 800 600");
    });

    it("handles multiple mouseMove events", () => {
      wrapper.simulate("mousedown");
      wrapper.simulate("mousemove", { movementX: 10, movementY: -5 });
      wrapper.simulate("mousemove", { movementX: 5, movementY: -10 });
      expect(wrapper.find("svg").props().viewBox).toEqual("-415 -285 800 600");
    });

    it("ignores non-dragging mouse movements", () => {
      wrapper.simulate("mousemove", { movementX: 10, movementY: -5 });
      expect(wrapper.find("svg").props().viewBox).toEqual("-400 -300 800 600");
    });

    it("ignores non-dragging mouse movements after dragging", () => {
      wrapper.simulate("mousedown");
      wrapper.simulate("mousemove", { movementX: 10, movementY: -5 });
      wrapper.simulate("mouseup");
      wrapper.simulate("mousemove", { movementX: 5, movementY: -10 });
      expect(wrapper.find("svg").props().viewBox).toEqual("-410 -295 800 600");
    });

    it("takes zoom factor into account", () => {
      wrapper.simulate("wheel", { clientX: 400, clientY: 300, deltaY: 3 });
      wrapper.simulate("mousedown");
      wrapper.simulate("mousemove", { movementX: 10, movementY: -5 });
      (expect(wrapper.find("svg").props().viewBox): any).toBeCloseToViewBox([
        -440 - 10 * 1.1,
        -330 + 5 * 1.1,
        880,
        660,
      ]);
    });
  });
});

describe("drag & minion interaction", () => {
  let wrapper;
  const testConfig = setupTestConfig();

  beforeEach(() => {
    const SceneRender = mkSceneRender(testConfig(), new Scene(testConfig()));
    wrapper = mount(<SceneRender time={0} timeDelta={0} />);
    mockSvgJsdomExtensions(wrapper.find("svg"), { x: 100, y: 100 });
  });

  it("disables dragging when selecting a minion target", () => {
    wrapper.find("#goButton").simulate("click");
    wrapper.find(SvgWithMouse).simulate("mousedown");
    wrapper
      .find(SvgWithMouse)
      .simulate("mousemove", { movementX: 10, movementY: -5 });
    (expect(wrapper.find("svg").props().viewBox): any).toBeCloseToViewBox([
      -100,
      -100,
      200,
      200,
    ]);
  });

  it("enables dragging afterwards", () => {
    wrapper.find("#goButton").simulate("click");
    wrapper.find("svg").simulate("click", toClickEvent({ x: 10, y: 10 }));
    wrapper.setProps({ timeDelta: 1 });
    wrapper.find(SvgWithMouse).simulate("mousedown");
    wrapper
      .find(SvgWithMouse)
      .simulate("mousemove", { movementX: 10, movementY: -5 });
    (expect(wrapper.find("svg").props().viewBox): any).toBeCloseToViewBox([
      -110,
      -95,
      200,
      200,
    ]);
  });
});
