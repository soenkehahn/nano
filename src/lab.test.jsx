// @flow

import * as React from "react";
import { LabRender } from "./lab";
import { ReactWrapper, mount } from "enzyme";
import { Scene, type SceneRenderType, mkSceneRender } from "./scene";
import { mockSvgJsdomExtensions, setupTestConfig } from "./test/utils";
import { toClickEvent } from "./vector";

const testConfig = setupTestConfig();

describe("Factory", () => {
  let scene;
  let wrapper: ReactWrapper<SceneRenderType>;

  beforeEach(() => {
    scene = new Scene(testConfig());
    const SceneRender = mkSceneRender(testConfig(), scene);
    wrapper = mount(<SceneRender time={0} timeDelta={0} />);
    mockSvgJsdomExtensions(wrapper.find("svg"), { x: 0, y: 0 });
  });

  it("renders a lab", () => {
    expect(wrapper.find(LabRender).exists()).toEqual(true);
  });

  it("allows to research mining", () => {
    wrapper.find("#goButton").simulate("click");
    wrapper
      .find("svg")
      .simulate("click", toClickEvent(scene.objects.lab.position));
    wrapper.setProps({ timeDelta: 100 });
    expect(wrapper.find("#researchButton").exists()).toEqual(true);
    expect(wrapper.find("#newResearch").exists()).toEqual(false);
    wrapper.find("#researchButton").simulate("click");
    wrapper.setProps({ timeDelta: 10 });
    expect(wrapper.find("#newResearch").text()).toEqual("new research: mining");
  });

  it("disallows researching when already researched", () => {
    wrapper.find("#goButton").simulate("click");
    wrapper
      .find("svg")
      .simulate("click", toClickEvent(scene.objects.lab.position));
    wrapper.setProps({ timeDelta: 100 });
    wrapper.find("#researchButton").simulate("click");
    wrapper.setProps({ timeDelta: 10 });
    expect(wrapper.find("#researchButton").exists()).toEqual(false);
  });

  test("researching takes time", () => {
    testConfig().researchVelocity = 1 / 5;
    wrapper.find("#goButton").simulate("click");
    wrapper
      .find("svg")
      .simulate("click", toClickEvent(scene.objects.lab.position));
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
