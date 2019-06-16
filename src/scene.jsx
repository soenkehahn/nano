// @flow

import { Minion } from "./minion";
import { SvgWithMouse } from "./svgWithMouse";
import React from "react";

export type Config = {| velocity: number |};

type SceneProps = {| time: number, timeDelta: number |};

type SceneState = {| minion: Minion |};

export const mkScene = (config: Config) => {
  class Scene extends React.Component<SceneProps, SceneState> {
    constructor() {
      super();
      this.state = {
        minion: new Minion(config)
      };
    }

    static getDerivedStateFromProps = (
      props: SceneProps,
      state: SceneState
    ) => {
      state.minion.step(props.timeDelta);
      return state;
    };

    render = () => {
      return (
        <SvgWithMouse
          height="500"
          width="500"
          onClick={this.state.minion.setTarget}
        >
          <rect width="100%" height="100%" fill="#eee" />
          {this.state.minion.draw()}
        </SvgWithMouse>
      );
    };
  }
  return Scene;
};
