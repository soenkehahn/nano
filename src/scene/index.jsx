// @flow

import * as React from "react";
import { type Button, Minion } from "../minion";
import { type Objects, insideViewBox } from "./objects";
import { type Rational, fromInt } from "../rational";
import { SvgPane, type ViewBox } from "../svgPane";
import { type TimeStep } from "../animated";
import { type Vector, collides } from "../vector";
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
    return (
      <div id="interface">
        <div style={{ paddingLeft: "1em", width: "50%", float: "left" }}>
          <div style={{ height: "10em" }}>
            {this.activeCommand()}
            available commands:
            {renderButtons(
              this.focusedMinion()
                .buttons(this)
                .concat(this.objects.lab.buttons()),
            )}
          </div>
          <div id="inventory" style={{ height: "10em" }}>
            resources: {Math.round(this.inventory.toNumber() * 100) / 100}
          </div>
          {this.objects.lab.newResearch()}
          <>Use the mouse to drag the map and the scroll wheel to zoom.</>
        </div>
        <>
          minions: {this.objects.minions.minions.length}
          <br />
          idle:
          {renderButtons(this.objects.minions.idleButtons())}
        </>
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

function renderButtons(buttons: Array<Button>): ?React.Node {
  if (buttons.length === 0) return null;
  return (
    <ul>
      {buttons.map(button => {
        return (
          <li key={button.id}>
            <button
              id={button.id}
              disabled={button.disabled}
              onClick={button.onClick}
            >
              {button.text}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
