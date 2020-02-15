// @flow

import { Factory, FactoryRender } from "./factory";
import { MinionRender } from "./minion";
import { Resource } from "./resource";
import { fromInt, rational } from "../data/rational";
import { setupSceneWrapper, setupTestConfig } from "../test/utils";

const testConfig = setupTestConfig();

describe("Factory", () => {
  const { wrapper, scene, update, step } = setupSceneWrapper(testConfig);

  it("doesn't allow to construct a factory with less than 3 resources", () => {
    scene().inventory = rational(299, 100);
    step(2);
    expect(
      wrapper()
        .find("#buildMinionButton-0")
        .exists(),
    ).toEqual(false);
  });

  it("allows to construct a factory with 3 resources", () => {
    scene().objects.resources = new Map([[0, new Resource({ x: -100, y: 0 })]]);
    scene().inventory = fromInt(3);
    step(2);
    expect(
      wrapper()
        .find("#buildMinionButton-0")
        .exists(),
    ).toEqual(true);
    wrapper()
      .find("#buildMinionButton-0")
      .simulate("click");
    step(200);
    expect(
      wrapper()
        .find(FactoryRender)
        .exists(),
    ).toEqual(true);
  });

  it("builds the factory at the location of the minion", () => {
    scene().objects.resources = new Map([[0, new Resource({ x: -100, y: 0 })]]);
    scene().inventory = fromInt(3);
    scene().focusedMinion().position = { x: 10, y: 12 };
    update();
    wrapper()
      .find("#buildMinionButton-0")
      .simulate("click");
    update();
    expect(
      wrapper()
        .find(FactoryRender)
        .props().position,
    ).toEqual({
      x: 10,
      y: 12,
    });
  });

  describe("collisions", () => {
    it("disallows building a factory that overlaps with another object", () => {
      scene().inventory = fromInt(6);
      scene().focusedMinion().position = { x: 10, y: 12 };
      scene().objects.factories.push(new Factory({ x: 10, y: 12 }));
      update();
      expect(
        wrapper()
          .find("#buildMinionButton-0")
          .exists(),
      ).toEqual(false);
    });
  });

  test("building uses up resources", () => {
    scene().objects.resources = new Map([[0, new Resource({ x: -100, y: 0 })]]);
    scene().inventory = fromInt(4);
    step(2);
    wrapper()
      .find("#buildMinionButton-0")
      .simulate("click");
    step(2);
    expect(scene().inventory.toNumber()).toEqual(1);
  });

  it("produces one minion when being built", () => {
    scene().objects.resources = new Map([[0, new Resource({ x: -100, y: 0 })]]);
    scene().inventory = fromInt(4);
    scene().focusedMinion().position = { x: 42, y: 23 };
    step(2);
    wrapper()
      .find("#buildMinionButton-0")
      .simulate("click");
    step(2);
    expect(wrapper().find(MinionRender).length).toEqual(2);
    expect(
      wrapper()
        .find(MinionRender)
        .at(1)
        .props().position,
    ).toEqual({ x: 42, y: 23 });
  });
});
