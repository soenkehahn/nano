// @flow

import "regenerator-runtime/runtime";
import { type Config, Scene, mkSceneRender } from "./scene";
import { animated } from "./animated";
import { mkObjects } from "./scene/objects";
import React from "react";
import dom from "react-dom";

const slowDown = null;

if (!module.parent) {
  const appElement = document.getElementById("app");
  if (!appElement) {
    throw new Error("cannot find element 'app'");
  }
  const config: Config = {
    initialSize: { x: 800, y: 550 },
    zoomVelocity: 1.15,
    stepTimeDelta: 1000 / 60,
    velocity: 0.03,
    prices: { factory: 3 },
    researchVelocity: 0.00001,
    miningVelocity: 0.00004,
  };
  const queryParams = new URLSearchParams(window.location.search);
  if (queryParams.get("dev")) {
    config.velocity *= 25;
    config.researchVelocity *= 40;
    config.miningVelocity *= 20;
  }
  const SceneRender = animated(
    slowDown,
    mkSceneRender(config, new Scene(config, mkObjects)),
  );
  dom.render(<SceneRender />, appElement);
}
