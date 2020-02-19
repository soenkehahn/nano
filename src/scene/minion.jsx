// @flow

import * as React from "react";
import { type Config, Scene } from ".";
import { Factory } from "./factory";
import { Resource } from "./resource";
import { Spore } from "./spore";
import { SvgPane } from "../web/svgPane";
import {
  type Vector,
  add,
  collides,
  difference,
  distance,
  equals,
  scale,
  unit,
} from "../data/vector";
import { addResource, findClosest, findRandom } from "./objects";
import { button } from "../web/lists";
import { fromInt } from "../data/rational";
import { sepBy, when } from "../utils";
import { vectorLength } from "../data/vector";

type Status =
  | {| tag: "idle" |}
  | {| tag: "waitForMoveTarget" |}
  | {| tag: "moving", target: Vector, nextState?: Status |}
  | {| tag: "mining", resource: Resource, autoMiningSuccessor?: Status |}
  | {| tag: "breeding", spore: Spore |};

type Collisions = {
  resources: Array<Resource>,
  spores: Array<Spore>,
};

export class Minion {
  static radius: number = 10;
  config: Config;
  scene: Scene;
  static idCounter: number = 0;
  id: number;
  position: Vector;
  focused: boolean = false;
  status: Status = { tag: "idle" };
  autoSeekingChecked: boolean = false;
  autoSeedingChecked: boolean = false;
  autoBreedingChecked: boolean = false;

  collisions: () => Collisions = () => ({
    resources: [],
    spores: [],
  });

  constructor(config: Config, scene: Scene, position: Vector) {
    this.config = config;
    this.scene = scene;
    this.id = Minion.idCounter;
    Minion.idCounter++;
    this.position = position;
  }

