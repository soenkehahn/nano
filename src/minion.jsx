// @flow

import { type Config } from "./scene";
import {
  type Position,
  add,
  difference,
  distance,
  scale,
  unit
} from "./vector";
import React from "react";

export class Minion {
  velocity: number;

  target: Position = {
    x: 0,
    y: 0
  };

  position: Position = {
    x: 0,
    y: 0
  };

  constructor(config: Config) {
    this.velocity = config.velocity;
  }

  onClick = (target: Position): void => {
    this.target = target;
  };

  step = (timeDelta: number): void => {
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
  };

  draw() {
    return <MinionRender x={this.position.x} y={this.position.y} />;
  }
}

export const MinionRender = (position: Position) => (
  <circle cx={position.x} cy={position.y} r="10" style={{ fill: lightBlue }} />
);

const lightBlue = "#8888ff";
