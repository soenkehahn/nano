// @flow

import "regenerator-runtime/runtime";
import { type Config, Scene, mkSceneRender } from "./scene";
import { animated } from "./animated";
import { fromInt } from "./rational";
import { mkObjects } from "./scene/objects";
import { rational } from "./rational";
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
    stepTimeDelta: rational(1000, 60),
    velocity: 0.06,
    costs: {
      factory: fromInt(3),
      research: {
        mining: fromInt(0),
        "auto-mining": fromInt(5),
      },
    },
    researchVelocity: rational(1, 100000),
    miningVelocity: rational(1, 10000),
  };
  const queryParams = new URLSearchParams(window.location.search);
  if (queryParams.get("dev")) {
    config.velocity *= 25;
    config.researchVelocity = config.researchVelocity.times(fromInt(40));
    config.miningVelocity = config.miningVelocity.times(fromInt(20));
    config.costs.research["auto-mining"] = fromInt(1);
  }
  const SceneRender = animated(
    slowDown,
    mkSceneRender(config, new Scene(config, mkObjects)),
  );
  dom.render(<SceneRender />, appElement);
}
