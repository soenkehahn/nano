// @flow

import * as vector from "../data/vector";
import { type Config, Scene } from "./index";
import { Factory } from "./factory";
import { Lab } from "./lab";
import { Minion, Minions } from "./minion";
import { Resource } from "./resource";
import { type Vector, collides, scale, vectorLength } from "../data/vector";
import { type ViewBox } from "../web/svgPane";
import { every } from "lodash";

export type Objects = {
  minions: Minions,
  lab: Lab,
  resources: Map<number, Resource>,
  resourceCounter: number,
  factories: Array<Factory>,
};

export function mkObjects(
  config: Config,
  scene: Scene,
  numberOfResources: number = 200,
): Objects {
  const scale = vectorLength(config.initialSize) * 20;

  const minions = new Minions(new Minion(config, scene, { x: 0, y: 0 }));

  const lab = new Lab(
    config,
    scene,
    findRandom(
      scale,
      v =>
        inBiggerVicinity(1.6, config.initialSize, v) &&
        !inside(vector.scale(config.initialSize, 1.3), v),
    ),
  );

  const objects = {
    minions,
    lab,
    resources: new Map(),
    resourceCounter: 0,
    factories: [],
  };

  const closeResource = new Resource(
    findRandom(scale, v => inside(config.initialSize, v)),
  );
  addResource(objects, closeResource);
  for (let i = 0; i < numberOfResources; i++) {
    const position = findRandom(
      scale,
      v =>
        vectorLength(v) < config.initialSize.x * 2.6 &&
        every(minions.toList(), minion => !collides(minion, new Resource(v))),
    );
    addResource(objects, new Resource(position));
  }

  return objects;
}

export function addResource(objects: Objects, resource: Resource): void {
  objects.resources.set(objects.resourceCounter++, resource);
}

export function findRandom(
  scale: number,
  predicate: Vector => boolean,
): Vector {
  let result;
  do {
    result = vector.random(-scale, scale);
  } while (!predicate(result));
  return result;
}

export const inside: (Vector, Vector) => boolean = (size, v) => {
  const offset = scale(size, -0.5);
  return (
    v.x - offset.x >= 0 &&
    v.x - offset.x <= size.x &&
    v.y - offset.y >= 0 &&
    v.y - offset.y <= size.y
  );
};

export const insideViewBox = (
  viewBox: ViewBox,
  { position, getRadius }: { position: Vector, getRadius: () => number },
): boolean => {
  const radius = getRadius();
  return (
    position.x - viewBox.offset.x + radius >= 0 &&
    position.x - viewBox.offset.x - radius <= viewBox.size.x &&
    position.y - viewBox.offset.y + radius >= 0 &&
    position.y - viewBox.offset.y - radius <= viewBox.size.y
  );
};

export const inBiggerVicinity = (
  scale: number,
  size: Vector,
  v: Vector,
): boolean => inside(vector.scale(size, scale), v);
