// @flow

import * as React from "react";
import { type Objects, insideViewBox } from "./objects";
import { SvgPane, type ViewBox } from "../svgPane";
import { type Vector } from "../vector";

export type Config = {|
  initialSize: Vector,
  zoomVelocity: number,
  stepTimeDelta: number,
  velocity: number,
  prices: { factory: number },
  researchVelocity: number,
  miningVelocity: number,
|};

type Props = {| time: number, timeDelta: number |};

type State = {| scene: Scene, timeDeltaRemainder: number |};

export type SceneRenderType = React.ComponentType<Props>;

export const mkSceneRender = (
  config: Config,
  scene: Scene,
): SceneRenderType => {
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
          <SvgPane
            width={config.initialSize.x}
            height={config.initialSize.y}
            onClick={this.state.scene.onClick}
            zoomVelocity={config.zoomVelocity}
            scene={this.state.scene}
          />
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

  constructor(
    config: Config,
    objects: (config: Config, scene: Scene) => Objects,
  ) {
    this.canMine = false;
    this.inventory = 0;
    this.objects = objects(config, this);
  }

  step = (timeDelta: number): void => {
    this.objects.lab.step(timeDelta);
    this.objects.minion.step(this, timeDelta);
  };

  activeCommand = (): null | React.Element<"div"> => (
    <div id="activeCommand">
      active command: {this.objects.minion.activeCommand() || "none"}
    </div>
  );

  buttons = (): Array<React.Element<"button">> =>
    this.objects.minion.buttons(this);

  onClick = (target: Vector): void => {
    this.objects.minion.onClick(target);
  };

  interface = (): React.Element<"div"> => (
    <div>
      <div id="inventory">resource: {this.inventory}</div>
      {this.activeCommand()}
      commands: {this.buttons()}
      {this.canMine ? <div id="newResearch">new research: mining</div> : null}
    </div>
  );

  draw = (viewBox: ViewBox): React.Element<"g"> => {
    let objects: Array<{
      position: Vector,
      radius: number,
      draw: () => React.Node,
    }> = [];
    objects = objects.concat(this.objects.factories);
    objects = objects.concat(this.objects.resources);
    objects.push(this.objects.lab);
    objects.push(this.objects.minion);
    objects = objects.filter(object => insideViewBox(viewBox, object));
    return <g>{objects.map(x => x.draw())}</g>;
  };
}
