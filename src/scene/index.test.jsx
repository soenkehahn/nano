// @flow

import { Factory } from "../factory";
import { Lab } from "../lab";
import { MinionRender } from "../minion";
import { Resource } from "../resource";
import { Scene, SceneStepper } from "../scene";
import { createElement } from "react";
import { fromInt, rational } from "../rational";
import {
  mockSvgJsdomExtensions,
  setupSceneWrapper,
  setupTestConfig,
  testObjects,
} from "../test/utils";
import { mount } from "enzyme";
import { toClickEvent } from "../vector";

const config = setupTestConfig();

describe("SceneStepper step function logic", () => {
  let stepCalls: number;

  beforeEach(() => {
    stepCalls = 0;
  });

  function mkMockScene(): Scene {
    const scene = new Scene(config(), testObjects);
    scene.step = () => {
      stepCalls++;
    };
    return scene;
  }

  it("calls the step function as often as needed to reach the timeDelta", () => {
    config().stepTimeDelta = fromInt(1);
    const sceneStepper = new SceneStepper(config(), mkMockScene());
    const wrapper = mount(
      createElement(sceneStepper.draw, { time: 0, timeDelta: 0 }),
    );
    wrapper.setProps({ timeDelta: 10 });
    expect(stepCalls).toEqual(10);
  });

  it("saves the remainder of the timeDelta for the next round", () => {
    config().stepTimeDelta = rational(6, 10);
    const sceneStepper = new SceneStepper(config(), mkMockScene());
    const wrapper = mount(
      createElement(sceneStepper.draw, { time: 0, timeDelta: 0 }),
    );
    wrapper.setProps({ timeDelta: 1 });
    expect(stepCalls).toEqual(1);
    wrapper.setProps({ timeDelta: 1 });
    expect(stepCalls).toEqual(3);
    wrapper.setProps({ timeDelta: 1 });
    expect(stepCalls).toEqual(5);
    wrapper.setProps({ timeDelta: 1 });
    expect(stepCalls).toEqual(6);
    wrapper.setProps({ timeDelta: 1 });
    expect(stepCalls).toEqual(8);
    wrapper.setProps({ timeDelta: 1 });
    expect(stepCalls).toEqual(10);
  });
});

describe("Scene interface", () => {
  const { wrapper, scene, update, step } = setupSceneWrapper(config);

  it("takes the offset of the svg pane into account", () => {
    mockSvgJsdomExtensions(wrapper().find("svg"), { x: 2, y: 1 });
    wrapper()
      .find("#moveButton")
      .simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 10, y: 10 }));
    step(100);
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
    step(1);
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
    step(100);
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
    step(1);
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
      step(1);
      expect(
        wrapper()
          .find("#status")
          .text(),
      ).toEqual("status: moving...");
    });
  });

  describe("inventory", () => {
    it("shows the inventory", () => {
      scene().inventory = fromInt(42);
      step(1);
      expect(
        wrapper()
          .find("#inventory")
          .text(),
      ).toEqual("resources: 42.00");
    });

    it("rounds the inventory to cents", () => {
      scene().inventory = rational(123456, 100000);
      step(1);
      expect(
        wrapper()
          .find("#inventory")
          .text(),
      ).toEqual("resources: 1.23");
    });
  });

  it("shows a game end success message when no resources are left", () => {
    scene().objects.resources = new Map();
    update();
    expect(
      wrapper()
        .find("#gameEndSuccess")
        .exists(),
    ).toEqual(true);
  });
});

describe("collides", () => {
  let scene;

  beforeEach(() => {
    scene = new Scene(config(), testObjects);
  });

  it("detects collisions with resources", () => {
    scene.objects.resources = new Map([[0, new Resource({ x: 42, y: 23 })]]);
    expect(
      scene.collides({ position: { x: 42, y: 23 }, getRadius: () => 10 }),
    ).toEqual(true);
  });

  it("detects missing collisions", () => {
    scene.objects.resources = new Map([[0, new Resource({ x: 10, y: 10 })]]);
    expect(
      scene.collides({ position: { x: 42, y: 23 }, getRadius: () => 10 }),
    ).toEqual(false);
  });

  it("detects collisions with the lab", () => {
    scene.objects.lab = new Lab(config(), scene, { x: 42, y: 23 });
    expect(
      scene.collides({ position: { x: 42, y: 23 }, getRadius: () => 10 }),
    ).toEqual(true);
  });

  it("detects collisions with factories", () => {
    scene.objects.factories.push(new Factory({ x: 42, y: 23 }));
    expect(
      scene.collides({ position: { x: 42, y: 23 }, getRadius: () => 10 }),
    ).toEqual(true);
  });

  it("detects slight collisions", () => {
    scene.objects.resources = new Map([[0, new Resource({ x: 42, y: 23 })]]);
    expect(
      scene.collides({
        position: { x: 42 + Resource.initialRadius + 10 - 0.1, y: 23 },
        getRadius: () => 10,
      }),
    ).toEqual(true);
    expect(
      scene.collides({
        position: { x: 42 + Resource.initialRadius + 10 + 0.1, y: 23 },
        getRadius: () => 10,
      }),
    ).toEqual(false);
  });
});
