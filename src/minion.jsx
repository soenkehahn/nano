// @flow

import { type Config, Scene } from "./scene";
import { Factory } from "./factory";
import {
  type Vector,
  add,
  collides,
  difference,
  distance,
  scale,
  unit
} from "./vector";
import React from "react";

export class Minion {
  config: Config;

  velocity: number;

  target: Vector;

  position: Vector;

  size: number = 10;

  _state: "idle" | "goCoordinates" | "go" = "idle";

  constructor(config: Config) {
    this.config = config;
    this.position = { x: 0, y: 0 };
    this.target = this.position;
    this.velocity = config.velocity;
  }

  onClick = (target: Vector): void => {
    if (this._state === "goCoordinates") {
      this.target = target;
      this._state = "go";
    }
  };

  step = (timeDelta: number, scene: Scene): void => {
    this.handleMovement(timeDelta);
    this.depleteResource(scene);
  };

  activeCommand = (): ?string => (this._state === "go" ? "go" : null);

  buttons = (scene: Scene): Array<React$Element<*>> => {
    if (this._state !== "idle") {
      return [];
    }
    const result = [];
    if (this._state === "idle") {
      result.push(
        <button
          key="go"
          id="goButton"
          onClick={() => {
            this._state = "goCoordinates";
          }}
        >
          go
        </button>
      );
    }
    if (scene.inventory >= this.config.prices.factory) {
      result.push(
        <button
          key="build"
          id="buildButton"
          onClick={() => {
            scene.factories.push(new Factory(this.position));
            scene.inventory -= this.config.prices.factory;
          }}
        >
          build
        </button>
      );
    }
    return result;
  };

  handleMovement = (timeDelta: number): void => {
    if (this._state === "go") {
      const distanceLeft = distance(this.target, this.position);
      const stepDistance = this.velocity * timeDelta;
      if (stepDistance < distanceLeft) {
        this.position = add(
          this.position,
          scale(unit(difference(this.position, this.target)), stepDistance)
        );
      } else {
        this.position = this.target;
        this._state = "idle";
      }
    }
  };

  depleteResource = (scene: Scene): void => {
    for (let i = 0; i < scene.resources.length; i++) {
      if (collides(this, scene.resources[i])) {
        scene.resources.splice(i, 1);
        scene.inventory++;
      }
    }
  };

  draw = (): React$Element<*> => {
    return (
      <MinionRender x={this.position.x} y={this.position.y} size={this.size} />
    );
  };
}

export type RenderProps = Vector & { size: number };

export const MinionRender = (props: RenderProps) => (
  <circle
    cx={props.x}
    cy={props.y}
    r={props.size}
    style={{ fill: lightBlue }}
  />
);

const lightBlue = "#8888ff";
