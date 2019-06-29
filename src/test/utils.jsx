// @flow

import * as jsdomExtensions from "../jsdomExtensions/svg";
import {
  type Config,
  Scene,
  type SceneRenderType,
  mkSceneRender,
} from "../scene";
import { Minion } from "../minion";
import { type Objects, mkObjects } from "../scene/objects";
import { ReactWrapper, mount } from "enzyme";
import { fromInt, rational } from "../rational";
import React from "react";

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
): [() => ReactWrapper<SceneRenderType>, () => Scene] => {
  beforeEach(() => {
    Minion.idCounter = 0;
  });

  let scene: Scene;
  let wrapper: ReactWrapper<SceneRenderType>;

  beforeEach(() => {
    scene = new Scene(testConfig(), testObjects);
    const SceneRender = mkSceneRender(testConfig(), scene);
    wrapper = mount(<SceneRender time={0} timeDelta={0} />);
    mockSvgJsdomExtensions(wrapper.find("svg"), { x: 0, y: 0 });
  });
  return [() => wrapper, () => scene];
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
