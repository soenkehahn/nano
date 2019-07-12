// @flow

import "regenerator-runtime/runtime";
import { type Config, Scene, SceneStepper } from "./scene";
import { animate } from "./animated";
import { fromInt } from "./rational";
import { mkObjects } from "./scene/objects";
import { rational } from "./rational";
import React from "react";
import dom from "react-dom";

function setupDevScene(config: Config) {
  config.velocity *= 5;
  config.researchVelocity = config.researchVelocity.times(fromInt(10));
  config.miningVelocity = config.miningVelocity.times(fromInt(10));
}

if (!module.parent) {
  const appElement = document.getElementById("app");
  if (!appElement) {
    throw new Error("cannot find element 'app'");
  }
  const config: Config = {
    initialSize: { x: 800, y: 550 },
    zoomVelocity: 1.15,
    stepTimeDelta: rational(1000, 60),
    velocity: 0.04,
    costs: {
      factory: fromInt(4),
      research: {
        mining: fromInt(0),
        "auto-mining": fromInt(15),
        "auto-resource-seeking": fromInt(15),
      },
    },
    researchVelocity: rational(5, 100000),
    miningVelocity: rational(5, 100000),
  };
  const scene = new Scene(config, mkObjects);
  const queryParams = new URLSearchParams(window.location.search);
  if (queryParams.get("dev")) {
    setupDevScene(config);
  }
  const App = animate(new SceneStepper(config, scene));
  dom.render(<App />, appElement);
}
