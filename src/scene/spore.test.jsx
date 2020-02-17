// @flow

import { IdMap } from "../data/IdMap";
import { Resource } from "./resource";
import { Spore, SporeRender } from "./spore";
import { distance } from "../data/vector";
import { fromInt, rational } from "../data/rational";
import { setupSceneWrapper, setupTestConfig } from "../test/utils";

const config = setupTestConfig();
const { wrapper, scene, step } = setupSceneWrapper(config);

describe("Spore", () => {
  describe("when mining", () => {
    beforeEach(() => {
      scene().focusedMinion().position = { x: 100, y: 0 };
      scene().objects.resources = new IdMap([new Resource({ x: 101, y: 0 })]);
      step();
      wrapper()
        .find("#mineButton-0")
        .simulate("click");
      step(10);
    });

    test("mining creates spores", () => {
      expect(wrapper().find(SporeRender).length).toEqual(1);
    });

    test("spores appear where the resources was", () => {
      expect(
        wrapper()
          .find(SporeRender)
          .props().position,
      ).toEqual({
        x: 101,
        y: 0,
      });
    });
  });

  describe("when not colliding with a spore", () => {
    it("doesn't allow to breed", () => {
      expect(
        wrapper()
          .find("#breedButton-0")
          .exists(),
      ).toEqual(false);
    });
  });

  describe("when colliding with a spore", () => {
    beforeEach(() => {
      config().stepTimeDelta = fromInt(1);
      config().breedingVelocity = rational(1, 2);
      config().seeding.resources = 7;
      scene().objects.resources = new IdMap([new Resource({ x: 0, y: 1000 })]);
      scene().objects.spores = new IdMap([new Spore({ x: 0, y: 0 })]);
      step();
    });

    it("allows to breed", () => {
      wrapper()
        .find("#breedButton-0")
        .simulate("click");
      step(2);
      expect(scene().objects.resources.size()).toEqual(8);
    });

    it("creates resources where the spore was", () => {
      scene().objects.spores = new IdMap([new Spore({ x: 1000, y: 0 })]);
      scene().focusedMinion().position = { x: 1000, y: 0 };
      step();
      wrapper()
        .find("#breedButton-0")
        .simulate("click");
      scene().focusedMinion().position = { x: 0, y: 0 };
      step(2);
      for (let i = 1; i < scene().objects.resources.size(); i++) {
        const resource = scene().objects.resources.unsafeGet(i);
        expect(distance({ x: 1000, y: 0 }, resource.position)).toBeLessThan(
          Spore.radius,
        );
      }
    });

    test("breeding happens only once", () => {
      wrapper()
        .find("#breedButton-0")
        .simulate("click");
      step(2);
      expect(scene().focusedMinion().status.tag).toEqual("idle");
      step(2);
      expect(scene().objects.resources.size()).toEqual(8);
    });

    it("breeding takes time", () => {
      wrapper()
        .find("#breedButton-0")
        .simulate("click");
      step(1);
      expect(
        (scene().objects.spores.get(0): any).completion.toNumber(),
      ).toEqual(0.5);
      expect(scene().objects.resources.size()).toEqual(1);
      step(1);
      expect(scene().objects.spores.size()).toEqual(0);
      expect(scene().objects.resources.size()).toEqual(8);
    });
  });
});
