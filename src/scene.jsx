// @flow

import * as vector from "./vector";
import { Minion } from "./minion";
import { Resource } from "./resource";
import { SvgWithMouse } from "./svgWithMouse";
import { type Vector, collides } from "./vector";
import React from "react";

export type Config = {|
  dimensions: { lower: number, upper: number },
  stepTimeDelta: number,
  velocity: number
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
      const width = `${config.dimensions.upper - config.dimensions.lower}`;
      const height = width;
      const viewBox = `${config.dimensions.lower} ${
        config.dimensions.lower
      } ${width} ${height}`;
      return (
        <div>
          <SvgWithMouse
            width={width}
            height={height}
            viewBox={viewBox}
            onClick={this.state.scene.onClick}
          >
            <rect x={-250} y={-250} width="100%" height="100%" fill="#eee" />
            {this.state.scene.draw()}
          </SvgWithMouse>
          <div id="inventory">resource: {this.state.scene.inventory}</div>
          {this.state.scene.activeCommand()}
          commands: {this.state.scene.goButton()}
        </div>
      );
    };
  }
  return SceneRender;
};

export class Scene {
  minion: Minion;
  resources: Array<Resource>;
  inventory: number = 0;

  constructor(config: Config) {
    this.minion = new Minion(config);
    this.resources = [];
    for (let i = 0; i < 10; i++) {
      const resource = new Resource(i);
      while (collides(this.minion, resource)) {
        resource.position = vector.random(
          config.dimensions.lower,
          config.dimensions.upper
        );
      }
      this.resources.push(resource);
    }
  }

  step = (timeDelta: number): void => {
    this.minion.step(timeDelta, this);
  };

  activeCommand = (): null | React$Element<*> => (
    <div id="activeCommand">
      active command: {this.minion.activeCommand() || "none"}
    </div>
  );

  goButton = (): null | React$Element<*> => this.minion.goButton();

  onClick = (target: Vector): void => {
    this.minion.onClick(target);
  };

  draw = (): React$Element<*> => {
    return (
      <g>
        {this.resources.map(x => x.draw())}
        {this.minion.draw()}
      </g>
    );
  };
}
