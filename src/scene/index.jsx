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
        <div style={{ display: "flex" }}>
          <SvgPane
            width={config.initialSize.x}
            height={config.initialSize.y}
            onClick={this.state.scene.onClick}
            zoomVelocity={config.zoomVelocity}
            scene={this.state.scene}
          />
          <div style={{ flexGrow: 1 }}>{this.state.scene.interface()}</div>
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

  onClick = (target: Vector): void => {
    this.objects.minion.onClick(target);
  };

  interface = (): React.Element<"div"> => {
    const buttons = this.objects.minion.buttons(this);
    return (
      <div style={{ paddingLeft: "1em" }}>
        <div style={{ height: "10em" }}>
          {this.activeCommand()}
          {buttons.length === 0 ? null : (
            <>
              available commands:{" "}
              <ul>
                {buttons.map(button => {
                  return (
                    <li key={button.id}>
                      <button id={button.id} onClick={button.onClick}>
                        {button.text}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
        <div id="inventory" style={{ height: "10em" }}>
          resources: {this.inventory}
        </div>
        {this.canMine ? (
          <div id="newResearch" style={{ height: "10em" }}>
            new research: mining
          </div>
        ) : null}
      </div>
    );
  };

  activeCommand = (): null | React.Element<"div"> => {
    const status = this.objects.minion.status();
    if (status === null) return null;
    else return <div id="status">{status}</div>;
  };

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
