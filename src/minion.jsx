// @flow

import * as React from "react";
import { type Config, Scene } from "./scene";
import { Factory } from "./factory";
import { type Rational, fromInt } from "./rational";
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
  disabled: boolean,
  onClick: () => void,
|};

type Status =
  | {| tag: "idle" |}
  | {| tag: "waitForMoveTarget" |}
  | {| tag: "moving" |}
  | {| tag: "mining", i: number, autoMiningSuccessor?: Status |};

export class Minion {
  config: Config;
  target: Vector;
  position: Vector;
  radius: number = 10;
  status: Status = { tag: "idle" };
  collidingResources: Array<number> = [];

  constructor(config: Config, position: Vector) {
    this.config = config;
    this.position = position;
    this.target = this.position;
  }

  getRadius = () => this.radius;

  onClick: Vector => void = target => {
    if (this.status.tag === "waitForMoveTarget") {
      this.target = target;
      this.status = { tag: "moving" };
      SvgPane.draggingEnabled = true;
    }
  };

  step: (Scene, Rational) => void = (scene, timeDelta) => {
    if (this.status.tag === "moving") {
      this.move(timeDelta);
    }
    this.collidingResources = [];
    for (let i = 0; i < scene.objects.resources.length; i++) {
      if (collides(this, scene.objects.resources[i])) {
        this.collidingResources.push(i);
      }
    }
    if (
      scene.objects.lab.researched.has("auto-mining") &&
      this.collidingResources.length > 0
    ) {
      this.status = {
        tag: "mining",
        i: this.collidingResources[0],
        autoMiningSuccessor: this.status,
      };
    }
    if (this.status.tag === "mining") {
      this.mine(scene, timeDelta, this.status.i);
    }
  };

  getStatus: () => ?string = () => {
    if (this.status.tag === "moving") return "status: moving...";
    else if (this.status.tag === "mining") return "status: mining...";
    else if (this.status.tag === "waitForMoveTarget")
      return "click on the map to set the target";
    else if (this.status.tag === "idle") return null;
    else {
      (this.status.tag: empty);
    }
  };

  buttons: Scene => Array<Button> = scene => {
    if (this.status.tag !== "idle") {
      return [];
    }
    const result: Array<Button> = [];
    result.push({
      id: "moveButton",
      text: "move",
      disabled: false,
      onClick: () => {
        SvgPane.draggingEnabled = false;
        this.status = { tag: "waitForMoveTarget" };
      },
    });
    if (
      scene.objects.lab.researched.has("mining") &&
      this.collidingResources.length > 0
    ) {
      const i = this.collidingResources[0];
      result.push({
        id: `mineButton-${i}`,
        text: "mine",
        disabled: false,
        onClick: () => {
          this.status = { tag: "mining", i };
        },
      });
    }
    if (scene.inventory.ge(this.config.costs.factory)) {
      result.push({
        id: "buildButton",
        text: "build",
        disabled: false,
        onClick: () => {
          scene.objects.factories.push(new Factory(this.position));
          scene.inventory = scene.inventory.minus(this.config.costs.factory);
        },
      });
    }
    return result;
  };

  move: Rational => void = timeDelta => {
    const distanceLeft = distance(this.target, this.position);
    const stepDistance = this.config.velocity * timeDelta.toNumber();
    if (stepDistance < distanceLeft) {
      this.position = add(
        this.position,
        scale(unit(difference(this.position, this.target)), stepDistance),
      );
    } else {
      this.position = this.target;
      this.status = { tag: "idle" };
    }
  };

  mine: (Scene, Rational, number) => void = (scene, timeDelta, i) => {
    const resource = scene.objects.resources[i];
    if (collides(this, resource)) {
      scene.inventory = scene.inventory.plus(
        resource.mine(timeDelta.times(this.config.miningVelocity)),
      );
      if (resource.status.unitsLeft.equals(fromInt(0))) {
        scene.objects.resources.splice(i, 1);
        this.status = this.status.autoMiningSuccessor || { tag: "idle" };
      }
    } else {
      this.status = this.status.autoMiningSuccessor || { tag: "idle" };
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
