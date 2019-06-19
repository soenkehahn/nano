// @flow

import * as React from "react";
import { type RenderProps } from "./minion";
import { type Vector } from "./vector";

export class Resource {
  id: number;
  static idCounter: number = 0;
  position: Vector = { x: 0, y: 0 };
  size: number = 10;

  constructor() {
    this.id = Resource.idCounter;
    Resource.idCounter++;
  }

  draw = (): React.Element<typeof ResourceRender> => {
    return (
      <ResourceRender key={this.id} position={this.position} size={this.size} />
    );
  };
}

export const ResourceRender = (props: RenderProps) => (
  <circle
    cx={props.position.x}
    cy={props.position.y}
    r={props.size}
    style={{ fill: "red" }}
  />
);
