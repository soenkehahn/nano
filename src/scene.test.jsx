// @flow

import "@babel/polyfill";
import * as jsdomExtensions from "./jsdomExtensions/svg";
import { type Config, Scene, mkSceneRender } from "./scene";
import { MinionRender, type RenderProps } from "./minion";
import { ReactWrapper } from "enzyme";
import { ResourceRender } from "./resource";
import { mount } from "enzyme";
import React from "react";

function mockSvgJsdomExtensions(
  svgWrapper: ReactWrapper<*>,
  offset: { x: number, y: number }
) {
  const svgElement = svgWrapper.instance();
  if (!svgElement || svgElement.constructor.name !== "SVGSVGElement") {
    throw new Error(`expected: SVGSVGElement, not ${svgWrapper.debug()}`);
  }
  const mockExtensions: jsdomExtensions.SvgElement = {
    getScreenCTM: () => {
      const result = new jsdomExtensions.SvgTransform();
      result.x = offset.x;
      result.y = offset.y;
      return result;
    },
    createSVGPoint: () => new jsdomExtensions.SvgPoint()
  };
  for (const field in mockExtensions) {
    (svgElement: any)[field] = mockExtensions[field];
  }
}

let config: Config;

beforeEach(() => {
  config = {
    dimensions: { lower: -100, upper: 100 },
    stepTimeDelta: 0.5,
    velocity: 1
  };
});

describe("SceneRender", () => {
  describe("step function logic", () => {
    let timeDeltas;

    beforeEach(() => {
      timeDeltas = [];
    });

    function mkMockScene(): Scene {
      const scene = new Scene(config);
      scene.step = (timeDelta: number) => {
        timeDeltas.push(timeDelta);
      };
      return scene;
    }

    it("calls the step function as often as needed to reach the timeDelta", () => {
      config.stepTimeDelta = 1;
      const Scene = mkSceneRender(config, mkMockScene());
      const wrapper = mount(<Scene time={0} timeDelta={0} />);
      wrapper.setProps({ timeDelta: 10 });
      expect(timeDeltas.length).toEqual(10);
    });

    it("calls the step function with fixed timeDeltas", () => {
      config.stepTimeDelta = 0.5;
      const Scene = mkSceneRender(config, mkMockScene());
      const wrapper = mount(<Scene time={0} timeDelta={0} />);
      wrapper.setProps({ timeDelta: 5 });
      for (const timeDelta of timeDeltas) {
        expect(timeDelta).toEqual(0.5);
      }
    });

    it("saves the remainder of the timeDelta for the next round", () => {
      config.stepTimeDelta = 0.6;
      const Scene = mkSceneRender(config, mkMockScene());
      const wrapper = mount(<Scene time={0} timeDelta={0} />);
      wrapper.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(1);
      wrapper.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(3);
      wrapper.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(5);
      wrapper.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(6);
      wrapper.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(8);
      wrapper.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(10);
    });
  });
});

