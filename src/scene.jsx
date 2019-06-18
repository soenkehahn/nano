// @flow

import * as vector from "./vector";
import { Factory } from "./factory";
import { Lab } from "./lab";
import { Minion } from "./minion";
import { Resource } from "./resource";
import { SvgWithMouse } from "./svgWithMouse";
import { type Vector, collides } from "./vector";
import React from "react";

export type Config = {|
  sceneSize: number,
  zoomVelocity: number,
  stepTimeDelta: number,
  velocity: number,
  prices: { factory: number },
  researchVelocity: number
|};

type Props = {| time: number, timeDelta: number |};

type State = {| scene: Scene, timeDeltaRemainder: number |};

export const mkSceneRender = (config: Config, scene: Scene) => {
  class SceneRender extends React.Component<Props, State> {
    constructor() {
      super();
      this.state = {
        scene,
        timeDeltaRemainder: 0
      };
    }

    static getDerivedStateFromProps = (props: Props, state: State) => {
      const timeDelta = props.timeDelta + state.timeDeltaRemainder;
      const n = Math.floor(timeDelta / config.stepTimeDelta);
      for (let i = 0; i < n; i++) {
        state.scene.step(config.stepTimeDelta);
      }
      state.timeDeltaRemainder = timeDelta % config.stepTimeDelta;
      return state;
    };

    render = () => {
      return (
        <div>
          <SvgWithMouse
            width={config.sceneSize}
            height={config.sceneSize}
            onClick={this.state.scene.onClick}
            zoomVelocity={config.zoomVelocity}
          >
            {this.state.scene.draw()}
          </SvgWithMouse>
          {this.state.scene.interface()}
        </div>
      );
    };
  }
  return SceneRender;
};

export class Scene {
  minion: Minion;
  lab: Lab;
  canMine: boolean;
  resources: Array<Resource>;
  factories: Array<Factory>;
  inventory: number;

  constructor(config: Config) {
    this.minion = new Minion(config);
    this.lab = new Lab(config, this, { x: 50, y: 0 });
    this.canMine = false;
    this.resources = [];
    for (let i = 0; i < 10; i++) {
      const resource = new Resource(i);
      do {
        resource.position = vector.random(
          -config.sceneSize / 2,
          config.sceneSize / 2
        );
      } while (collides(this.minion, resource));
      this.resources.push(resource);
    }
    this.factories = [];
    this.inventory = 0;
  }

  step = (timeDelta: number): void => {
    this.lab.step(timeDelta);
    this.minion.step(timeDelta);
  };

  activeCommand = (): null | React$Element<*> => (
    <div id="activeCommand">
      active command: {this.minion.activeCommand() || "none"}
    </div>
  );

  buttons = (): Array<React$Element<*>> => this.minion.buttons(this);

  onClick = (target: Vector): void => {
    this.minion.onClick(target);
  };

  interface = (): React$Element<*> => (
    <div>
      <div id="inventory">resource: {this.inventory}</div>
      {this.activeCommand()}
      commands: {this.buttons()}
      {this.canMine ? <div id="newResearch">new research: mining</div> : null}
    </div>
  );

  draw = (): React$Element<*> => {
    return (
      <g>
        {this.resources.map(x => x.draw())}
        {this.factories.map(x => x.draw())}
        {this.lab.draw()}
        {this.minion.draw()}
      </g>
    );
  };
}
