// @flow

import "@babel/polyfill";
import * as jsdomExtensions from "./jsdomExtensions/svg";
import { MinionRender } from "./minion";
import { ReactWrapper } from "enzyme";
import { mkScene, mkSceneRender } from "./scene";
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

let config;

beforeEach(() => {
  config = { stepTimeDelta: 0.5, velocity: 1 };
});

describe("SceneRender", () => {
  describe("with Scene", () => {
    let sceneRender;

    beforeEach(() => {
      const Scene = mkSceneRender(config, mkScene(config));
      sceneRender = mount(<Scene time={0} timeDelta={0} />);
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
      sceneRender.simulate("click", { clientX: 10, clientY: 10 });
      sceneRender.setProps({ timeDelta: 100 });
      expect(sceneRender.find(MinionRender).props()).toEqual({ x: 10, y: 10 });
    });

    it("takes the offset of the svg pane into account", () => {
      mockSvgJsdomExtensions(sceneRender.find("svg"), { x: 2, y: 1 });
      sceneRender.simulate("click", { clientX: 10, clientY: 10 });
      sceneRender.setProps({ timeDelta: 100 });
      expect(sceneRender.find(MinionRender).props()).toEqual({ x: 8, y: 9 });
    });

    it("minions need time to move around", () => {
      mockSvgJsdomExtensions(sceneRender.find("svg"), { x: 0, y: 0 });
      sceneRender.simulate("click", { clientX: 1, clientY: 0 });
      sceneRender.setProps({ timeDelta: 0.5 });
      expect(sceneRender.find(MinionRender).props()).toEqual({ x: 0.5, y: 0 });
    });

    it("calls step functions on fixed timeDeltas multiple times", () => {
      mockSvgJsdomExtensions(sceneRender.find("svg"), { x: 0, y: 0 });
      sceneRender.setProps({ timeDelta: 1 });
    });
  });

  describe("with mocked Scene", () => {
    let timeDeltas;

    beforeEach(() => {
      timeDeltas = [];
    });

    class MockScene {
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
