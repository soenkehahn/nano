// @flow

import * as vector from "../vector";
import { type Config, Scene } from "./index";
import { Factory } from "../factory";
import { Lab } from "../lab";
import { Minion } from "../minion";
import { Resource } from "../resource";
import { type Vector, collides, vectorLength } from "../vector";
import { iife } from "../utils";

export type Objects = {
  minion: Minion,
  lab: Lab,
  resources: Array<Resource>,
  factories: Array<Factory>,
};

export function mkObjects(config: Config, scene: Scene): Objects {
  const scale = vectorLength(config.initialSize) * 20;

  const minion = new Minion(config, { x: 0, y: 0 });

  const lab = new Lab(
    config,
    scene,
    findRandom(
      scale,
      v =>
        inBiggerVicinity(3, config.initialSize, v) &&
        !inside(vector.scale(config.initialSize, 1.6), v),
    ),
  );

  const resources = iife(() => {
    const resources = [];
    const closeResource = new Resource(
      findRandom(scale, v => inside(config.initialSize, v)),
    );
    resources.push(closeResource);
    for (let i = 0; i < 1000; i++) {
      const position = findRandom(
        scale,
        v =>
          inBiggerVicinity(30, config.initialSize, v) &&
          !collides(minion, new Resource(v)),
      );
      resources.push(new Resource(position));
    }
    return resources;
  });

  const factories = [];

  return {
    minion,
    lab,
    resources,
    factories,
  };
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

export const inside = (size: Vector, v: Vector): boolean => {
  return (
    v.x < size.x / 2 &&
    v.x > -size.x / 2 &&
    v.y < size.y / 2 &&
    v.y > -size.y / 2
  );
};

export const inBiggerVicinity = (
  scale: number,
  size: Vector,
  v: Vector,
): boolean => inside(vector.scale(size, scale), v);
