// @flow

import * as React from "react";
import { type Button, renderButtons } from "./button";
import { type Config, Scene } from "./scene";
import { Factory } from "./factory";
import { SvgPane } from "./svgPane";
import {
  type Vector,
  add,
  collides,
  difference,
  distance,
  equals,
  scale,
  unit,
} from "./vector";
import { fromInt } from "./rational";

type Status =
  | {| tag: "idle" |}
  | {| tag: "waitForMoveTarget" |}
  | {| tag: "moving", target: Vector |}
  | {| tag: "mining", resourceId: number, autoMiningSuccessor?: Status |};

export class Minion {
  config: Config;
  scene: Scene;
  static idCounter: number = 0;
  id: number;
  position: Vector;
  focused: boolean = false;
  radius: number = 10;
  status: Status = { tag: "idle" };
  collidingResources: Array<number> = [];

  constructor(config: Config, scene: Scene, position: Vector) {
    this.config = config;
    this.scene = scene;
    this.id = Minion.idCounter;
    Minion.idCounter++;
    this.position = position;
  }

  getRadius = () => this.radius;

  onClick: Vector => void = target => {
    if (this.status.tag === "waitForMoveTarget") {
      this.status = { tag: "moving", target };
      SvgPane.draggingEnabled = true;
    }
  };

  getStatus: () => ?string = () => {
    if (this.status.tag === "moving") return "status: moving...";
    else if (this.status.tag === "mining") return "status: mining...";
    else if (this.status.tag === "waitForMoveTarget")
      return "click on the map to set the target";
    else if (this.status.tag === "idle") return null;
    else {
      (this.status.tag: empty);
    }
  };

  step: ({ paused: boolean }) => void = ({ paused }) => {
    if (!paused && this.status.tag === "moving") {
      this.move(this.status.target);
    }
    this.updateCollidingResources();
    this.autoMine();
    if (!paused && this.status.tag === "mining") {
      this.mine(this.status.resourceId);
    }
  };

  move: Vector => void = target => {
    const distanceLeft = distance(target, this.position);
    const stepDistance = this.config.velocity
      .times(this.config.stepTimeDelta)
      .toNumber();
    if (stepDistance < distanceLeft) {
      this.position = add(
        this.position,
        scale(unit(difference(this.position, target)), stepDistance),
      );
    } else {
      this.position = target;
      this.status = { tag: "idle" };
    }
  };

  updateCollidingResources: () => void = () => {
    this.collidingResources = [];
    for (const [resourceId, resource] of this.scene.objects.resources) {
      if (collides(this, resource)) {
        this.collidingResources.push(resourceId);
      }
    }
  };

  autoMine: () => void = () => {
    if (
      (this.status.tag === "moving" || this.status.tag === "idle") &&
      this.scene.objects.lab.researched.has("auto-mining") &&
      this.collidingResources.length > 0
    ) {
      this.status = {
        tag: "mining",
        resourceId: this.collidingResources[0],
        autoMiningSuccessor: this.status,
      };
    }
  };

  mine: number => void = resourceId => {
    const resource = this.scene.objects.resources.get(resourceId);
    if (resource && collides(this, resource)) {
      this.scene.inventory = this.scene.inventory.plus(
        resource.mine(
          this.config.stepTimeDelta.times(this.config.miningVelocity),
        ),
      );
      if (resource.status.unitsLeft.equals(fromInt(0))) {
        this.scene.objects.resources.delete(resourceId);
        this.status = this.status.autoMiningSuccessor || { tag: "idle" };
      }
    } else {
      this.status = this.status.autoMiningSuccessor || { tag: "idle" };
    }
  };

  autoSeekResource: () => void = () => {
    let minDistance = Number.MAX_VALUE;
    let closestResource = null;
    for (const resource of this.scene.objects.resources.values()) {
      const dist = distance(this.position, resource.position);
      if (dist < minDistance) {
        minDistance = dist;
        closestResource = resource;
      }
    }
    if (closestResource) {
      if (!equals(this.position, closestResource.position)) {
        this.status = { tag: "moving", target: closestResource.position };
      }
    }
  };

