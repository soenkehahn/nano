// @flow

import * as React from "react";
import { type Objects, mkObjects } from "./objects";
import { SvgWithMouse } from "../svgWithMouse";
import { type Vector } from "../vector";

export type Config = {|
  initialSize: Vector,
  zoomVelocity: number,
  stepTimeDelta: number,
  velocity: number,
  prices: { factory: number },
  researchVelocity: number,
|};

type Props = {| time: number, timeDelta: number |};

type State = {| scene: Scene, timeDeltaRemainder: number |};

export const mkSceneRender = (config: Config, scene: Scene) => {
  class SceneRender extends React.Component<Props, State> {
    constructor() {
      super();
      this.state = {
        scene,
        timeDeltaRemainder: 0,
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
            width={config.initialSize.x}
            height={config.initialSize.y}
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
  canMine: boolean;
  inventory: number;
  objects: Objects;

  constructor(config: Config) {
    this.canMine = false;
    this.inventory = 0;
    this.objects = mkObjects(config, this);
  }

  step = (timeDelta: number): void => {
    this.objects.lab.step(timeDelta);
    this.objects.minion.step(timeDelta);
  };

  activeCommand = (): null | React.Element<*> => (
    <div id="activeCommand">
      active command: {this.objects.minion.activeCommand() || "none"}
    </div>
  );

  buttons = (): Array<React.Element<*>> => this.objects.minion.buttons(this);

  onClick = (target: Vector): void => {
    this.objects.minion.onClick(target);
  };

  interface = (): React.Element<*> => (
    <div>
      <div id="inventory">resource: {this.inventory}</div>
      {this.activeCommand()}
      commands: {this.buttons()}
      {this.canMine ? <div id="newResearch">new research: mining</div> : null}
    </div>
  );

  draw = (): React.Element<*> => {
    return (
      <g>
        {this.objects.resources.map(x => x.draw())}
        {this.objects.factories.map(x => x.draw())}
        {this.objects.lab.draw()}
        {this.objects.minion.draw()}
      </g>
    );
  };
}
