// @flow

import { FactoryRender } from "./factory";
import { setupSceneWrapper, setupTestConfig } from "./test/utils";
import { toClickEvent } from "./vector";

const testConfig = setupTestConfig();

describe("Factory", () => {
  const [wrapper, scene] = setupSceneWrapper(testConfig);

  it("doesn't allow to construct a factory with less than 3 resources", () => {
    scene().inventory = 2;
    wrapper().setProps({ timeDelta: 1 });
    expect(
      wrapper()
        .find("#buildButton")
        .exists(),
    ).toEqual(false);
  });

  it("allows to construct a factory with 3 resources", () => {
    scene().inventory = 3;
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
    scene().inventory = 3;
    wrapper()
      .find("#goButton")
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
    scene().inventory = 4;
    wrapper().setProps({ timeDelta: 1 });
    wrapper()
      .find("#buildButton")
      .simulate("click");
    wrapper().setProps({ timeDelta: 100 });
    expect(scene().inventory).toEqual(1);
  });
});
