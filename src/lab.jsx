// @flow

import * as React from "react";
import { type Config, Scene } from "./scene";
import { type RenderProps } from "./minion";
import { TAU, type Vector, add, fromAngle, scale } from "./vector";

export class Lab {
  config: Config;
  scene: Scene;
  position: Vector;
  size: number = 14;
  status: {| tag: "idle" |} | {| tag: "researching", completion: number |} = {
    tag: "idle",
  };

  constructor(config: Config, scene: Scene, position: Vector) {
    this.config = config;
    this.scene = scene;
    this.position = position;
  }

  startResearch = (): void => {
    this.status = { tag: "researching", completion: 0 };
  };

  step = (timeDelta: number) => {
    if (this.status.tag === "researching") {
      this.status.completion += timeDelta * this.config.researchVelocity;
      if (this.status.completion >= 1) {
        this.scene.canMine = true;
        this.status = { tag: "idle" };
      }
    }
  };

  draw = (): React.Element<typeof LabRender> => (
    <LabRender
      position={this.position}
      size={this.size}
      completion={
        this.status.tag === "researching" ? this.status.completion : null
      }
    />
  );
}

export const LabRender = (props: {|
  ...RenderProps,
  ...{| completion: ?number |},
|}) => (
  <g>
    <circle
      cx={props.position.x}
      cy={props.position.y}
      r={props.size - 1}
      style={{ stroke: "yellow", strokeWidth: "2", fillOpacity: "0" }}
    />
    <circle
      cx={props.position.x}
      cy={props.position.y}
      r={props.size * 0.4}
      style={{ fill: "yellow" }}
    />
    {drawCompletion(props)}
  </g>
);

function drawCompletion({
  position: { x, y },
  size,
  completion,
}: {|
  ...RenderProps,
  ...{| completion: ?number |},
|}): React.Element<"path"> {
  completion = completion || 0;
  const endpoint = add({ x, y }, scale(fromAngle(-TAU * completion), size));
  return (
    <path
      d={`
        M ${x} ${y}
        l 0 ${-size}
        A ${size} ${size} 0
          ${completion <= 0.5 ? 0 : 1}
          1
          ${endpoint.x} ${endpoint.y}
        L ${x} ${y}
      `}
      stroke={null}
      fill="yellow"
    />
  );
}
