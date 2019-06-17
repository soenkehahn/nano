// @flow

import { type Config, Scene } from "./scene";
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
  velocity: number;

  target: Vector;

  position: Vector;

  size: number = 10;

  constructor(config: Config) {
    this.position = { x: 0, y: 0 };
    this.target = this.position;
    this.velocity = config.velocity;
  }

  onClick = (target: Vector): void => {
    this.target = target;
  };

  step = (timeDelta: number, scene: Scene): void => {
    const distanceLeft = distance(this.target, this.position);
    const stepDistance = this.velocity * timeDelta;
    if (stepDistance < distanceLeft) {
      this.position = add(
        this.position,
        scale(unit(difference(this.position, this.target)), stepDistance)
      );
    } else {
      this.position = this.target;
    }
    this.depleteResource(scene);
  };

  depleteResource = (scene: Scene): void => {
    for (let i = 0; i < scene.resources.length; i++) {
      if (collides(this, scene.resources[i])) {
        scene.resources.splice(i, 1);
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
