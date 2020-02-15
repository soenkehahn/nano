// @flow

import { type Vector, distance } from "../data/vector";
import { fromInt } from "../data/rational";
import { setupSceneWrapper, setupTestConfig } from "../test/utils";

const config = setupTestConfig();
const { wrapper, step, scene, update } = setupSceneWrapper(config);

function formatVector(vector: Vector) {
  return `{x: ${vector.x}, y: ${vector.y}}`;
}

describe("seeding", () => {
  beforeEach(() => {
    config().costs.seeding = fromInt(10);
  });

  describe("when there's not enough resources", () => {
    beforeEach(() => {
      scene().inventory = fromInt(0);
    });

    it("doesn't allow to seed", () => {
      expect(
        wrapper()
          .find("#seedButton-0")
          .props().disabled,
      ).toEqual(true);
    });
  });

  describe("when there's enough resources", () => {
    beforeEach(() => {
      scene().inventory = fromInt(11);
      update();
    });

    it("allows to let minions seed", () => {
      wrapper()
        .find("#seedButton-0")
        .simulate("click");
      expect(scene().objects.resources.size).toEqual(13);
    });

    it("removes the cost for seeding from the inventory", () => {
      wrapper()
        .find("#seedButton-0")
        .simulate("click");
      expect(scene().inventory.toNumber()).toEqual(1);
    });

    it("seeds resources in distinct positions", () => {
      wrapper()
        .find("#seedButton-0")
        .simulate("click");
      expect(
        new Set(
          Array.from(scene().objects.resources.values()).map(x =>
            formatVector(x.position),
          ),
        ).size,
      ).toEqual(13);
    });

    it("adds resources close to the current minion", () => {
      scene().focusedMinion().position = { x: 0, y: 1000 };
      wrapper()
        .find("#seedButton-0")
        .simulate("click");
      for (let i = 2; i < scene().objects.resources.size; i++) {
        const resource: any = scene().objects.resources.get(i);
        expect(
          distance(scene().focusedMinion().position, resource.position),
        ).toBeLessThan(300);
      }
    });
  });

  describe("auto-seeding", () => {
    describe("when there's enough resources", () => {
      beforeEach(() => {
        scene().inventory = fromInt(11);
        update();
      });

      it("triggers seeding", () => {
        wrapper()
          .find("#autoSeedingCheckbox-0")
          .simulate("change", { target: { checked: true } });
        step();
        expect(scene().objects.resources.size).toEqual(13);
      });
    });

    describe("when there's not enough resources", () => {
      beforeEach(() => {
        scene().inventory = fromInt(2);
      });

      it("doesn't do anything at first", () => {
        wrapper()
          .find("#autoSeedingCheckbox-0")
          .simulate("change", { target: { checked: true } });
        step();
        expect(scene().objects.resources.size).toEqual(2);
      });

      it("triggers seeding once there's enough resources", () => {
        wrapper()
          .find("#autoSeedingCheckbox-0")
          .simulate("change", { target: { checked: true } });
        step();
        scene().inventory = fromInt(10);
        step();
        expect(scene().objects.resources.size).toEqual(13);
      });

      it("triggers seeding multiple times", () => {
        wrapper()
          .find("#autoSeedingCheckbox-0")
          .simulate("change", { target: { checked: true } });
        step();
        scene().inventory = fromInt(10);
        step();
        scene().inventory = fromInt(10);
        step();
        expect(scene().objects.resources.size).toEqual(24);
      });
    });
  });
});
