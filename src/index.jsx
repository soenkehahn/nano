// @flow

import "regenerator-runtime/runtime";
import { type Config, Scene, mkSceneRender } from "./scene";
import { animated } from "./animated";
import React from "react";
import dom from "react-dom";

const config: Config = {
  dimensions: { lower: -250, upper: 250 },
  stepTimeDelta: 3,
  velocity: 0.03,
  prices: { factory: 3 },
  researchVelocity: 0.00001
};

const slowDown = null;

if (!module.parent) {
  const appElement = document.getElementById("app");
  if (!appElement) {
    throw new Error("cannot find element 'app'");
  }
  const SceneRender = animated(
    slowDown,
    mkSceneRender(config, new Scene(config))
  );
  dom.render(<SceneRender />, appElement);
}
