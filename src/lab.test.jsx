// @flow

import { type Config, Scene, mkSceneRender } from "./scene";
import { LabRender } from "./lab";
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

  it("renders a lab", () => {
    expect(wrapper.find(LabRender).exists()).toEqual(true);
  });

  it("allows to research mining", () => {
    wrapper.find("#goButton").simulate("click");
    wrapper.find("svg").simulate("click", toClickEvent(scene.lab.position));
    wrapper.setProps({ timeDelta: 100 });
    expect(wrapper.find("#researchButton").exists()).toEqual(true);
    expect(wrapper.find("#newResearch").exists()).toEqual(false);
    wrapper.find("#researchButton").simulate("click");
    wrapper.setProps({ timeDelta: 1 });
    expect(wrapper.find("#newResearch").text()).toEqual("new research: mining");
  });

  it("disallows researching when already researched", () => {
    wrapper.find("#goButton").simulate("click");
    wrapper.find("svg").simulate("click", toClickEvent(scene.lab.position));
    wrapper.setProps({ timeDelta: 100 });
    wrapper.find("#researchButton").simulate("click");
    wrapper.setProps({ timeDelta: 1 });
    expect(wrapper.find("#researchButton").exists()).toEqual(false);
  });
});