describe("Scene", () => {
  describe("interface", () => {
    let wrapper;

    beforeEach(() => {
      const SceneRender = mkSceneRender(config, new Scene(config));
      wrapper = mount(<SceneRender time={0} timeDelta={0} />);
      mockSvgJsdomExtensions(wrapper.find("svg"), { x: 0, y: 0 });
    });

    it("takes the offset of the svg pane into account", () => {
      mockSvgJsdomExtensions(wrapper.find("svg"), { x: 2, y: 1 });
      wrapper.find("#go").simulate("click");
      wrapper.find("svg").simulate("click", { clientX: 10, clientY: 10 });
      wrapper.setProps({ timeDelta: 100 });
      expect(wrapper.find(MinionRender).props()).toMatchObject({
        x: 8,
        y: 9
      });
    });

    it("doesn't show the go button after being pressed", () => {
      wrapper.find("#go").simulate("click");
      wrapper.setProps({ timeDelta: 1 });
      expect(wrapper.find("#go").exists()).toEqual(false);
    });

    it("shows the go button after minion reaches target", () => {
      wrapper.find("#go").simulate("click");
      wrapper.find("svg").simulate("click", { clientX: 10, clientY: 10 });
      wrapper.setProps({ timeDelta: 100 });
      expect(wrapper.find("#go").exists()).toEqual(true);
    });

    describe("active command", () => {
      it("initially shows no active command", () => {
        expect(wrapper.find("#activeCommand").text()).toEqual(
          "active command: none"
        );
      });

      it("shows the active command", () => {
        wrapper.find("#go").simulate("click");
        wrapper.find("svg").simulate("click", { clientX: 10, clientY: 10 });
        wrapper.setProps({ timeDelta: 1 });
        expect(wrapper.find("#activeCommand").text()).toEqual(
          "active command: go"
        );
      });
    });
  });

  describe("Minion", () => {
    let wrapper;

    beforeEach(() => {
      const SceneRender = mkSceneRender(config, new Scene(config));
      wrapper = mount(<SceneRender time={0} timeDelta={0} />);
      mockSvgJsdomExtensions(wrapper.find("svg"), { x: 0, y: 0 });
    });

    it("shows minion in svg context", () => {
      expect(
        wrapper
          .find("svg")
          .find(MinionRender)
          .exists()
      ).toEqual(true);
    });

    it("doesn't allow to set the minion coordinates with a mouse click", async () => {
      wrapper.find("svg").simulate("click", { clientX: 10, clientY: 10 });
      wrapper.setProps({ timeDelta: 100 });
      expect(wrapper.find(MinionRender).props()).toMatchObject({
        x: 0,
        y: 0
      });
    });

    describe("after pressing 'go'", () => {
      it("allows to set the minion coordinates with a mouse click", async () => {
        wrapper.find("#go").simulate("click");
        wrapper.find("svg").simulate("click", { clientX: 10, clientY: 10 });
        wrapper.setProps({ timeDelta: 100 });
        expect(wrapper.find(MinionRender).props()).toMatchObject({
          x: 10,
          y: 10
        });
      });

      it("doesn't allow to change the minion target while it's underway", async () => {
        wrapper.find("#go").simulate("click");
        wrapper.find("svg").simulate("click", { clientX: 10, clientY: 0 });
        wrapper.setProps({ timeDelta: 1 });
        wrapper.find("svg").simulate("click", { clientX: 20, clientY: 0 });
        wrapper.setProps({ timeDelta: 100 });
        expect(wrapper.find(MinionRender).props()).toMatchObject({
          x: 10,
          y: 0
        });
      });
    });

    it("minions need time to move around", () => {
      wrapper.find("#go").simulate("click");
      wrapper.find("svg").simulate("click", { clientX: 1, clientY: 0 });
      wrapper.setProps({ timeDelta: 0.5 });
      expect(wrapper.find(MinionRender).props()).toMatchObject({
        x: 0.5,
        y: 0
      });
    });
  });

  describe("Resource", () => {
    let scene;
    let wrapper;
    let minionProps: RenderProps;
    let resourceProps: RenderProps;

    beforeEach(() => {
      config.velocity = 99999999999999;
      scene = new Scene(config);
      const SceneRender = mkSceneRender(config, scene);
      wrapper = mount(<SceneRender time={0} timeDelta={0} />);
      mockSvgJsdomExtensions(wrapper.find("svg"), { x: 0, y: 0 });
    });

    it("shows multiple resources", () => {
      expect(wrapper.find(ResourceRender).length).toEqual(10);
    });

    describe("when only one resource exists", () => {
      beforeEach(() => {
        scene.resources = [scene.resources[0]];
        wrapper.setProps({ timeDelta: 1 });
        minionProps = wrapper.find(MinionRender).props();
        resourceProps = wrapper.find(ResourceRender).props();
      });

      it("depletes resources when colliding (same position) with a minion", () => {
        wrapper.find("#go").simulate("click");
        wrapper.find("svg").simulate("click", {
          clientX: resourceProps.x,
          clientY: resourceProps.y
        });
        wrapper.setProps({ timeDelta: 1 });
        expect(wrapper.find(ResourceRender).exists()).toEqual(false);
      });

      it("depletes a resource when colliding slightly with a minion", () => {
        wrapper.find("#go").simulate("click");
        wrapper.find("svg").simulate("click", {
          clientX:
            resourceProps.x - (resourceProps.size + minionProps.size) + 0.1,
          clientY: resourceProps.y
        });
        wrapper.setProps({ timeDelta: 1 });
        expect(wrapper.find(ResourceRender).exists()).toEqual(false);
      });

      it("doesn't deplete a resource when near a minion", () => {
        wrapper.find("#go").simulate("click");
        wrapper.find("svg").simulate("click", {
          clientX:
            resourceProps.x - (resourceProps.size + minionProps.size) - 0.1,
          clientY: resourceProps.y
        });
        wrapper.setProps({ timeDelta: 1 });
        expect(wrapper.find(ResourceRender).exists()).toEqual(true);
      });

      it("initializes an empty inventory", () => {
        expect(wrapper.find("#inventory").text()).toEqual("resource: 0");
      });

      it("increases the inventory resource counter", () => {
        wrapper.find("#go").simulate("click");
        wrapper.find("svg").simulate("click", {
          clientX: resourceProps.x,
          clientY: resourceProps.y
        });
        wrapper.setProps({ timeDelta: 1 });
        expect(wrapper.find("#inventory").text()).toEqual("resource: 1");
      });
    });
  });
});
