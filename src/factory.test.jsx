// @flow

import { FactoryRender } from "./factory";
import { fromInt, rational } from "./rational";
import { setupSceneWrapper, setupTestConfig } from "./test/utils";
import { toClickEvent } from "./vector";

const testConfig = setupTestConfig();

describe("Factory", () => {
  const [wrapper, scene] = setupSceneWrapper(testConfig);

  it("doesn't allow to construct a factory with less than 300 resources", () => {
    scene().inventory = rational(299, 100);
    wrapper().setProps({ timeDelta: 1 });
    expect(
      wrapper()
        .find("#buildButton")
        .exists(),
    ).toEqual(false);
  });

  it("allows to construct a factory with 300 resources", () => {
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
    scene().inventory = fromInt(3);
    wrapper()
      .find("#moveButton")
      .simulate("click");
    wrapper()
      .find("svg")
      .simulate("click", toClickEvent({ x: 10, y: 12 }));
    wrapper().setProps({ timeDelta: 100 });
    wrapper()
      .find("#buildButton")
      .simulate("click");
    wrapper().setProps({ timeDelta: 100 });
    expect(
      wrapper()
        .find(FactoryRender)
        .props().position,
    ).toEqual({
      x: 10,
      y: 12,
    });
  });

  it("uses up resources", () => {
    scene().inventory = fromInt(4);
    wrapper().setProps({ timeDelta: 1 });
    wrapper()
      .find("#buildButton")
      .simulate("click");
    wrapper().setProps({ timeDelta: 100 });
    expect(scene().inventory.toNumber()).toEqual(1);
  });
});
