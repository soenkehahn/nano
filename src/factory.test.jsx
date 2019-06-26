// @flow

import { Factory, FactoryRender } from "./factory";
import { fromInt, rational } from "./rational";
import { setupSceneWrapper, setupTestConfig } from "./test/utils";

const testConfig = setupTestConfig();

describe("Factory", () => {
  const [wrapper, scene] = setupSceneWrapper(testConfig);

  it("doesn't allow to construct a factory with less than 3 resources", () => {
    scene().inventory = rational(299, 100);
    wrapper().setProps({ timeDelta: 1 });
    expect(
      wrapper()
        .find("#buildButton")
        .exists(),
    ).toEqual(false);
  });

  it("allows to construct a factory with 3 resources", () => {
    scene().objects.resources = [];
    scene().inventory = fromInt(3);
    wrapper().setProps({ timeDelta: 1 });
    expect(
      wrapper()
        .find("#buildButton")
        .exists(),
    ).toEqual(true);
    wrapper()
      .find("#buildButton")
      .simulate("click");
    wrapper().setProps({ timeDelta: 100 });
    expect(
      wrapper()
        .find(FactoryRender)
        .exists(),
    ).toEqual(true);
  });

  it("builds the factory at the location of the minion", () => {
    scene().objects.resources = [];
    scene().inventory = fromInt(3);
    scene().objects.minion.position = { x: 10, y: 12 };
    scene().objects.minion.target = { x: 10, y: 12 };
    wrapper().setProps({ timeDelta: 0.1 });
    wrapper()
      .find("#buildButton")
      .simulate("click");
    wrapper().setProps({ timeDelta: 0.1 });
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
      scene().objects.minion.position = { x: 10, y: 12 };
      scene().objects.minion.target = { x: 10, y: 12 };
      scene().objects.factories.push(new Factory({ x: 10, y: 12 }));
      wrapper().setProps({ timeDelta: 0.1 });
      expect(
        wrapper()
          .find("#buildButton")
          .exists(),
      ).toEqual(false);
    });
  });

  it("uses up resources", () => {
    scene().objects.resources = [];
    scene().inventory = fromInt(4);
    wrapper().setProps({ timeDelta: 1 });
    wrapper()
      .find("#buildButton")
      .simulate("click");
    wrapper().setProps({ timeDelta: 100 });
    expect(scene().inventory.toNumber()).toEqual(1);
  });
});
