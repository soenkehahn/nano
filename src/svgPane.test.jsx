// @flow

import * as React from "react";
import { createElement } from "react";
import { ReactWrapper, mount } from "enzyme";
import { Resource, ResourceRender } from "./resource";
import { SceneStepper } from "./scene";
import { SvgPane } from "./svgPane";
import {
  mockSvgJsdomExtensions,
  setupSceneWrapper,
  setupTestConfig,
} from "./test/utils";
import { toClickEvent } from "./vector";

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

function update(wrapper: ReactWrapper<any>): void {
  wrapper.instance().forceUpdate();
  wrapper.update();
}

describe("SvgPane", () => {
  let wrapper: ReactWrapper<any>;

  beforeEach(() => {
    const svgPane = new SvgPane({
      width: 800,
      height: 600,
      zoomVelocity: 1.1,
    });
    class Updateable extends React.Component<{||}> {
      render = () =>
        createElement(() =>
          svgPane.render({
            onClick: () => {},
            drawSvgElements: () => <g />,
          }),
        );
    }
    wrapper = mount(<Updateable />);
    mockSvgJsdomExtensions(wrapper.find("svg"), { x: 400, y: 300 });
  });

  it("sets an initial viewBox", () => {
    expect(wrapper.find("svg").props().viewBox).toEqual("-400 -300 800 600");
  });

  describe("zoom", () => {
    it("allows to zoom out with a scroll wheel", () => {
      wrapper.simulate("wheel", { clientX: 400, clientY: 300, deltaY: 3 });
      update(wrapper);
      expect(wrapper.find("svg").props().viewBox).toEqual(
        [-400, -300, 800, 600].map(x => x * 1.1).join(" "),
      );
    });

    it("allows to zoom in with a scroll wheel", () => {
      wrapper.simulate("wheel", { clientX: 400, clientY: 300, deltaY: -3 });
      update(wrapper);
      expect(wrapper.find("svg").props().viewBox).toEqual(
        [-400, -300, 800, 600].map(x => x / 1.1).join(" "),
      );
    });

    it("zooms in on the mouse position", () => {
      wrapper.simulate("wheel", { clientX: 600, clientY: 200, deltaY: -3 });
      update(wrapper);
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
      update(wrapper);
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
      update(wrapper);
      expect(wrapper.find("svg").props().viewBox).toEqual("-410 -295 800 600");
    });

    it("handles multiple mouseMove events", () => {
      wrapper.simulate("mousedown");
      wrapper.simulate("mousemove", { movementX: 10, movementY: -5 });
      wrapper.simulate("mousemove", { movementX: 5, movementY: -10 });
      update(wrapper);
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
      update(wrapper);
      expect(wrapper.find("svg").props().viewBox).toEqual("-410 -295 800 600");
    });

    it("takes zoom factor into account", () => {
      wrapper.simulate("wheel", { clientX: 400, clientY: 300, deltaY: 3 });
      wrapper.simulate("mousedown");
      wrapper.simulate("mousemove", { movementX: 10, movementY: -5 });
      update(wrapper);
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
  const testConfig = setupTestConfig();

  const [wrapper] = setupSceneWrapper(testConfig);

  it("disables dragging when selecting a minion target", () => {
    wrapper()
      .find("#moveButton")
      .simulate("click");
    wrapper()
      .find("svg")
      .simulate("mousedown");
    wrapper()
      .find("svg")
      .simulate("mousemove", { movementX: 10, movementY: -5 });
    (expect(
      wrapper()
        .find("svg")
        .props().viewBox,
    ): any).toBeCloseToViewBox([-100, -100, 200, 200]);
  });

  it("enables dragging afterwards", () => {
    wrapper()
      .find("#moveButton")
      .simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 10, y: 10 }));
    wrapper().setProps({ timeDelta: 1 });
    wrapper()
      .find("svg")
      .simulate("mousedown");
    wrapper()
      .find("svg")
      .simulate("mousemove", { movementX: 10, movementY: -5 });
    wrapper().setProps({ timeDelta: 0.1 });
    (expect(
      wrapper()
        .find("svg")
        .props().viewBox,
    ): any).toBeCloseToViewBox([-110, -95, 200, 200]);
  });
});

describe("viewbox optimization", () => {
  const testConfig = setupTestConfig();

  const [wrapper, scene] = setupSceneWrapper(testConfig);

  it("includes objects that are in the viewBox", () => {
    scene().objects.resources = new Map([[0, new Resource({ x: 0, y: 0 })]]);
    wrapper().setProps({ timeDelta: 1 });
    expect(
      wrapper()
        .find(ResourceRender)
        .props().position,
    ).toEqual({ x: 0, y: 0 });
  });

  it("excludes objects that are not in the viewBox", () => {
    scene().objects.resources = new Map([[0, new Resource({ x: 150, y: 0 })]]);
    wrapper().setProps({ timeDelta: 1 });
    expect(
      wrapper()
        .find(ResourceRender)
        .exists(),
    ).toEqual(false);
  });

  it("includes objects that are not in the viewBox, but reach into it", () => {
    scene().objects.resources = new Map([[0, new Resource({ x: 109, y: 0 })]]);
    wrapper().setProps({ timeDelta: 1 });
    expect(
      wrapper()
        .find(ResourceRender)
        .exists(),
    ).toEqual(true);
  });
});
