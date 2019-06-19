// @flow

import * as React from "react";
import { type Config, Scene } from "./scene";
import { Factory } from "./factory";
import { SvgPane } from "./svgPane";
import {
  type Vector,
  add,
  collides,
  difference,
  distance,
  scale,
  unit,
} from "./vector";

export class Minion {
  config: Config;
  velocity: number;
  target: Vector;
  position: Vector;
  radius: number = 10;
  _state: "idle" | "goCoordinates" | "go" = "idle";

  constructor(config: Config, position: Vector) {
    this.config = config;
    this.position = position;
    this.target = this.position;
    this.velocity = config.velocity;
  }

  onClick = (target: Vector): void => {
    if (this._state === "goCoordinates") {
      this.target = target;
      this._state = "go";
      SvgPane.draggingEnabled = true;
    }
  };

  step = (timeDelta: number): void => {
    this.handleMovement(timeDelta);
  };

  activeCommand = (): ?string => (this._state === "go" ? "go" : null);

  buttons = (scene: Scene): Array<React.Element<"button">> => {
    if (this._state !== "idle") {
      return [];
    }
    const result = [];
    result.push(
      <button
        key="go"
        id="goButton"
        onClick={() => {
          SvgPane.draggingEnabled = false;
          this._state = "goCoordinates";
        }}
      >
        go
      </button>,
    );
    if (
      collides(this, scene.objects.lab) &&
      scene.objects.lab.status.tag === "idle" &&
      !scene.canMine
    ) {
      result.push(
        <button
          key="research"
          id="researchButton"
          onClick={() => {
            scene.objects.lab.startResearch();
          }}
        >
          research mining
        </button>,
      );
    }
    if (scene.canMine) {
      for (let i = 0; i < scene.objects.resources.length; i++) {
        if (collides(this, scene.objects.resources[i])) {
          result.push(
            <button
              key={`mine-${i}`}
              id="mineButton"
              onClick={() => {
                this.depleteResource(scene, i);
              }}
            >
              mine
            </button>,
          );
        }
      }
    }
    if (scene.inventory >= this.config.prices.factory) {
      result.push(
        <button
          key="build"
          id="buildButton"
          onClick={() => {
            scene.objects.factories.push(new Factory(this.position));
            scene.inventory -= this.config.prices.factory;
          }}
        >
          build
        </button>,
      );
    }
    return result;
  };

  handleMovement = (timeDelta: number): void => {
    if (this._state === "go") {
      const distanceLeft = distance(this.target, this.position);
      const stepDistance = this.velocity * timeDelta;
      if (stepDistance < distanceLeft) {
        this.position = add(
          this.position,
          scale(unit(difference(this.position, this.target)), stepDistance),
        );
      } else {
        this.position = this.target;
        this._state = "idle";
      }
    }
  };

  depleteResource = (scene: Scene, i: number): void => {
    scene.objects.resources.splice(i, 1);
    scene.inventory++;
  };

  draw = (): React.Element<typeof MinionRender> => {
    return (
      <MinionRender
        key="minion"
        position={this.position}
        radius={this.radius}
      />
    );
  };
}

export type RenderProps = {| position: Vector, radius: number |};

export const MinionRender = (props: RenderProps) => (
  <circle
    cx={props.position.x}
    cy={props.position.y}
    r={props.radius}
    style={{ fill: lightBlue, fillOpacity: 0.9 }}
  />
);

const lightBlue = "#8888ff";
