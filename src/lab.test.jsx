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
    sceneSize: 200,
    zoomVelocity: 1.1,
    stepTimeDelta: 0.5,
    velocity: 1,
    prices: { factory: 3 },
    researchVelocity: 1 / 5
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
    wrapper.setProps({ timeDelta: 10 });
    expect(wrapper.find("#newResearch").text()).toEqual("new research: mining");
  });

  it("disallows researching when already researched", () => {
    wrapper.find("#goButton").simulate("click");
    wrapper.find("svg").simulate("click", toClickEvent(scene.lab.position));
    wrapper.setProps({ timeDelta: 100 });
    wrapper.find("#researchButton").simulate("click");
    wrapper.setProps({ timeDelta: 10 });
    expect(wrapper.find("#researchButton").exists()).toEqual(false);
  });

  test("researching takes time", () => {
    wrapper.find("#goButton").simulate("click");
    wrapper.find("svg").simulate("click", toClickEvent(scene.lab.position));
    wrapper.setProps({ timeDelta: 100 });
    expect(wrapper.find("#researchButton").exists()).toEqual(true);
    expect(wrapper.find(LabRender).props().completion).toEqual(null);
    wrapper.find("#researchButton").simulate("click");
    wrapper.setProps({ timeDelta: 3 });
    expect(wrapper.find("#newResearch").exists()).toEqual(false);
    expect(wrapper.find("#researchButton").exists()).toEqual(false);
    expect(wrapper.find(LabRender).props().completion).toEqual(3 / 5);
    wrapper.setProps({ timeDelta: 3 });
    expect(wrapper.find("#newResearch").text()).toEqual("new research: mining");
    expect(wrapper.find(LabRender).props().completion).toEqual(null);
  });
});
