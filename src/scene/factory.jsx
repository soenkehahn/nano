// @flow

import * as React from "react";
import { type Config, Scene } from ".";
import { Minion, type RenderProps } from "./minion";
import { type Vector } from "../data/vector";

let counter = 0;

export class Factory {
  id: number;

  position: Vector;

  static radius: number = 16;

  constructor(position: Vector) {
    this.id = counter;
    counter++;
    this.position = position;
  }

  getRadius = () => Factory.radius;

  static construct(config: Config, scene: Scene, position: Vector) {
    scene.objects.factories.push(new Factory(position));
    scene.objects.minions.add(new Minion(config, scene, position));
    scene.inventory = scene.inventory.minus(config.costs.factory);
  }

  draw: () => React.Node = () => {
    return (
      <FactoryRender
        key={this.id}
        position={this.position}
        radius={Factory.radius}
      />
    );
  };
}

export const FactoryRender = (props: RenderProps) => (
  <circle
    cx={props.position.x}
    cy={props.position.y}
    r={props.radius}
    style={{ fill: "green" }}
  />
);
