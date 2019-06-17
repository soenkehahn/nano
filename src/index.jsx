// @flow

import "regenerator-runtime/runtime";
import { type Config, Scene, mkSceneRender } from "./scene";
import { animated } from "./animated";
import React from "react";
import dom from "react-dom";

const config: Config = { stepTimeDelta: 3, velocity: 0.3 };

if (!module.parent) {
  const appElement = document.getElementById("app");
  if (!appElement) {
    throw new Error("cannot find element 'app'");
  }
  const SceneRender = animated(mkSceneRender(config, new Scene(config)));
  dom.render(<SceneRender />, appElement);
}
