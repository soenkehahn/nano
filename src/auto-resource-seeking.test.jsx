// @flow

import { Minion } from "./minion";
import { Resource } from "./resource";
import { cloneDeep } from "lodash";
import { fromInt } from "./rational";
import { sendMinion, setupSceneWrapper, setupTestConfig } from "./test/utils";

const config = setupTestConfig();
const { wrapper, scene, update, step } = setupSceneWrapper(config);

describe("auto-resource-seeking", () => {
  it("allows to research auto-resource-seeking", () => {
    scene().inventory = fromInt(100);
    scene().focusedMinion().position = cloneDeep(scene().objects.lab.position);
    update();
    wrapper()
      .find("#researchAutoResourceSeekingButton")
      .simulate("click");
    sendMinion(scene, { x: 0, y: 10000 });
    step(2);
    expect(scene().objects.lab.researched.has("auto-resource-seeking")).toEqual(
      true,
    );
  });

  it("renders a button that triggers auto-resource-seeking", () => {
    expect(
      wrapper()
        .find("#autoResourceSeekingButton-0")
        .exists(),
    ).toEqual(false);
    scene().objects.lab.researched.add("auto-resource-seeking");
    update();
    wrapper()
      .find("#autoResourceSeekingButton-0")
      .simulate("click");
    expect(scene().focusedMinion().status.tag).toEqual("moving");
  });

  it("renders one button per minion", () => {
    scene().objects.lab.researched.add("auto-resource-seeking");
    scene().objects.minions.add(
      new Minion(config(), scene(), { x: 10, y: 10 }),
    );
    update();
    expect(
      wrapper()
        .find("#autoResourceSeekingButton-1")
        .exists(),
    ).toEqual(true);
  });

  describe("when triggering auto-resource-seeking for a minion", () => {
    beforeEach(() => {
      config().velocity = fromInt(50);
      scene().objects.lab.researched.add("auto-resource-seeking");
      scene().objects.resources = new Map([
        [0, new Resource({ x: 100, y: 0 })],
        [1, new Resource({ x: 1000, y: 0 })],
      ]);
      update();
      wrapper()
        .find("#autoResourceSeekingButton-0")
        .simulate("click");
    });

    it("switches from idle to moving", () => {
      step(2);
      expect(scene().focusedMinion().status.tag).toEqual("moving");
    });

    it("moves to the a resource", () => {
      step(5);
      expect(scene().focusedMinion().position).toEqual({ x: 100, y: 0 });
    });

    it("becomes idle when reaching a resource", () => {
      step(5);
      expect(scene().focusedMinion().status.tag).toEqual("idle");
    });

    it("after mining the resource stays idle", () => {
      step(5);
      update();
      wrapper()
        .find("#mineButton-0")
        .simulate("click");
      step(1);
      expect(scene().focusedMinion().status.tag).toEqual("idle");
    });

    it("seeks the closest resource", () => {
      scene().objects.resources = new Map([
        [1, new Resource({ x: 0, y: 200 })],
        [0, new Resource({ x: 100, y: 0 })],
      ]);
      step(5);
      expect(scene().focusedMinion().position).toEqual({ x: 100, y: 0 });
    });
  });

  describe("when switching on auto-resource-seeking for a minion permanently", () => {
    it("does auto-seek a resource", () => {
      config().velocity = fromInt(500);
      scene().objects.lab.researched.add("auto-resource-seeking");
      update();
      wrapper()
        .find("#autoResourceSeekingCheckbox-0")
        .simulate("change", { target: { checked: true } });
      step(10);
      wrapper()
        .find("#mineButton-0")
        .simulate("click");
      step(10);
      expect(scene().objects.resources.size).toEqual(1);
    });

    it("keeps auto-seeking resources after the first one", () => {
      config().velocity = fromInt(500);
      scene().objects.lab.researched.add("auto-resource-seeking");
      update();
      wrapper()
        .find("#autoResourceSeekingCheckbox-0")
        .simulate("change", { target: { checked: true } });
      step(10);
      wrapper()
        .find("#mineButton-0")
        .simulate("click");
      step(10);
      wrapper()
        .find("#mineButton-0")
        .simulate("click");
      step(10);
      expect(scene().objects.resources).toEqual(new Map());
    });
  });
});
