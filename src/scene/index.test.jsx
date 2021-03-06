// @flow

import { Factory } from "./factory";
import { IdMap } from "../data/IdMap";
import { Lab } from "./lab";
import { MinionRender } from "./minion";
import { Resource } from "./resource";
import { Scene } from "../scene";
import { fromInt, rational } from "../data/rational";
import {
  mockSvgJsdomExtensions,
  sendMinion,
  setupSceneWrapper,
  setupTestConfig,
  testObjects,
} from "../test/utils";
import { toClickEvent } from "../data/vector";

const config = setupTestConfig();

describe("Scene interface", () => {
  const { wrapper, scene, update, step } = setupSceneWrapper(config);

  it("takes the offset of the svg pane into account", () => {
    mockSvgJsdomExtensions(wrapper().find("svg"), { x: 2, y: 1 });
    wrapper().find("#moveButton-0").simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 10, y: 10 }));
    step(200);
    expect(wrapper().find(MinionRender).props().position).toEqual({
      x: 8,
      y: 9,
    });
  });

  it("doesn't show the move button after being pressed", () => {
    wrapper().find("#moveButton-0").simulate("click");
    step(2);
    expect(wrapper().find("#moveButton-0").exists()).toEqual(false);
  });

  it("shows the move button after minion reaches target", () => {
    wrapper().find("#moveButton-0").simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 10, y: 10 }));
    step(200);
    expect(wrapper().find("#moveButton-0").exists()).toEqual(true);
  });

  it("doesn't show any buttons if the minion is not idle", () => {
    scene().inventory = fromInt(3);
    wrapper().find("#moveButton-0").simulate("click");
    step(2);
    expect(wrapper().find("#moveButton-0").exists()).toEqual(false);
    expect(wrapper().find("#buildMinionButton").exists()).toEqual(false);
  });

  describe("active command", () => {
    it("shows the active command", () => {
      wrapper().find("#moveButton-0").simulate("click");
      wrapper()
        .find("svg")
        .simulate("click", toClickEvent({ x: 10, y: 10 }));
      step(2);
      expect(wrapper().find("#minion-ui-0").text()).toEqual(
        "status: moving...",
      );
    });
  });

  describe("inventory", () => {
    it("shows the inventory", () => {
      scene().inventory = fromInt(42);
      step(2);
      expect(wrapper().find("#inventory").text()).toEqual("resources: 42.00");
    });

    it("rounds the inventory to cents", () => {
      scene().inventory = rational(123456, 100000);
      step(2);
      expect(wrapper().find("#inventory").text()).toEqual("resources: 1.23");
    });
  });

  describe("when no resources are left", () => {
    it("shows a game end message including the reached time", () => {
      scene().objects.resources = new IdMap();
      config().uiTimeFactor = rational(1, 100);
      scene().time = rational(42, 100).over(config().uiTimeFactor);
      update();
      expect(wrapper().find("#gameEndSuccess").text()).toContain(
        "survived for 0.42 time units",
      );
    });
  });

  describe("time", () => {
    it("shows the current game time at start", () => {
      expect(wrapper().find("#time").text()).toEqual("time: 0.00");
    });

    it("time progresses when no minion is idle", () => {
      sendMinion(scene, { x: 0, y: 1000 });
      step(1);
      expect(wrapper().find("#time").text()).toEqual("time: 0.50");
    });

    it("if time is paused it doesn't progress", () => {
      step(1);
      expect(wrapper().find("#time").text()).toEqual("time: 0.00");
    });

    it("multiplies the time with the given uiTimeFactor", () => {
      config().uiTimeFactor = fromInt(3);
      sendMinion(scene, { x: 0, y: 1000 });
      step(1);
      expect(wrapper().find("#time").text()).toEqual("time: 1.50");
    });
  });
});

describe("collides", () => {
  let scene;

  beforeEach(() => {
    scene = new Scene(config(), testObjects);
  });

  it("detects collisions with resources", () => {
    scene.objects.resources = new IdMap([new Resource({ x: 42, y: 23 })]);
    expect(
      scene.collides({ position: { x: 42, y: 23 }, getRadius: () => 10 }),
    ).toEqual(true);
  });

  it("detects missing collisions", () => {
    scene.objects.resources = new IdMap([new Resource({ x: 10, y: 10 })]);
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
    scene.objects.resources = new IdMap([new Resource({ x: 42, y: 23 })]);
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
