// @flow

import { Minion } from "./minion";
import { type Position } from "./vector";
import { SvgWithMouse } from "./svgWithMouse";
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
          onClick={this.state.scene.onClick}
        >
          <rect width="100%" height="100%" fill="#eee" />
          {this.state.scene.draw()}
        </SvgWithMouse>
      );
    };
  }
  return SceneRender;
};

interface Steppable {
  step(timeDelta: number): void;

  onClick(target: Position): void;

  draw(): React$Node;
}

export function mkScene(config: Config): Steppable {
  return new Minion(config);
}
