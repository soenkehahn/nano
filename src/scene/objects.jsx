// @flow

import * as vector from "../vector";
import { type Config, Scene } from "./index";
import { Factory } from "../factory";
import { Lab } from "../lab";
import { Minion } from "../minion";
import { Resource } from "../resource";
import { type Vector, collides, scale, vectorLength } from "../vector";
import { type ViewBox } from "../svgPane";
import { iife } from "../utils";

export type Objects = {
  minion: Minion,
  lab: Lab,
  resources: Array<Resource>,
  factories: Array<Factory>,
};

export function mkObjects(
  config: Config,
  scene: Scene,
  numberOfResources: number = 1000,
): Objects {
  const scale = vectorLength(config.initialSize) * 20;

  const minion = new Minion(config, { x: 0, y: 0 });

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

  const resources = iife(() => {
    const resources = [];
    const closeResource = new Resource(
      findRandom(scale, v => inside(config.initialSize, v)),
    );
    resources.push(closeResource);
    for (let i = 0; i < numberOfResources; i++) {
      const position = findRandom(
        scale,
        v =>
          inBiggerVicinity(10, config.initialSize, v) &&
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
  { position, radius }: { position: Vector, radius: number },
): boolean => {
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
