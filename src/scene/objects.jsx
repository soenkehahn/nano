// @flow

import * as vector from "../data/vector";
import { type Config, Scene } from "./index";
import { Factory } from "./factory";
import { IdMap } from "../data/IdMap";
import { Lab } from "./lab";
import { Minion, Minions } from "./minion";
import { Resource } from "./resource";
import { Spore } from "./spore";
import {
  type Vector,
  collides,
  distance,
  scale,
  vectorLength,
} from "../data/vector";
import { type ViewBox } from "../web/svgPane";
import { every } from "lodash";

export type Objects = {|
  minions: Minions,
  lab: Lab,
  resources: IdMap<Resource>,
  spores: IdMap<Spore>,
  factories: Array<Factory>,
|};

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

  const objects: Objects = {
    minions,
    lab,
    resources: new IdMap(),
    spores: new IdMap(),
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
        every(minions.toArray(), minion => !collides(minion, new Resource(v))),
    );
    addResource(objects, new Resource(position));
  }

  return objects;
}

export function addResource(objects: Objects, resource: Resource): void {
  objects.resources.add(resource);
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

export function findClosest<Obj: { position: Vector }>(
  object: { position: Vector },
  candidates: IdMap<Obj>,
): ?Obj {
  let minDistance = Number.MAX_VALUE;
  let closest = null;
  for (const candidate of candidates) {
    const dist = distance(object.position, candidate.position);
    if (dist < minDistance) {
      minDistance = dist;
      closest = candidate;
    }
  }
  return closest;
}
