// @flow

import { Minion } from "./minion";
import { Resource } from "./resource";
import { SvgWithMouse } from "./svgWithMouse";
import { type Vector } from "./vector";
import React from "react";

export type Config = {| stepTimeDelta: number, velocity: number |};

type Props = {| time: number, timeDelta: number |};

type State = {| scene: Steppable, timeDeltaRemainder: number |};

export const mkSceneRender = (config: Config, scene: Steppable) => {
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
        <SvgWithMouse
          height="500"
          width="500"
          viewBox="-250 -250 500 500"
          onClick={this.state.scene.onClick}
        >
          <rect x={-250} y={-250} width="100%" height="100%" fill="#eee" />
          {this.state.scene.draw()}
        </SvgWithMouse>
      );
    };
  }
  return SceneRender;
};

export interface Steppable {
  step(timeDelta: number): void;

  onClick(target: Vector): void;

  draw(): React$Element<*>;
}

export class Scene implements Steppable {
  minion: Minion;
  resource: Resource;

  constructor(config: Config) {
    this.minion = new Minion(config);
    this.resource = new Resource();
  }

  step = (timeDelta: number): void => {
    this.minion.step(timeDelta);
  };

  onClick = (target: Vector): void => {
    this.minion.onClick(target);
  };

  draw = (): React$Element<*> => {
    return (
      <g>
        {this.resource.draw()}
        {this.minion.draw()}
      </g>
    );
  };
}
