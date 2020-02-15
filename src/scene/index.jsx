// @flow

import * as React from "react";
import * as stepDriver from "../stepDriver";
import { Minion } from "../scene/minion";
import { type Objects, insideViewBox } from "./objects";
import { type Rational, fromInt, rational } from "../data/rational";
import { type Size, SvgPane, type ViewBox } from "../svgPane";
import { type Vector, collides } from "../vector";
import { filter, sepBy } from "../utils";
import { some } from "lodash";

export type Config = {|
  initialSize: Vector,
  zoomVelocity: number,
  stepTimeDelta: Rational,
  stepsBeforeSpeedup: number,
  uiTimeFactor: Rational,
  velocity: Rational,
  costs: {
    factory: Rational,
    research: {
      "auto-mining": Rational,
      "auto-resource-seeking": Rational,
    },
  },
  researchVelocity: Rational,
  miningVelocity: Rational,
|};

export class SceneStepper {
  config: Config;
  scene: Scene;
  timeDeltaRemainder: number;

  constructor(config: Config, scene: Scene) {
    this.config = config;
    this.scene = scene;
    this.timeDeltaRemainder = 0;
    stepDriver.start(this.scene, config.stepTimeDelta.times(rational(1, 1000)));
  }

  draw: Size => React.Node = size => {
    return this.scene.draw(size);
  };
}

export class Scene {
  config: Config;
  svgPane: SvgPane;
  outerStepsSincePause: number = 0;
  time: Rational = fromInt(0);
  objects: Objects;
  inventory: Rational;

  constructor(
    config: Config,
    objects: (config: Config, scene: Scene) => Objects,
  ) {
    this.config = config;
    this.svgPane = new SvgPane({
      width: this.config.initialSize.x,
      height: config.initialSize.y,
      zoomVelocity: this.config.zoomVelocity,
    });
    this.inventory = fromInt(0);
    this.objects = objects(config, this);
  }

  collides: ({
    position: Vector,
    getRadius: () => number,
  }) => boolean = other => {
    for (const object of this.objects.resources.values()) {
      if (collides(object, other)) {
        return true;
      }
    }
    if (some(this.objects.factories, object => collides(object, other))) {
      return true;
    }
    if (collides(this.objects.lab, other)) {
      return true;
    }
    return false;
  };

  focusedMinion: () => Minion = () => this.objects.minions.focused();

  step: () => Promise<void> = async () => {
    const idle = this.objects.minions.anyIsIdle();
    if (idle) {
      const args = { paused: true };
      this.innerStep(args);
      this.outerStepsSincePause = 0;
    } else {
      const args = { paused: false };
      const numberOfSteps = Math.floor(
        Math.pow(
          Math.pow(2, 1 / this.config.stepsBeforeSpeedup),
          this.outerStepsSincePause,
        ),
      );
      for (let i = 0; i < numberOfSteps; i++) {
        this.time = this.time.plus(this.config.stepTimeDelta);
        this.innerStep(args);
      }
      this.outerStepsSincePause++;
    }
  };

  innerStep: ({ paused: boolean }) => void = args => {
    this.objects.lab.step(args);
    this.objects.minions.step(this, args);
  };

  onClick: Vector => void = target => {
    this.objects.minions.onClick(target);
  };

  draw: Size => React.Node = size => {
    return (
      <>
        <div
          style={{
            position: "absolute",
            margin: "0",
            width: "100%",
            height: "100%",
          }}
        >
          {this.svgPane.draw(this, size)}
        </div>
        <div
          style={{ position: "absolute", width: "100%", pointerEvents: "none" }}
        >
          <div
            style={{
              width: "340px",
              float: "right",
              margin: "8px",
              color: "white",
            }}
          >
            {this.interface()}
          </div>
        </div>
      </>
    );
  };

  interface: () => React.Node = () => {
    if (this.objects.resources.size === 0) {
      return (
        <div id="gameEndSuccess">
          All resources are mined. Congratulations, you&apos;ve beaten the game!
        </div>
      );
    }
    return (
      <div id="interface" style={{ display: "flex", padding: "0.2em" }}>
        <div style={{ flex: "1 1 0", margin: "0.2em" }}>
          {sepBy(<hr />, [
            this.objects.lab.buttons(),
            this.objects.lab.researchedUI(),
          ])}
        </div>
        <div style={{ flex: "1 1 0", margin: "0.2em" }}>
          {sepBy(<hr />, [
            <>Use the mouse to drag the map and the scroll wheel to zoom.</>,
            <div key="time" id="time">
              time: {this.time.times(this.config.uiTimeFactor).format()}
            </div>,
            <div key="inventory" id="inventory">
              resources: {this.inventory.format()}
            </div>,
            this.objects.minions.drawUI(this.svgPane),
          ])}
        </div>
      </div>
    );
  };

  drawSvgElements: ViewBox => React.Element<"g"> = viewBox => {
    let objects: Array<{
      position: Vector,
      getRadius: () => number,
      draw: () => React.Node,
    }> = [];
    objects = objects.concat(this.objects.factories);
    for (const resource of this.objects.resources.values()) {
      objects.push(resource);
    }
    objects.push(this.objects.lab);
    objects = objects.concat(this.objects.minions.toList());
    objects = filter(objects, object => insideViewBox(viewBox, object));
    return <g>{objects.map(x => x.draw())}</g>;
  };
}
