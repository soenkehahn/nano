// @flow

import { MinionRender } from "../minion";
import { type Rational, fromInt, rational } from "../rational";
import { Scene, mkSceneRender } from "../scene";
import {
  mockSvgJsdomExtensions,
  setupSceneWrapper,
  setupTestConfig,
  testObjects,
} from "../test/utils";
import { mount } from "enzyme";
import { toClickEvent } from "../vector";
import React from "react";

const config = setupTestConfig();

describe("SceneRender step function logic", () => {
  let timeDeltas;

  beforeEach(() => {
    timeDeltas = [];
  });

  function mkMockScene(): Scene {
    const scene = new Scene(config(), testObjects);
    scene.step = (timeDelta: Rational) => {
      timeDeltas.push(timeDelta);
    };
    return scene;
  }

  it("calls the step function as often as needed to reach the timeDelta", () => {
    config().stepTimeDelta = fromInt(1);
    const SceneRender = mkSceneRender(config(), mkMockScene());
    const wrapper = mount(<SceneRender time={0} timeDelta={0} />);
    wrapper.setProps({ timeDelta: 10 });
    expect(timeDeltas.length).toEqual(10);
  });

  it("calls the step function with fixed timeDeltas", () => {
    config().stepTimeDelta = rational(1, 2);
    const Scene = mkSceneRender(config(), mkMockScene());
    const wrapper = mount(<Scene time={0} timeDelta={0} />);
    wrapper.setProps({ timeDelta: 5 });
    for (const timeDelta of timeDeltas) {
      expect(timeDelta.toNumber()).toEqual(0.5);
    }
  });

  it("saves the remainder of the timeDelta for the next round", () => {
    config().stepTimeDelta = rational(6, 10);
    const Scene = mkSceneRender(config(), mkMockScene());
    const wrapper = mount(<Scene time={0} timeDelta={0} />);
    wrapper.setProps({ timeDelta: 1 });
    expect(timeDeltas.length).toEqual(1);
    wrapper.setProps({ timeDelta: 1 });
    expect(timeDeltas.length).toEqual(3);
    wrapper.setProps({ timeDelta: 1 });
    expect(timeDeltas.length).toEqual(5);
    wrapper.setProps({ timeDelta: 1 });
    expect(timeDeltas.length).toEqual(6);
    wrapper.setProps({ timeDelta: 1 });
    expect(timeDeltas.length).toEqual(8);
    wrapper.setProps({ timeDelta: 1 });
    expect(timeDeltas.length).toEqual(10);
  });
});

describe("Scene interface", () => {
  const [wrapper, scene] = setupSceneWrapper(config);

  it("takes the offset of the svg pane into account", () => {
    mockSvgJsdomExtensions(wrapper().find("svg"), { x: 2, y: 1 });
    wrapper()
      .find("#moveButton")
      .simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 10, y: 10 }));
    wrapper().setProps({ timeDelta: 100 });
    expect(
      wrapper()
        .find(MinionRender)
        .props().position,
    ).toEqual({
      x: 8,
      y: 9,
    });
  });

  it("doesn't show the move button after being pressed", () => {
    wrapper()
      .find("#moveButton")
      .simulate("click");
    wrapper().setProps({ timeDelta: 1 });
    expect(
      wrapper()
        .find("#moveButton")
        .exists(),
    ).toEqual(false);
  });

  it("shows the move button after minion reaches target", () => {
    wrapper()
      .find("#moveButton")
      .simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 10, y: 10 }));
    wrapper().setProps({ timeDelta: 100 });
    expect(
      wrapper()
        .find("#moveButton")
        .exists(),
    ).toEqual(true);
  });

  it("doesn't show any buttons if the minion is not idle", () => {
    scene().inventory = fromInt(3);
    wrapper()
      .find("#moveButton")
      .simulate("click");
    wrapper().setProps({ timeDelta: 1 });
    expect(
      wrapper()
        .find("#moveButton")
        .exists(),
    ).toEqual(false);
    expect(
      wrapper()
        .find("#buildButton")
        .exists(),
    ).toEqual(false);
  });

  describe("active command", () => {
    it("initially shows no active command", () => {
      expect(
        wrapper()
          .find("#status")
          .exists(),
      ).toEqual(false);
    });

    it("shows the active command", () => {
      wrapper()
        .find("#moveButton")
        .simulate("click");
      wrapper()
        .find("svg")
        .simulate("click", toClickEvent({ x: 10, y: 10 }));
      wrapper().setProps({ timeDelta: 1 });
      expect(
        wrapper()
          .find("#status")
          .text(),
      ).toEqual("status: moving...");
    });
  });

  describe("inventory", () => {
    it("shows the inventory", () => {
      scene().inventory = fromInt(4200);
      wrapper().setProps({ timeDelta: 1 });
      expect(
        wrapper()
          .find("#inventory")
          .text(),
      ).toEqual("resources: 42");
    });

    it("rounds the inventory to cents", () => {
      scene().inventory = rational(123456, 1000);
      wrapper().setProps({ timeDelta: 1 });
      expect(
        wrapper()
          .find("#inventory")
          .text(),
      ).toEqual("resources: 1.23");
    });
  });
});
