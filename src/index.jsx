// @flow

import { type Config, mkScene } from "./scene";
import { animated } from "./animated";
import React from "react";
import dom from "react-dom";

const config: Config = { velocity: 0.3 };

if (!module.parent) {
  const appElement = document.getElementById("app");
  if (!appElement) {
    throw new Error("cannot find element 'app'");
  }
  const Scene = animated(mkScene(config));
  dom.render(<Scene />, appElement);
}
