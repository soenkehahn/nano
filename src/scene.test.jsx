// @flow

import "@babel/polyfill";
import * as jsdomExtensions from "./jsdomExtensions/svg";
import { type Config, IScene, Inventory, Scene, mkSceneRender } from "./scene";
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
  describe("with Scene", () => {
    let sceneRender;

    beforeEach(() => {
      const SceneRender = mkSceneRender(config, new Scene(config));
      sceneRender = mount(<SceneRender time={0} timeDelta={0} />);
    });

    it("shows minion in svg context", () => {
      expect(
        sceneRender
          .find("svg")
          .find(MinionRender)
          .exists()
      ).toEqual(true);
    });

    it("allows to set the minion coordinates with a mouse click", async () => {
      mockSvgJsdomExtensions(sceneRender.find("svg"), { x: 0, y: 0 });
      sceneRender.find("svg").simulate("click", { clientX: 10, clientY: 10 });
      sceneRender.setProps({ timeDelta: 100 });
      expect(sceneRender.find(MinionRender).props()).toMatchObject({
        x: 10,
        y: 10
      });
    });

    it("takes the offset of the svg pane into account", () => {
      mockSvgJsdomExtensions(sceneRender.find("svg"), { x: 2, y: 1 });
      sceneRender.find("svg").simulate("click", { clientX: 10, clientY: 10 });
      sceneRender.setProps({ timeDelta: 100 });
      expect(sceneRender.find(MinionRender).props()).toMatchObject({
        x: 8,
        y: 9
      });
    });

    it("minions need time to move around", () => {
      mockSvgJsdomExtensions(sceneRender.find("svg"), { x: 0, y: 0 });
      sceneRender.find("svg").simulate("click", { clientX: 1, clientY: 0 });
      sceneRender.setProps({ timeDelta: 0.5 });
      expect(sceneRender.find(MinionRender).props()).toMatchObject({
        x: 0.5,
        y: 0
      });
    });

    it("calls step functions on fixed timeDeltas multiple times", () => {
      mockSvgJsdomExtensions(sceneRender.find("svg"), { x: 0, y: 0 });
      sceneRender.setProps({ timeDelta: 1 });
    });
  });

  describe("step function logic", () => {
    let timeDeltas;

    beforeEach(() => {
      timeDeltas = [];
    });

    class MockScene implements IScene {
      inventory = 0;
      step = (timeDelta: number) => {
        timeDeltas.push(timeDelta);
      };
      onClick = () => {};
      draw = () => <div />;
    }

    it("calls the step function as often as needed to reach the timeDelta", () => {
      config.stepTimeDelta = 1;
      const Scene = mkSceneRender(config, new MockScene());
      const sceneRender = mount(<Scene time={0} timeDelta={0} />);
      sceneRender.setProps({ timeDelta: 10 });
      expect(timeDeltas.length).toEqual(10);
    });

    it("calls the step function with fixed timeDeltas", () => {
      config.stepTimeDelta = 0.5;
      const Scene = mkSceneRender(config, new MockScene());
      const sceneRender = mount(<Scene time={0} timeDelta={0} />);
      sceneRender.setProps({ timeDelta: 5 });
      for (const timeDelta of timeDeltas) {
        expect(timeDelta).toEqual(0.5);
      }
    });

    it("saves the remainder of the timeDelta for the next round", () => {
      config.stepTimeDelta = 0.6;
      const Scene = mkSceneRender(config, new MockScene());
      const sceneRender = mount(<Scene time={0} timeDelta={0} />);
      sceneRender.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(1);
      sceneRender.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(3);
      sceneRender.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(5);
      sceneRender.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(6);
      sceneRender.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(8);
      sceneRender.setProps({ timeDelta: 1 });
      expect(timeDeltas.length).toEqual(10);
    });
  });
});

describe("Scene", () => {
  describe("resource", () => {
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
        wrapper.find("svg").simulate("click", {
          clientX: resourceProps.x,
          clientY: resourceProps.y
        });
        wrapper.setProps({ timeDelta: 1 });
        expect(wrapper.find(ResourceRender).exists()).toEqual(false);
      });

      it("depletes a resource when colliding slightly with a minion", () => {
        wrapper.find("svg").simulate("click", {
          clientX:
            resourceProps.x - (resourceProps.size + minionProps.size) + 0.1,
          clientY: resourceProps.y
        });
        wrapper.setProps({ timeDelta: 1 });
        expect(wrapper.find(ResourceRender).exists()).toEqual(false);
      });

      it("doesn't deplete a resource when near a minion", () => {
        wrapper.find("svg").simulate("click", {
          clientX:
            resourceProps.x - (resourceProps.size + minionProps.size) - 0.1,
          clientY: resourceProps.y
        });
        wrapper.setProps({ timeDelta: 1 });
        expect(wrapper.find(ResourceRender).exists()).toEqual(true);
      });

      it("initializes an empty inventory", () => {
        expect(wrapper.find(Inventory).text()).toEqual("resource: 0");
      });

      it("increases the inventory resource counter", () => {
        wrapper.find("svg").simulate("click", {
          clientX: resourceProps.x,
          clientY: resourceProps.y
        });
        wrapper.setProps({ timeDelta: 1 });
        expect(wrapper.find(Inventory).text()).toEqual("resource: 1");
      });
    });
  });
});
