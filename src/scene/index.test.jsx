// @flow

import { MinionRender } from "../minion";
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

const testConfig = setupTestConfig();

describe("SceneRender step function logic", () => {
  let timeDeltas;

  beforeEach(() => {
    timeDeltas = [];
  });

  function mkMockScene(): Scene {
    const scene = new Scene(testConfig(), testObjects);
    scene.step = (timeDelta: number) => {
      timeDeltas.push(timeDelta);
    };
    return scene;
  }

  it("calls the step function as often as needed to reach the timeDelta", () => {
    testConfig().stepTimeDelta = 1;
    const SceneRender = mkSceneRender(testConfig(), mkMockScene());
    const wrapper = mount(<SceneRender time={0} timeDelta={0} />);
    wrapper.setProps({ timeDelta: 10 });
    expect(timeDeltas.length).toEqual(10);
  });

  it("calls the step function with fixed timeDeltas", () => {
    testConfig().stepTimeDelta = 0.5;
    const Scene = mkSceneRender(testConfig(), mkMockScene());
    const wrapper = mount(<Scene time={0} timeDelta={0} />);
    wrapper.setProps({ timeDelta: 5 });
    for (const timeDelta of timeDeltas) {
      expect(timeDelta).toEqual(0.5);
    }
  });

  it("saves the remainder of the timeDelta for the next round", () => {
    testConfig().stepTimeDelta = 0.6;
    const Scene = mkSceneRender(testConfig(), mkMockScene());
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
  const [wrapper, scene] = setupSceneWrapper(testConfig);

  it("takes the offset of the svg pane into account", () => {
    mockSvgJsdomExtensions(wrapper().find("svg"), { x: 2, y: 1 });
    wrapper()
      .find("#goButton")
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

  it("doesn't show the go button after being pressed", () => {
    wrapper()
      .find("#goButton")
      .simulate("click");
    wrapper().setProps({ timeDelta: 1 });
    expect(
      wrapper()
        .find("#goButton")
        .exists(),
    ).toEqual(false);
  });

  it("shows the go button after minion reaches target", () => {
    wrapper()
      .find("#goButton")
      .simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 10, y: 10 }));
    wrapper().setProps({ timeDelta: 100 });
    expect(
      wrapper()
        .find("#goButton")
        .exists(),
    ).toEqual(true);
  });

  it("doesn't show any buttons if the minion is not idle", () => {
    scene().inventory = 3;
    wrapper()
      .find("#goButton")
      .simulate("click");
    wrapper().setProps({ timeDelta: 1 });
    expect(
      wrapper()
        .find("#goButton")
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
          .find("#activeCommand")
          .text(),
      ).toEqual("active command: none");
    });

    it("shows the active command", () => {
      wrapper()
        .find("#goButton")
        .simulate("click");
      wrapper()
        .find("svg")
        .simulate("click", toClickEvent({ x: 10, y: 10 }));
      wrapper().setProps({ timeDelta: 1 });
      expect(
        wrapper()
          .find("#activeCommand")
          .text(),
      ).toEqual("active command: go");
    });
  });
});
