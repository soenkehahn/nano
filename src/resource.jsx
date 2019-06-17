// @flow

import React from "react";
import { type Vector } from "./vector";
import { type Steppable } from "./scene";

export class Resource {
  draw = (): React$Element<*> => {
    return <ResourceRender x={100} y={300} />;
  };
}

export const ResourceRender = (position: Vector) => (
  <circle cx={position.x} cy={position.y} r="10" style={{ fill: "red" }} />
);
