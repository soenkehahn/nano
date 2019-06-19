// @flow

import * as React from "react";
import { type RenderProps } from "./minion";
import { type Vector } from "./vector";

let counter = 0;

export class Factory {
  id: number;

  position: Vector;

  radius: number = 16;

  constructor(position: Vector) {
    this.id = counter;
    counter++;
    this.position = position;
  }

  getRadius = () => this.radius;

  draw = (): React.Element<typeof FactoryRender> => {
    return (
      <FactoryRender
        key={this.id}
        position={this.position}
        radius={this.radius}
      />
    );
  };
}

export const FactoryRender = (props: RenderProps) => (
  <circle
    cx={props.position.x}
    cy={props.position.y}
    r={props.radius}
    style={{ fill: "green" }}
  />
);
