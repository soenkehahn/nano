// @flow

import * as React from "react";
import * as jsdomExtensions from "../jsdomExtensions/svg";
import { type Config, Scene, SceneStepper } from "../scene";
import { Minion } from "../minion";
import { type Objects, mkObjects } from "../scene/objects";
import { ReactWrapper, mount } from "enzyme";
import { type TimeStep } from "../animated";
import { type Vector } from "../vector";
import { createElement } from "react";
import { fromInt, rational } from "../rational";

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
      velocity: 1,
      costs: {
        factory: fromInt(3),
        research: {
          mining: fromInt(0),
          "auto-mining": fromInt(10),
          "auto-resource-seeking": fromInt(10),
        },
      },
      researchVelocity: fromInt(1),
      miningVelocity: fromInt(1000),
    };
  });
  return () => config;
};

export const setupSceneWrapper = (
  testConfig: () => Config,
): {
  wrapper: () => ReactWrapper<(TimeStep) => React.Node>,
  scene: () => Scene,
  update: () => void,
  step: (steps?: number) => void,
} => {
  beforeEach(() => {
    Minion.idCounter = 0;
  });

  let scene: Scene;
  let wrapper: ReactWrapper<(TimeStep) => React.Node>;

  beforeEach(() => {
    scene = new Scene(testConfig(), testObjects);
    const sceneStepper = new SceneStepper(testConfig(), scene);
    wrapper = mount(
      createElement(sceneStepper.draw, { time: 0, timeDelta: 0 }),
    );
    mockSvgJsdomExtensions(wrapper.find("svg"), { x: 0, y: 0 });
  });

  function update() {
    wrapper.setProps({ timeDelta: 0.0 });
  }

  function step(steps?: number = 1) {
    for (let i = 0; i < steps; i++) {
      scene.step();
    }
    wrapper.setProps({});
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

export function unsafeGet<Key, Value>(map: Map<Key, Value>, key: Key): Value {
  const result = map.get(key);
  if (result === undefined) {
    const k: any = key;
    throw new Error(`key error: ${k}`);
  }
  return result;
}

export function sendMinion(scene: () => Scene, target: Vector) {
  scene().focusedMinion().status = {
    tag: "moving",
    target,
  };
}
