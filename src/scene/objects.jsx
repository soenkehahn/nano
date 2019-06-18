// @flow

import * as vector from "../vector";
import { type Config, Scene } from "./index";
import { Factory } from "../factory";
import { Lab } from "../lab";
import { Minion } from "../minion";
import { Resource } from "../resource";
import { collides } from "../vector";

export type Objects = {
  minion: Minion,
  lab: Lab,
  resources: Array<Resource>,
  factories: Array<Factory>,
};

export function mkObjects(config: Config, scene: Scene): Objects {
  const result = {
    minion: new Minion(config),
    lab: new Lab(config, scene, { x: 50, y: 0 }),
    resources: [],
    factories: [],
  };
  for (let i = 0; i < 10; i++) {
    const resource = new Resource();
    do {
      const size = Math.min(config.sceneSize.x, config.sceneSize.y);
      resource.position = vector.random(-size / 2, size / 2);
    } while (collides(result.minion, resource));
    result.resources.push(resource);
  }
  return result;
}
