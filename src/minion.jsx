// @flow

import * as React from "react";
import { type Config, Scene } from "./scene";
import { Factory } from "./factory";
import { SvgPane } from "./svgPane";
import {
  type Vector,
  add,
  collides,
  difference,
  distance,
  scale,
  unit,
} from "./vector";

export type Button = {|
  id: string,
  text: string,
  onClick: () => void,
|};

export class Minion {
  config: Config;
  velocity: number;
  target: Vector;
  position: Vector;
  radius: number = 10;
  _state:
    | {| tag: "idle" |}
    | {| tag: "waitForMoveTarget" |}
    | {| tag: "moving" |}
    | {| tag: "mining", i: number |} = {
    tag: "idle",
  };

  constructor(config: Config, position: Vector) {
    this.config = config;
    this.position = position;
    this.target = this.position;
    this.velocity = config.velocity;
  }

  getRadius = () => this.radius;

  onClick: Vector => void = target => {
    if (this._state.tag === "waitForMoveTarget") {
      this.target = target;
      this._state = { tag: "moving" };
      SvgPane.draggingEnabled = true;
    }
  };

  step: (Scene, number) => void = (scene, timeDelta) => {
    if (this._state.tag === "moving") {
      this.move(timeDelta);
    } else if (this._state.tag === "mining") {
      this.mine(scene, timeDelta, this._state.i);
    }
  };

  status: () => ?string = () => {
    if (this._state.tag === "moving") return "status: moving...";
    else if (this._state.tag === "mining") return "status: mining...";
    else if (this._state.tag === "waitForMoveTarget")
      return "click on the map to set the target";
    else if (this._state.tag === "idle") return null;
    else {
      (this._state.tag: empty);
    }
  };

  buttons: Scene => Array<Button> = scene => {
    if (this._state.tag !== "idle") {
      return [];
    }
    const result: Array<Button> = [];
    result.push({
      id: "moveButton",
      text: "move",
      onClick: () => {
        SvgPane.draggingEnabled = false;
        this._state = { tag: "waitForMoveTarget" };
      },
    });
    if (
      collides(this, scene.objects.lab) &&
      scene.objects.lab.status.tag === "idle" &&
      !scene.canMine
    ) {
      result.push({
        id: "researchButton",
        text: "research mining",
        onClick: () => {
          scene.objects.lab.startResearch();
        },
      });
    }
    if (scene.canMine) {
      for (let i = 0; i < scene.objects.resources.length; i++) {
        if (collides(this, scene.objects.resources[i])) {
          result.push({
            id: `mineButton-${i}`,
            text: "mine",
            onClick: () => {
              this._state = { tag: "mining", i };
            },
          });
        }
      }
    }
    if (scene.inventory >= this.config.prices.factory) {
      result.push({
        id: "buildButton",
        text: "build",
        onClick: () => {
          scene.objects.factories.push(new Factory(this.position));
          scene.inventory -= this.config.prices.factory;
        },
      });
    }
    return result;
  };

  move: number => void = timeDelta => {
    const distanceLeft = distance(this.target, this.position);
    const stepDistance = this.velocity * timeDelta;
    if (stepDistance < distanceLeft) {
      this.position = add(
        this.position,
        scale(unit(difference(this.position, this.target)), stepDistance),
      );
    } else {
      this.position = this.target;
      this._state = { tag: "idle" };
    }
  };

  mine: (Scene, number, number) => void = (scene, timeDelta, i) => {
    const resource = scene.objects.resources[i];
    if (collides(this, resource)) {
      scene.inventory += resource.mine(timeDelta * this.config.miningVelocity);
      if (resource.status.level === 0) {
        scene.objects.resources.splice(i, 1);
        this._state = { tag: "idle" };
      }
    } else {
      this._state = { tag: "idle" };
    }
  };

  draw: () => React.Node = () => {
    return (
      <MinionRender
        key="minion"
        position={this.position}
        radius={this.radius}
      />
    );
  };
}

export type RenderProps = {| position: Vector, radius: number |};

export const MinionRender = (props: RenderProps) => (
  <circle
    cx={props.position.x}
    cy={props.position.y}
    r={props.radius}
    style={{ fill: lightBlue, fillOpacity: 0.8 }}
  />
);

const lightBlue = "#8888ff";
