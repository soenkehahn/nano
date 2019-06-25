// @flow

import * as React from "react";
import { type Button, type RenderProps } from "./minion";
import { type Config, Scene } from "./scene";
import { type Rational, fromInt } from "./rational";
import { TAU, type Vector, add, collides, fromAngle, scale } from "./vector";

type Goal = "mining" | "auto-mining";

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

  step: Rational => void = timeDelta => {
    if (this.status.tag === "researching") {
      const { tag, goal, completion } = this.status;
      let newCompletion = completion.plus(
        timeDelta.times(this.config.researchVelocity),
      );
      if (newCompletion.gt(fromInt(1))) {
        newCompletion = fromInt(1);
      }
      this.scene.inventory = this.scene.inventory.minus(
        newCompletion.minus(completion).times(this.config.costs.research[goal]),
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
  };

  buttons: () => Array<Button> = () => {
    const result: Array<Button> = [];
    if (
      collides(this, this.scene.objects.minion) &&
      this.scene.objects.minion.status.tag === "idle" &&
      this.status.tag === "idle"
    ) {
      if (!this.researched.has("mining")) {
        result.push({
          id: "researchMiningButton",
          text: "research mining",
          disabled: false,
          onClick: () => {
            this.startResearch("mining");
          },
        });
      }
      if (
        this.researched.has("mining") &&
        !this.researched.has("auto-mining")
      ) {
        result.push({
          id: "researchAutoMiningButton",
          text: `research auto-mining (cost: ${this.config.costs.research[
            "auto-mining"
          ].toNumber() / 100})`,
          disabled: this.scene.inventory.lt(
            this.config.costs.research["auto-mining"],
          ),
          onClick: () => {
            this.startResearch("auto-mining");
          },
        });
      }
    }
    return result;
  };

  newResearch: () => React.Node = () => (
    <div style={{ height: "10em" }}>
      Research:
      {Array.from(this.researched).map(goal => {
        const id = `newResearch-${goal}`;
        return (
          <div key={id} id={id}>
            {goal}
          </div>
        );
      })}
    </div>
  );

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
