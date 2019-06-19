// @flow

import * as React from "react";
import { type RenderProps } from "./minion";
import { type Vector } from "./vector";

let counter = 0;

export class Factory {
  id: number;

  position: Vector;

  size: number = 16;

  constructor(position: Vector) {
    this.id = counter;
    counter++;
    this.position = position;
  }

  draw = (): React.Element<typeof FactoryRender> => {
    return (
      <FactoryRender key={this.id} position={this.position} size={this.size} />
    );
  };
}

export const FactoryRender = (props: RenderProps) => (
  <circle
    cx={props.position.x}
    cy={props.position.y}
    r={props.size}
    style={{ fill: "green" }}
  />
);
