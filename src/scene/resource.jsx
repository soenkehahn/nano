// @flow

import * as React from "react";
import { type Rational, fromInt } from "../rational";
import { type RenderProps } from "./minion";
import { type Vector } from "../vector";

export class Resource {
  static keyCounter: number = 0;
  key: number;
  position: Vector;
  static initialRadius: number = 10;
  static initialUnits: Rational = fromInt(1);
  status: { unitsLeft: Rational } = {
    unitsLeft: Resource.initialUnits,
  };

  constructor(position: Vector) {
    this.key = Resource.keyCounter;
    Resource.keyCounter++;
    this.position = position;
  }

  getRadius = () =>
    (this.status.unitsLeft.toNumber() / Resource.initialUnits.toNumber()) *
    Resource.initialRadius;

  mine: Rational => Rational = fraction => {
    const oldUnitsLeft = this.status.unitsLeft;
    this.status.unitsLeft = this.status.unitsLeft.minus(
      fraction.times(Resource.initialUnits),
    );
    if (this.status.unitsLeft.le(fromInt(0))) {
      this.status.unitsLeft = fromInt(0);
    }
    return oldUnitsLeft.minus(this.status.unitsLeft);
  };

  draw: () => React.Node = () => {
    return (
      <ResourceRender
        key={this.key}
        position={this.position}
        radius={this.getRadius()}
      />
    );
  };
}

export const ResourceRender = (props: RenderProps) => (
  <circle
    cx={props.position.x}
    cy={props.position.y}
    r={props.radius}
    style={{ fill: "red" }}
  />
);