  getRadius = () => Minion.radius;

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
    else if (this.status.tag === "idle") return "status: idle";
    else if (this.status.tag === "breeding") return "status: breeding";
    else {
      (this.status.tag: empty);
    }
  };

  step: ({ paused: boolean }) => void = ({ paused }) => {
    this.updateCollisions();
    if (!paused) {
      if (this.status.tag === "moving") {
        this.move(this.status.target, this.status.nextState);
      } else if (this.status.tag === "mining") {
        this.mine(this.status.resource);
      } else if (this.status.tag === "breeding") {
        this.breed(this.status.spore);
      } else if (this.status.tag === "idle") {
        null;
      } else if (this.status.tag === "waitForMoveTarget") {
        null;
      } else {
        (this.status.tag: empty);
      }
    }
    this.autoMine();
    this.autoSeek();
    this.autoSeed();
    this.autoBreed();
  };

  updateCollisions: () => void = () => {
    let collisions: null | Collisions = null;
    this.collisions = () => {
      if (collisions === null) {
        collisions = {
          resources: [],
          spores: [],
        };
        for (const resource of this.scene.objects.resources) {
          if (collides(this, resource)) {
            collisions.resources.push(resource);
          }
        }
        for (const spore of this.scene.objects.spores) {
          if (collides(this, spore)) {
            collisions.spores.push(spore);
          }
        }
      }
      return collisions;
    };
  };

  move: (Vector, ?Status) => void = (target, nextStatus) => {
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
      this.status = nextStatus || { tag: "idle" };
    }
  };

  mine: Resource => void = resource => {
    if (resource && collides(this, resource)) {
      this.scene.inventory = this.scene.inventory.plus(
        resource.mine(
          this.config.stepTimeDelta.times(this.config.miningVelocity),
        ),
      );
      if (resource.status.unitsLeft.equals(fromInt(0))) {
        this.scene.objects.resources.delete(resource.id);
        Spore.addSpore(this.scene, resource);
        this.status = this.status.autoMiningSuccessor || { tag: "idle" };
      }
    } else {
      this.status = this.status.autoMiningSuccessor || { tag: "idle" };
    }
  };

  autoMine: () => void = () => {
    if (
      (this.status.tag === "moving" || this.status.tag === "idle") &&
      this.scene.objects.lab.researched.has("auto-mining") &&
      this.collisions().resources.length > 0
    ) {
      this.status = {
        tag: "mining",
        resource: this.collisions().resources[0],
        autoMiningSuccessor: this.status,
      };
    }
  };

  seek: () => void = () => {
    const closestResource = findClosest(this, this.scene.objects.resources);
    if (closestResource) {
      if (!equals(this.position, closestResource.position)) {
        this.status = { tag: "moving", target: closestResource.position };
      }
    }
  };

  autoSeek: () => void = () => {
    if (
      this.status.tag == "idle" &&
      this.autoSeekingChecked &&
      this.collisions().resources.length == 0
    ) {
      this.seek();
    }
  };

  seed: () => void = () => {
    if (this.scene.inventory.ge(this.config.costs.seeding)) {
      this.addResources(this.position);
      this.scene.inventory = this.scene.inventory.minus(
        this.config.costs.seeding,
      );
    }
  };

  addResources: Vector => void = center => {
    for (let i = 0; i < this.config.seeding.resources; i++) {
      const position = add(
        center,
        findRandom(Spore.radius * 1.5, v => vectorLength(v) < Spore.radius),
      );
      addResource(this.scene.objects, new Resource(position));
    }
  };

  autoSeed: () => void = () => {
    if (this.autoSeedingChecked) {
      this.seed();
    }
  };

  startBreeding: () => void = () => {
    const closestSpore = findClosest(this, this.scene.objects.spores);
    if (closestSpore) {
      const breedingState = { tag: "breeding", spore: closestSpore };
      if (!equals(this.position, closestSpore.position)) {
        this.status = {
          tag: "moving",
          target: closestSpore.position,
          nextState: breedingState,
        };
      } else {
        this.status = breedingState;
      }
    }
  };

  breed: Spore => void = spore => {
    spore.completion = spore.completion.plus(
      this.config.stepTimeDelta.times(this.config.breedingVelocity),
    );
    if (spore.completion.ge(fromInt(1))) {
      this.scene.objects.spores.delete(spore.id);
      this.addResources(spore.position);
      this.status = { tag: "idle" };
    }
  };

  autoBreed: () => void = () => {
    if (
      this.autoBreedingChecked &&
      this.status.tag === "idle" &&
      this.scene.objects.spores.size() > 0
    ) {
      this.startBreeding();
    }
  };

  draw: () => React.Node = () => {
    return (
      <MinionRender
        key={`minion-${this.id}`}
        position={this.position}
        focused={this.focused}
        radius={Minion.radius}
      />
    );
  };

  drawUI: (SvgPane, Minions, number) => React.Node = (svgPane, parent, i) => {
    const id = `minion-ui-${this.id}`;
    return (
      <div id={id} key={i}>
        {this.getStatus()}
        {when(this.status.tag === "idle", () => (
          <>
            <br />
            <button
              id={`focusButton-${this.id}`}
              onClick={() => {
                parent.setFocus(i);
                svgPane.setCenter(this.position);
              }}
            >
              focus
            </button>
            <br />
            <button
              id={`moveButton-${this.id}`}
              onClick={() => {
                SvgPane.draggingEnabled = false;
                this.status = { tag: "waitForMoveTarget" };
              }}
            >
              move
            </button>
            {when(this.collisions().resources.length > 0, () => {
              const resource = this.collisions().resources[0];
              return (
                <>
                  <br />
                  <button
                    id={`mineButton-${this.id}`}
                    onClick={() => {
                      this.status = { tag: "mining", resource };
                    }}
                  >
                    mine
                  </button>
                </>
              );
            })}
            {when(
              this.scene.inventory.ge(this.config.costs.factory) &&
                !this.scene.collides({
                  position: this.position,

                  getRadius: () => Factory.radius,
                }),
              () => {
                return (
                  <>
                    <br />
                    <button
                      id={`buildMinionButton-${this.id}`}
                      onClick={() => {
                        Factory.construct(
                          this.config,
                          this.scene,
                          this.position,
                        );
                      }}
                    >
                      build minion
                    </button>
                  </>
                );
              },
            )}
            {when(
              this.scene.objects.lab.researched.has("auto-resource-seeking"),
              () => (
                <>
                  <br />
                  <button
                    id={`autoResourceSeekingButton-${this.id}`}
                    onClick={this.seek}
                  >
                    <input
                      id={`autoResourceSeekingCheckbox-${this.id}`}
                      type="checkbox"
                      checked={this.autoSeekingChecked}
                      onChange={event => {
                        event.stopPropagation();
                        this.autoSeekingChecked = event.target.checked;
                      }}
                    />
                    auto-seek
                  </button>
                </>
              ),
            )}
            <br />
            <>
              <input
                id={`autoSeedingCheckbox-${this.id}`}
                type="checkbox"
                checked={this.autoSeedingChecked}
                onChange={event => {
                  event.stopPropagation();
                  this.autoSeedingChecked = event.target.checked;
                }}
              />
              <button
                id={`seedButton-${this.id}`}
                disabled={!this.scene.inventory.ge(this.config.costs.seeding)}
                onClick={this.seed}
              >
                seed
              </button>
            </>
            <>
              <br />
              <button
                id={`breedButton-${this.id}`}
                onClick={() => {
                  this.startBreeding();
                }}
              >
                <input
                  id={`autoBreedingCheckbox-${this.id}`}
                  type="checkbox"
                  checked={this.autoBreedingChecked}
                  onChange={event => {
                    event.stopPropagation();
                    this.autoBreedingChecked = event.target.checked;
                  }}
                />
                breed
              </button>
            </>
          </>
        ))}
      </div>
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

  getWaitingForMoveTarget: void => null | Minion = () => {
    let result = null;
    for (const minion of this.minions) {
      if (minion.status.tag == "waitForMoveTarget") {
        result = minion;
      }
    }
    return result;
  };

  onClick: Vector => void = clickedPoint => {
    const waitingForMoveTarget = this.getWaitingForMoveTarget();
    if (waitingForMoveTarget) {
      waitingForMoveTarget.onClick(clickedPoint);
    } else {
      const clicked = this.minions.findIndex(minion =>
        collides(minion, { position: clickedPoint, getRadius: () => 0 }),
      );
      if (clicked >= 0) {
        this.setFocus(clicked);
      }
    }
  };

  drawUI: SvgPane => React.Node = svgPane =>
    sepBy(
      <hr />,
      this.minions.map((minion, i) => minion.drawUI(svgPane, this, i)),
    );
}
