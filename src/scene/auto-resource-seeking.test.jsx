// @flow

import { IdMap } from "../data/IdMap";
import { Minion } from "./minion";
import { Resource } from "./resource";
import { fromInt } from "../data/rational";
import { setupSceneWrapper, setupTestConfig } from "../test/utils";

const config = setupTestConfig();
const { wrapper, scene, update, step } = setupSceneWrapper(config);

describe("auto-resource-seeking", () => {
  it("renders a button that triggers auto-resource-seeking", () => {
    wrapper()
      .find("#autoResourceSeekingButton-0")
      .simulate("click");
    expect(scene().focusedMinion().status.tag).toEqual("moving");
  });

  it("renders one button per minion", () => {
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
      scene().objects.resources = new IdMap([
        new Resource({ x: 100, y: 0 }),
        new Resource({ x: 1000, y: 0 }),
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

    it("mines the resource when reaching", () => {
      step(4);
      expect(scene().focusedMinion().status.tag).toEqual("mining");
      step(1);
      expect(scene().objects.resources.size()).toEqual(1);
    });

    it("after mining the resource stays idle", () => {
      step(6);
      expect(scene().focusedMinion().status.tag).toEqual("idle");
    });

    it("seeks the closest resource", () => {
      scene().objects.resources = new IdMap([
        new Resource({ x: 0, y: 200 }),
        new Resource({ x: 100, y: 0 }),
      ]);
      step(5);
      expect(scene().focusedMinion().position).toEqual({ x: 100, y: 0 });
    });
  });

  describe("when the minion's position is equal to the resource's position", () => {
    it("mines the resource", () => {
      scene().objects.resources = new IdMap([new Resource({ x: 0, y: 0 })]);
      scene().focusedMinion().position = { x: 0, y: 0 };
      update();
      wrapper()
        .find("#autoResourceSeekingButton-0")
        .simulate("click");
      step(2);
      expect(scene().objects.resources.toArray()).toEqual([]);
    });
  });

  describe("when switching on auto-resource-seeking for a minion permanently", () => {
    it("does auto-seek a resource", () => {
      config().velocity = fromInt(500);
      wrapper()
        .find("#autoResourceSeekingCheckbox-0")
        .simulate("change", { target: { checked: true } });
      step(4);
      expect(scene().objects.resources.size()).toEqual(1);
    });

    it("keeps auto-seeking resources after the first one", () => {
      config().velocity = fromInt(500);
      wrapper()
        .find("#autoResourceSeekingCheckbox-0")
        .simulate("change", { target: { checked: true } });
      step(7);
      expect(scene().objects.resources.toArray()).toEqual([]);
    });
  });
});
