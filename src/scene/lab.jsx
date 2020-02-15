// @flow

import * as React from "react";
import { type Config, Scene } from ".";
import { type Item, button, renderList } from "../lists";
import { type Rational, fromInt } from "../data/rational";
import { type RenderProps } from "./minion";
import { TAU, type Vector, add, collides, fromAngle, scale } from "../vector";

type Goal = "auto-mining" | "auto-resource-seeking";

export class Lab {
  config: Config;
  scene: Scene;
  position: Vector;
  radius: number = 14;
  status:
    | {| tag: "idle" |}
    | {| tag: "researching", goal: Goal, completion: Rational |} = {
    tag: "idle",
  };
  researched: Set<Goal> = new Set();

  constructor(config: Config, scene: Scene, position: Vector) {
    this.config = config;
    this.scene = scene;
    this.position = position;
  }

  getRadius = () => this.radius;

  startResearch: Goal => void = goal => {
    this.status = { tag: "researching", goal, completion: fromInt(0) };
  };

  step: ({ paused: boolean }) => void = ({ paused }) => {
    if (!paused) {
      if (this.status.tag === "researching") {
        const { tag, goal, completion } = this.status;
        let newCompletion = completion.plus(
          this.config.stepTimeDelta.times(this.config.researchVelocity),
        );
        if (newCompletion.gt(fromInt(1))) {
          newCompletion = fromInt(1);
        }
        this.scene.inventory = this.scene.inventory.minus(
          newCompletion
            .minus(completion)
            .times(this.config.costs.research[goal]),
        );
        if (newCompletion.ge(fromInt(1))) {
          this.researched.add(goal);
          this.status = { tag: "idle" };
        } else {
          this.status = { tag, goal, completion: newCompletion };
        }
      } else if (this.status.tag === "idle") {
        return;
      } else {
        (this.status.tag: empty);
      }
    }
  };

  buttons: () => ?React.Node = () => {
    const result: Array<Item> = [];
    if (
      collides(this, this.scene.focusedMinion()) &&
      this.scene.focusedMinion().status.tag === "idle" &&
      this.status.tag === "idle"
    ) {
      if (!this.researched.has("auto-mining")) {
        result.push(
          button({
            id: "researchAutoMiningButton",
            text: `research auto-mining (cost: ${this.config.costs.research[
              "auto-mining"
            ].toNumber()})`,
            disabled: this.scene.inventory.lt(
              this.config.costs.research["auto-mining"],
            ),
            onClick: () => {
              this.startResearch("auto-mining");
            },
          }),
        );
      }
      if (!this.researched.has("auto-resource-seeking")) {
        result.push(
          button({
            id: "researchAutoResourceSeekingButton",
            text: `research auto-resource-seeking (cost: ${this.config.costs.research[
              "auto-resource-seeking"
            ].toNumber()})`,
            disabled: this.scene.inventory.lt(
              this.config.costs.research["auto-resource-seeking"],
            ),
            onClick: () => {
              this.startResearch("auto-resource-seeking");
            },
          }),
        );
      }
    }
    if (result.length == 0) {
      return null;
    } else {
      return renderList(result);
    }
  };

  researchedUI: () => React.Node = () => {
    const array = Array.from(this.researched);
    if (array.length == 0) {
      return null;
    } else {
      return (
        <div style={{ height: "10em" }}>
          researched:
          {array.map(goal => {
            const id = `researched-${goal}`;
            return (
              <div key={id} id={id}>
                {goal}
              </div>
            );
          })}
        </div>
      );
    }
  };

  draw: () => React.Node = () => (
    <LabRender
      key="lab"
      position={this.position}
      radius={this.radius}
      completion={
        this.status.tag === "researching"
          ? this.status.completion.toNumber()
          : null
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
      r={props.radius - 1}
      style={{ stroke: "yellow", strokeWidth: "2", fillOpacity: "0" }}
    />
    <circle
      cx={props.position.x}
      cy={props.position.y}
      r={props.radius * 0.4}
      style={{ fill: "yellow" }}
    />
    {drawCompletion(props)}
  </g>
);

function drawCompletion({
  position: { x, y },
  radius,
  completion,
}: {|
  ...RenderProps,
  ...{| completion: ?number |},
|}): React.Element<"path"> {
  completion = completion || 0;
  const endpoint = add({ x, y }, scale(fromAngle(-TAU * completion), radius));
  return (
    <path
      d={`
        M ${x} ${y}
        l 0 ${-radius}
        A ${radius} ${radius} 0
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
