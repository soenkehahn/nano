// @flow

import { type RenderProps } from "./minion";
import { type Vector } from "./vector";
import React from "react";

export class Lab {
  position: Vector;

  size: number = 14;

  constructor(position: Vector) {
    this.position = position;
  }

  draw = (): React$Element<*> => (
    <LabRender x={this.position.x} y={this.position.y} size={this.size} />
  );
}

export const LabRender = (props: RenderProps) => (
  <circle cx={props.x} cy={props.y} r={props.size} style={{ fill: "yellow" }} />
);
