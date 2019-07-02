// @flow

import "regenerator-runtime/runtime";
import { type Config, Scene, SceneStepper } from "./scene";
import { animate } from "./animated";
import { fromInt } from "./rational";
import { mkObjects } from "./scene/objects";
import { rational } from "./rational";
import React from "react";
import dom from "react-dom";

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
    config.velocity *= 25;
    config.researchVelocity = config.researchVelocity.times(fromInt(40));
    config.miningVelocity = config.miningVelocity.times(fromInt(20));
    config.costs.research["auto-mining"] = fromInt(0);
    config.costs.research["auto-resource-seeking"] = fromInt(0);
    for (const goal of ["mining", "auto-resource-seeking"]) {
      scene.objects.lab.researched.add(goal);
    }
    const newResources = new Map();
    for (const [id, resource] of scene.objects.resources) {
      newResources.set(id, resource);
      if (newResources.size >= 5) {
        break;
      }
    }
    scene.objects.resources = newResources;
  }
  const App = animate(new SceneStepper(config, scene));
  dom.render(<App />, appElement);
}
