// @flow

import "regenerator-runtime/runtime";
import { type Config, Scene, SceneStepper } from "./scene";
import { animate } from "./web/animated";
import { fromInt, rational } from "./data/rational";
import { mkObjects } from "./scene/objects";
import { withSize } from "./utils/withSize";
import React from "react";
import dom from "react-dom";

function setupDevScene(config: Config, scene: Scene) {
  scene.objects.lab.researched.add("auto-mining");
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
    stepsBeforeSpeedup: 30,
    uiTimeFactor: rational(1, 1000000),
    velocity: rational(4, 100),
    costs: {
      factory: fromInt(3),
      seeding: fromInt(13),
      research: {
        "auto-mining": fromInt(5),
        "auto-resource-seeking": fromInt(5),
      },
    },
    researchVelocity: rational(5, 100000),
    miningVelocity: rational(5, 100000),
    breedingVelocity: rational(1, 1000000),
    seeding: {
      resources: 25,
    },
  };
  const scene = new Scene(config, mkObjects);
  const queryParams = new URLSearchParams(window.location.search);
  if (queryParams.get("dev")) {
    setupDevScene(config, scene);
  }
  const App = withSize(animate(new SceneStepper(config, scene)));
  dom.render(
    <div style={{ height: "100%", overflow: "hidden" }}>
      <App />
    </div>,
    appElement,
  );
}
