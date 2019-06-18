// @flow

import { type Config, Scene, mkSceneRender } from "./scene";
import { FactoryRender } from "./factory";
import { mockSvgJsdomExtensions } from "./test/utils";
import { mount } from "enzyme";
import { toClickEvent } from "./vector";
import React from "react";

let config: Config;

beforeEach(() => {
  config = {
    dimensions: { lower: -100, upper: 100 },
    stepTimeDelta: 0.5,
    velocity: 1,
    prices: { factory: 3 }
  };
});

describe("Factory", () => {
  let scene;
  let wrapper;

  beforeEach(() => {
    scene = new Scene(config);
    const SceneRender = mkSceneRender(config, scene);
    wrapper = mount(<SceneRender time={0} timeDelta={0} />);
    mockSvgJsdomExtensions(wrapper.find("svg"), { x: 0, y: 0 });
  });

  it("doesn't allow to construct a factory with less than 3 resources", () => {
    scene.inventory = 2;
    wrapper.setProps({ timeDelta: 1 });
    expect(wrapper.find("#buildButton").exists()).toEqual(false);
  });

  it("allows to construct a factory with 3 resources", () => {
    scene.inventory = 3;
    wrapper.setProps({ timeDelta: 1 });
    expect(wrapper.find("#buildButton").exists()).toEqual(true);
    wrapper.find("#buildButton").simulate("click");
    wrapper.setProps({ timeDelta: 100 });
    expect(wrapper.find(FactoryRender).exists()).toEqual(true);
  });

  it("builds the factory at the location of the minion", () => {
    scene.inventory = 3;
    wrapper.find("#goButton").simulate("click");
    wrapper.find("svg").simulate("click", toClickEvent({ x: 10, y: 12 }));
    wrapper.setProps({ timeDelta: 100 });
    wrapper.find("#buildButton").simulate("click");
    wrapper.setProps({ timeDelta: 100 });
    expect(wrapper.find(FactoryRender).props()).toMatchObject({ x: 10, y: 12 });
  });

  it("uses up resources", () => {
    scene.inventory = 4;
    wrapper.setProps({ timeDelta: 1 });
    wrapper.find("#buildButton").simulate("click");
    wrapper.setProps({ timeDelta: 100 });
    expect(scene.inventory).toEqual(1);
  });
});
