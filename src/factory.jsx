// @flow

import { type RenderProps } from "./minion";
import { type Vector } from "./vector";
import React from "react";

let counter = 0;

export class Factory {
  id: number;

  position: Vector;

  size: number = 14;

  constructor(position: Vector) {
    this.id = counter;
    counter++;
    this.position = position;
  }

  draw = (): React$Element<*> => {
    return (
      <FactoryRender
        key={this.id}
        x={this.position.x}
        y={this.position.y}
        size={this.size}
      />
    );
  };
}

export const FactoryRender = (props: RenderProps) => (
  <circle cx={props.x} cy={props.y} r={props.size} style={{ fill: "black" }} />
);