// @flow

import * as React from "react";
import { type RenderProps } from "./minion";
import { type Vector } from "./vector";

export class Resource {
  id: number;
  static idCounter: number = 0;
  position: Vector;
  radius: number = 10;

  constructor(position: Vector) {
    this.id = Resource.idCounter;
    Resource.idCounter++;
    this.position = position;
  }

  draw = (): React.Element<typeof ResourceRender> => {
    return (
      <ResourceRender
        key={this.id}
        position={this.position}
        radius={this.radius}
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
