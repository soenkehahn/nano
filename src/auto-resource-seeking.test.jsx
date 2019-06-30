// @flow

import { Resource } from "./resource";
import { cloneDeep } from "lodash";
import { fromInt } from "./rational";
import { setupSceneWrapper, setupTestConfig } from "./test/utils";

const config = setupTestConfig();
const [wrapper, scene] = setupSceneWrapper(config);

describe("auto-resource-seeking", () => {
  it("allows to research auto-resource-seeking", () => {
    scene().inventory = fromInt(100);
    scene().objects.lab.researched.add("mining");
    scene().focusedMinion().position = cloneDeep(scene().objects.lab.position);
    wrapper().setProps({ timeDelta: 0.1 });
    wrapper()
      .find("#researchAutoResourceSeekingButton")
      .simulate("click");
    wrapper().setProps({ timeDelta: 1 });
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
    wrapper().setProps({ timeDelta: 0.1 });
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
      config().velocity = 50;
      scene().objects.lab.researched.add("auto-resource-seeking");
      scene().focusedMinion().autoResourceSeeking = true;
      scene().objects.resources = new Map([
        [0, new Resource({ x: 100, y: 0 })],
      ]);
    });

    it("switches from idle to moving", () => {
      wrapper().setProps({ timeDelta: 0.5 });
      expect(scene().focusedMinion().status.tag).toEqual("moving");
    });

    it("moves to the a resource", () => {
      wrapper().setProps({ timeDelta: 2.5 });
      expect(scene().focusedMinion().position).toEqual({ x: 100, y: 0 });
    });

    it("becomes idle when reaching a resource", () => {
      wrapper().setProps({ timeDelta: 2.5 });
      expect(scene().focusedMinion().status.tag).toEqual("idle");
    });

    it("allows to switch off auto-resource-seeking", () => {
      wrapper().setProps({ timeDelta: 2.5 });
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
      wrapper().setProps({ timeDelta: 2.5 });
      expect(scene().focusedMinion().position).toEqual({ x: 100, y: 0 });
    });
  });
});
