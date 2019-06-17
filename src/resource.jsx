// @flow

import { type Vector } from "./vector";
import { type RenderProps } from "./minion";
import React from "react";

export class Resource {
  position: Vector = { x: 100, y: 100 };

  size: number = 10;

  draw = (): React$Element<*> => {
    return <ResourceRender {...this.position} size={this.size} />;
  };
}

export const ResourceRender = (props: RenderProps) => (
  <circle cx={props.x} cy={props.y} r={props.size} style={{ fill: "red" }} />
);
