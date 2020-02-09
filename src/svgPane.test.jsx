// @flow

import * as React from "react";
import { ReactWrapper, mount } from "enzyme";
import { Resource, ResourceRender } from "./resource";
import { type Size, SvgPane } from "./svgPane";
import { createElement } from "react";
import {
  mockSvgJsdomExtensions,
  setupSceneWrapper,
  setupTestConfig,
} from "./test/utils";
import {
  setupEventListenerTracker,
  simulateWheelEvent,
} from "./test/eventListeners";
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
  const eventListenerTracker = setupEventListenerTracker();

  let svgPane: SvgPane;
  let wrapper: ReactWrapper<any>;

  beforeEach(() => {
    svgPane = new SvgPane({
      width: 800,
      height: 600,
      zoomVelocity: 1.1,
    });
    class Updateable extends React.Component<Size> {
      render = () =>
        createElement(() =>
          svgPane.draw(
            {
              onClick: () => {},
              drawSvgElements: () => <g />,
            },
            this.props,
          ),
        );
    }
    wrapper = mount(<Updateable width={800} height={600} />);
    mockSvgJsdomExtensions(wrapper.find("svg"), { x: 400, y: 300 });
  });

  it("sets an initial viewBox", () => {
    expect(wrapper.find("svg").props().viewBox).toEqual("-400 -300 800 600");
  });

  describe("size", () => {
    it("recenters the viewbox", () => {
      wrapper.setProps({ width: 810, height: 610 });
      expect(wrapper.find("svg").props().viewBox).toEqual("-405 -305 810 610");
    });
  });

  describe("zoom", () => {
    it("allows to zoom out with a scroll wheel", () => {
      simulateWheelEvent({
        clientX: 400,
        clientY: 300,
        deltaMode: 1,
        deltaY: 3,
      });
      update(wrapper);
      expect(wrapper.find("svg").props().viewBox).toEqual(
        [-400, -300, 800, 600].map(x => x * 1.1).join(" "),
      );
    });

    it("allows to zoom in with a scroll wheel", () => {
      simulateWheelEvent({
        clientX: 400,
        clientY: 300,
        deltaMode: 1,
        deltaY: -3,
      });
      update(wrapper);
      expect(wrapper.find("svg").props().viewBox).toEqual(
        [-400, -300, 800, 600].map(x => x / 1.1).join(" "),
      );
    });

    it("zooms in on the mouse position", () => {
      simulateWheelEvent({
        clientX: 600,
        clientY: 200,
        deltaMode: 1,
        deltaY: -3,
      });
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
      simulateWheelEvent({
        clientX: 600,
        clientY: 200,
        deltaMode: 1,
        deltaY: 3,
      });
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

    it("takes the event's deltaMode into account", () => {
      simulateWheelEvent({
        clientX: 400,
        clientY: 300,
        deltaMode: 0,
        deltaY: 53,
      });
      update(wrapper);
      expect(wrapper.find("svg").props().viewBox).toEqual(
        [-400, -300, 800, 600].map(x => x * 1.1).join(" "),
      );
    });

    describe("disables page scrolling", () => {
      it("sets the EventListener to 'passive'", () => {
        expect(eventListenerTracker.getEventListeners().length).toEqual(1);
        const eventListener = eventListenerTracker.getEventListeners()[0];
        expect(eventListener.eventType).toEqual("wheel");
        expect(eventListener.options).toEqual({ passive: false });
      });

      it("calls preventDefault on events", () => {
        let called = false;
        simulateWheelEvent(
          {
            clientX: 600,
            clientY: 200,
            deltaMode: 1,
            deltaY: 3,
          },
          () => {
            called = true;
          },
        );
        update(wrapper);
        expect(called).toEqual(true);
      });
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
      simulateWheelEvent({
        clientX: 400,
        clientY: 300,
        deltaMode: 1,
        deltaY: 3,
      });
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

    describe("setCenter", () => {
      it("allows to center the viewBox", () => {
        svgPane.setCenter({ x: 3, y: 4 });
        update(wrapper);
        expect(wrapper.find("svg").props().viewBox).toEqual(
          "-397 -296 800 600",
        );
      });

      it("takes the current zoom into account", () => {
        svgPane.zoomFactor = 2;
        svgPane.setCenter({ x: 3, y: 4 });
        update(wrapper);
        expect(wrapper.find("svg").props().viewBox).toEqual(
          "-797 -596 1600 1200",
        );
      });
    });
  });
});

describe("drag & minion interaction", () => {
  const testConfig = setupTestConfig();

  const { wrapper, update, step } = setupSceneWrapper(testConfig);

  it("disables dragging when selecting a minion target", () => {
    wrapper()
      .find("#moveButton-0")
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
      .find("#moveButton-0")
      .simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 10, y: 10 }));
    step(2);
    wrapper()
      .find("svg")
      .simulate("mousedown");
    wrapper()
      .find("svg")
      .simulate("mousemove", { movementX: 10, movementY: -5 });
    update();
    (expect(
      wrapper()
        .find("svg")
        .props().viewBox,
    ): any).toBeCloseToViewBox([-110, -95, 200, 200]);
  });
});

describe("viewbox optimization", () => {
  const testConfig = setupTestConfig();

  const { wrapper, scene, step } = setupSceneWrapper(testConfig);

  it("includes objects that are in the viewBox", () => {
    scene().objects.resources = new Map([[0, new Resource({ x: 0, y: 0 })]]);
    step(2);
    expect(
      wrapper()
        .find(ResourceRender)
        .props().position,
    ).toEqual({ x: 0, y: 0 });
  });

  it("excludes objects that are not in the viewBox", () => {
    scene().objects.resources = new Map([[0, new Resource({ x: 150, y: 0 })]]);
    step(2);
    expect(
      wrapper()
        .find(ResourceRender)
        .exists(),
    ).toEqual(false);
  });

  it("includes objects that are not in the viewBox, but reach into it", () => {
    scene().objects.resources = new Map([[0, new Resource({ x: 109, y: 0 })]]);
    step(2);
    expect(
      wrapper()
        .find(ResourceRender)
        .exists(),
    ).toEqual(true);
  });
});
