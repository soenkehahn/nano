// @flow

import { type RenderProps } from "./minion";
import { type Vector } from "./vector";
import React from "react";

export class Resource {
  id: number;
  static idCounter: number = 0;
  position: Vector = { x: 0, y: 0 };
  size: number = 10;

  constructor() {
    this.id = Resource.idCounter;
    Resource.idCounter++;
  }

  draw = (): React$Element<*> => {
    return <ResourceRender key={this.id} {...this.position} size={this.size} />;
  };
}

export const ResourceRender = (props: RenderProps) => (
  <circle cx={props.x} cy={props.y} r={props.size} style={{ fill: "red" }} />
);
