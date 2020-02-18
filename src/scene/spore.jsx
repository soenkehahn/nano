// @flow

import * as React from "react";
import { Minion } from "./minion";
import { type Rational, fromInt } from "../data/rational";
import { Resource } from "./resource";
import { Scene } from ".";
import { type Vector } from "../data/vector";
import { cloneDeep } from "lodash";

export class Spore {
  static radius = 300;
  id: number;
  position: Vector;
  completion: Rational = fromInt(0);

  static addSpore(scene: Scene, resource: Resource) {
    const spore = new Spore(cloneDeep(resource.position));
    scene.objects.spores.add(spore);
  }

  constructor(position: Vector) {
    this.position = position;
  }

  getRadius: () => number = () => Spore.radius;

  draw: () => React.Node = () => (
    <SporeRender
      key={`spore-${this.id}`}
      id={this.id}
      position={this.position}
      radius={Spore.radius}
      completion={this.completion.toNumber()}
    />
  );
}

const sporeColor = "#77cc00";

export const SporeRender = (props: {|
  id: number,
  position: Vector,
  radius: number,
  completion: number,
|}) => {
  const maskId = `spore-mask-${props.id}`;
  return (
    <>
      <mask id={maskId}>
        <circle
          cx={props.position.x}
          cy={props.position.y}
          r={props.radius}
          fill="white"
        />
        <circle
          cx={props.position.x}
          cy={props.position.y}
          r={Minion.radius + (props.radius - Minion.radius) * props.completion}
          fill="black"
        />
      </mask>
      <rect
        x={props.position.x - props.radius}
        y={props.position.y - props.radius}
        width={props.radius * 2}
        height={props.radius * 2}
        fill={sporeColor}
        opacity={0.1}
        mask={`url(#${maskId})`}
      />
    </>
  );
};
