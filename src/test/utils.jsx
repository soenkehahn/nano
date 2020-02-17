// @flow

import * as React from "react";
import * as jsdomExtensions from "../web/svg";
import { type Config, Scene } from "../scene";
import { Minion } from "../scene/minion";
import { type Objects, mkObjects } from "../scene/objects";
import { ReactWrapper, mount } from "enzyme";
import { type Vector } from "../data/vector";
import { createElement } from "react";
import { fromInt, rational } from "../data/rational";

export function mockSvgJsdomExtensions(
  svgWrapper: ReactWrapper<any>,
  offset: { x: number, y: number },
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
    createSVGPoint: () => new jsdomExtensions.SvgPoint(),
  };
  for (const field in mockExtensions) {
    (svgElement: any)[field] = mockExtensions[field];
  }
}

export const setupTestConfig: () => () => Config = () => {
  let config: Config;
  beforeEach(() => {
    config = {
      initialSize: { x: 200, y: 200 },
      zoomVelocity: 1.1,
      stepTimeDelta: rational(1, 2),
      stepsBeforeSpeedup: 10000,
      uiTimeFactor: fromInt(1),
      velocity: fromInt(1),
      costs: {
        factory: fromInt(3),
        seeding: fromInt(3),
        research: {
          "auto-mining": fromInt(10),
          "auto-resource-seeking": fromInt(10),
        },
      },
      researchVelocity: fromInt(1),
      miningVelocity: fromInt(1000),
      breedingVelocity: fromInt(10),
      seeding: {
        resources: 4,
      },
    };
  });
  return () => config;
};

export const setupSceneWrapper = (
  testConfig: () => Config,
): {
  wrapper: () => ReactWrapper<() => React.Node>,
  scene: () => Scene,
  update: () => void,
  step: (steps?: number) => void,
} => {
  beforeEach(() => {
    Minion.idCounter = 0;
  });

  let scene: Scene;
  let wrapper: ReactWrapper<() => React.Node>;

  beforeEach(() => {
    scene = new Scene(testConfig(), testObjects);
    wrapper = mount(
      createElement(() => scene.draw({ width: 200, height: 200 })),
    );
    mockSvgJsdomExtensions(wrapper.find("svg"), { x: 0, y: 0 });
  });

  function update() {
    wrapper.setProps({});
  }

  function step(steps?: number = 1) {
    for (let i = 0; i < steps; i++) {
      scene.step();
    }
    update();
  }

  return {
    wrapper: () => wrapper,
    scene: () => scene,
    update,
    step,
  };
};

export function testObjects(config: Config, scene: Scene): Objects {
  return mkObjects(config, scene, 1);
}

export function sendMinion(scene: () => Scene, target: Vector) {
  scene().focusedMinion().status = {
    tag: "moving",
    target,
  };
}
