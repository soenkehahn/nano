// @flow

import * as React from "react";
import { type RenderProps } from "./minion";
import { type Vector } from "./vector";

export class Resource {
  static idCounter: number = 0;
  id: number;
  position: Vector;
  static initialRadius: number = 10;
  status: { unitsLeft: number, level: number } = {
    unitsLeft: 100,
    level: 1,
  };

  constructor(position: Vector) {
    this.id = Resource.idCounter;
    Resource.idCounter++;
    this.position = position;
  }

  getRadius = () => this.status.level * Resource.initialRadius;

  mine = (fraction: number): number => {
    this.status.level = Math.max(0, this.status.level - fraction);
    const oldUnitsLeft = this.status.unitsLeft;
    this.status.unitsLeft = Math.ceil(this.status.level * 100);
    return oldUnitsLeft - this.status.unitsLeft;
  };

  draw = (): React.Element<typeof ResourceRender> => {
    return (
      <ResourceRender
        key={this.id}
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
