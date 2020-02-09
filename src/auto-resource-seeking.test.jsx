// @flow

import { Resource } from "./resource";
import { cloneDeep } from "lodash";
import { fromInt } from "./rational";
import { sendMinion, setupSceneWrapper, setupTestConfig } from "./test/utils";

const config = setupTestConfig();
const { wrapper, scene, update, step } = setupSceneWrapper(config);

describe("auto-resource-seeking", () => {
  it("allows to research auto-resource-seeking", () => {
    scene().inventory = fromInt(100);
    scene().objects.lab.researched.add("mining");
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

  it("renders a checkbox that enables auto-resource-seeking per minion", () => {
    scene().objects.lab.researched.add("mining");
    expect(
      wrapper()
        .find("#autoResourceSeekingCheckbox")
        .exists(),
    ).toEqual(false);
    scene().objects.lab.researched.add("auto-resource-seeking");
    update();
    expect(
      wrapper()
        .find("#autoResourceSeekingCheckbox")
        .exists(),
    ).toEqual(true);
    wrapper()
      .find("#autoResourceSeekingCheckbox")
      .simulate("change", { target: { checked: true } });
    expect(scene().focusedMinion().autoResourceSeeking).toEqual(true);
  });

  describe("when switching on auto-resource-seeking for a minion", () => {
    beforeEach(() => {
      config().velocity = fromInt(50);
      scene().objects.lab.researched.add("auto-resource-seeking");
      scene().focusedMinion().autoResourceSeeking = true;
      scene().objects.resources = new Map([
        [0, new Resource({ x: 100, y: 0 })],
      ]);
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

    it("allows to switch off auto-resource-seeking", () => {
      step(5);
      wrapper()
        .find("#autoResourceSeekingCheckbox")
        .simulate("change", { target: { checked: false } });
      expect(scene().focusedMinion().autoResourceSeeking).toEqual(false);
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
});
