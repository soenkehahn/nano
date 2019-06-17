// @flow

import { type RenderProps } from "./minion";
import { type Vector } from "./vector";
import React from "react";

export class Resource {
  id: number;

  position: Vector = { x: 0, y: 0 };

  size: number = 10;

  constructor(id: number) {
    this.id = id;
  }

  draw = (): React$Element<*> => {
    return <ResourceRender key={this.id} {...this.position} size={this.size} />;
  };
}

export const ResourceRender = (props: RenderProps) => (
  <circle cx={props.x} cy={props.y} r={props.size} style={{ fill: "red" }} />
);