  interface: () => ?React.Node = () => {
    if (this.status.tag !== "idle") {
      return null;
    }
    return (
      <>
        {renderButtons(this.buttons())}
        {this.scene.objects.lab.researched.has("auto-resource-seeking") ? (
          <label style={{ pointerEvents: "auto" }}>
            <button
              id="autoResourceSeekingButton"
              onClick={() => {
                this.autoSeekResource();
              }}
            >
              auto-seek
            </button>
            auto-resource-seeking
          </label>
        ) : null}
      </>
    );
  };

  buttons: () => Array<Button> = () => {
    const result: Array<Button> = [];

    result.push({
      id: "moveButton",
      text: "move",
      disabled: false,
      onClick: () => {
        SvgPane.draggingEnabled = false;
        this.status = { tag: "waitForMoveTarget" };
      },
    });

    if (
      this.scene.objects.lab.researched.has("mining") &&
      this.collidingResources.length > 0
    ) {
      const resourceId = this.collidingResources[0];
      result.push({
        id: `mineButton`,
        text: "mine",
        disabled: false,
        onClick: () => {
          this.status = { tag: "mining", resourceId };
        },
      });
    }

    if (
      this.scene.inventory.ge(this.config.costs.factory) &&
      !this.scene.collides({
        position: this.position,
        getRadius: () => Factory.radius,
      })
    ) {
      result.push({
        id: "buildButton",
        text: "build",
        disabled: false,
        onClick: () => {
          Factory.construct(this.config, this.scene, this.position);
        },
      });
    }

    return result;
  };

  draw: () => React.Node = () => {
    return (
      <MinionRender
        key={`minion-${this.id}`}
        position={this.position}
        focused={this.focused}
        radius={this.radius}
      />
    );
  };
}

export type RenderProps = {| position: Vector, radius: number |};

export const MinionRender = (props: {| ...RenderProps, focused: boolean |}) => (
  <>
    <circle
      cx={props.position.x}
      cy={props.position.y}
      r={props.radius}
      style={{ fill: lightBlue, fillOpacity: 0.8 }}
    />
    {props.focused && (
      <circle
        cx={props.position.x}
        cy={props.position.y}
        r={props.radius * 0.4}
        style={{ fill: "black" }}
      />
    )}
  </>
);

const lightBlue = "#8888ff";

export class Minions {
  focus: number;
  minions: Array<Minion>;

  constructor(minion: Minion) {
    this.focus = 0;
    this.minions = [minion];
    minion.focused = true;
  }

  focused: () => Minion = () => this.minions[this.focus];

  add: Minion => void = minion => {
    this.minions.push(minion);
    minion.focused = false;
  };

  toList: () => Array<Minion> = () => {
    return this.minions;
  };

  setFocus: number => void = index => {
    this.minions[this.focus].focused = false;
    this.focus = index;
    this.minions[this.focus].focused = true;
  };

  anyIsIdle: () => boolean = () => {
    let idle = false;
    for (const minion of this.minions) {
      if (
        minion.status.tag === "idle" ||
        minion.status.tag === "waitForMoveTarget"
      ) {
        idle = true;
      }
    }
    return idle;
  };

  step: (Scene, { paused: boolean }) => void = (scene, args) => {
    for (const minion of this.minions) {
      minion.step(args);
    }
  };

  onClick: Vector => void = clickedPoint => {
    if (this.focused().status.tag === "waitForMoveTarget") {
      this.focused().onClick(clickedPoint);
    } else {
      const clicked = this.minions.findIndex(minion =>
        collides(minion, { position: clickedPoint, getRadius: () => 0 }),
      );
      if (clicked >= 0) {
        this.setFocus(clicked);
      }
    }
  };

  idleButtons: SvgPane => Array<Button> = svgPane => {
    const result: Array<Button> = [];
    for (let i = 0; i < this.minions.length; i++) {
      const minion = this.minions[i];
      if (minion.status.tag === "idle") {
        result.push({
          text: `minion #${minion.id}`,
          onClick: () => {
            this.setFocus(i);
            svgPane.setCenter(minion.position);
          },
          id: `idleButton-${minion.id}`,
          disabled: false,
        });
      }
    }
    return result;
  };
}
