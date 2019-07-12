// @flow

import * as React from "react";
import { Minion } from "../minion";
import { type Objects, insideViewBox } from "./objects";
import { type Rational, fromInt } from "../rational";
import { SvgPane, type ViewBox } from "../svgPane";
import { type TimeStep } from "../animated";
import { type Vector, collides } from "../vector";
import { renderButtons } from "../button";
import { some } from "lodash";

export type Config = {|
  initialSize: Vector,
  zoomVelocity: number,
  stepTimeDelta: Rational,
  velocity: number,
  costs: {
    factory: Rational,
    research: {
      mining: Rational,
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
  }

  step: TimeStep => void = props => {
    const timeDelta = props.timeDelta + this.timeDeltaRemainder;
    const n = Math.floor(timeDelta / this.config.stepTimeDelta.toNumber());
    for (let i = 0; i < n; i++) {
      this.scene.step(this.config.stepTimeDelta);
    }
    this.timeDeltaRemainder = timeDelta % this.config.stepTimeDelta.toNumber();
  };

  draw: TimeStep => React.Node = props => {
    this.step(props);
    return this.scene.draw();
  };
}

export class Scene {
  config: Config;
  svgPane: SvgPane;
  inventory: Rational;
  objects: Objects;

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

  step: Rational => void = timeDelta => {
    const idle = this.objects.minions.anyIsIdle();
    timeDelta = idle ? null : timeDelta;
    this.objects.lab.step(timeDelta);
    this.objects.minions.step(this, timeDelta);
  };

  onClick: Vector => void = target => {
    this.objects.minions.onClick(target);
  };

  draw: () => React.Node = () => {
    return (
      <div style={{ display: "flex" }}>
        {this.svgPane.render(this)}
        <div style={{ flexGrow: 1 }}>{this.interface()}</div>
      </div>
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
          {this.activeCommand()}
          available commands:
          {this.focusedMinion().interface()}
          {renderButtons(this.objects.lab.buttons())}
          <hr />
          <div id="inventory">resources: {this.inventory.format()}</div>
          <hr />
          {this.objects.lab.newResearch()}
          <hr />
          <>Use the mouse to drag the map and the scroll wheel to zoom.</>
        </div>
        <div style={{ flex: "1 1 0", margin: "0.2em" }}>
          minions: {this.objects.minions.minions.length}
          <hr />
          idle:
          {renderButtons(this.objects.minions.idleButtons(this.svgPane))}
        </div>
      </div>
    );
  };

  activeCommand: () => null | React.Node = () => {
    const status = this.focusedMinion().getStatus();
    if (status === null) return null;
    else return <div id="status">{status}</div>;
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
    objects = objects.filter(object => insideViewBox(viewBox, object));
    return <g>{objects.map(x => x.draw())}</g>;
  };
}
