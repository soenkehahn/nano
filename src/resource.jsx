// @flow

import { type Vector } from "./vector";
import React from "react";

export class Resource {
  draw = (): React$Element<*> => {
    return <ResourceRender x={100} y={100} />;
  };
}

export const ResourceRender = (position: Vector) => (
  <circle cx={position.x} cy={position.y} r="10" style={{ fill: "red" }} />
);
