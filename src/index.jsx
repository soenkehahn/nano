// @flow

import "regenerator-runtime/runtime";
import { type Config, Scene, mkSceneRender } from "./scene";
import { animated } from "./animated";
import React from "react";
import dom from "react-dom";

const slowDown = null;

if (!module.parent) {
  const appElement = document.getElementById("app");
  if (!appElement) {
    throw new Error("cannot find element 'app'");
  }
  const config: Config = {
    sceneSize: 500,
    zoomVelocity: 1.15,
    stepTimeDelta: 1000 / 60,
    velocity: 0.03,
    prices: { factory: 3 },
    researchVelocity: 0.00001
  };
  const queryParams = new URLSearchParams(window.location.search);
  if (queryParams.get("dev")) {
    config.velocity = config.velocity * 10;
    config.researchVelocity = config.researchVelocity * 20;
  }
  const SceneRender = animated(
    slowDown,
    mkSceneRender(config, new Scene(config))
  );
  dom.render(<SceneRender />, appElement);
}
