// @flow

import * as React from "react";
import { Minion } from "../minion";
import { type Objects, insideViewBox } from "./objects";
import { type Rational, fromInt } from "../rational";
import { SvgPane, type ViewBox } from "../svgPane";
import { type Vector, collides } from "../vector";
import { some } from "lodash";

export type Config = {|
  initialSize: Vector,
  zoomVelocity: number,
  stepTimeDelta: Rational,
  velocity: number,
  costs: {
    factory: Rational,
    research: {
      mining: Rational,
      "auto-mining": Rational,
    },
  },
  researchVelocity: Rational,
  miningVelocity: Rational,
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
      const n = Math.floor(timeDelta / config.stepTimeDelta.toNumber());
      for (let i = 0; i < n; i++) {
        state.scene.step(config.stepTimeDelta);
      }
      state.timeDeltaRemainder = timeDelta % config.stepTimeDelta.toNumber();
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
  inventory: Rational;
  objects: Objects;

  constructor(
    config: Config,
    objects: (config: Config, scene: Scene) => Objects,
  ) {
    this.inventory = fromInt(0);
    this.objects = objects(config, this);
  }

  collides: ({
    position: Vector,
    getRadius: () => number,
  }) => boolean = other => {
    for (const object of this.objects.resources.values()) {
      if (collides(object, other)) {
        return true;
      }
    }
    if (some(this.objects.factories, object => collides(object, other))) {
      return true;
    }
    if (collides(this.objects.lab, other)) {
      return true;
    }
    return false;
  };

  focusedMinion: () => Minion = () => this.objects.minions.focused();

  step: Rational => void = timeDelta => {
    this.objects.lab.step(timeDelta);
    this.objects.minions.step(this, timeDelta);
  };

  onClick: Vector => void = target => {
    this.objects.minions.onClick(target);
  };

  interface: () => React.Node = () => {
    const buttons = this.focusedMinion()
      .buttons(this)
      .concat(this.objects.lab.buttons());
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
                      <button
                        id={button.id}
                        disabled={button.disabled}
                        onClick={button.onClick}
                      >
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
          resources: {Math.round(this.inventory.toNumber() * 100) / 100}
        </div>
        {this.objects.lab.newResearch()}
        <>Use the mouse to drag the map and the scroll wheel to zoom.</>
      </div>
    );
  };

  activeCommand: () => null | React.Node = () => {
    const status = this.focusedMinion().getStatus();
    if (status === null) return null;
    else return <div id="status">{status}</div>;
  };

  draw: ViewBox => React.Node = viewBox => {
    let objects: Array<{
      position: Vector,
      getRadius: () => number,
      draw: () => React.Node,
    }> = [];
    objects = objects.concat(this.objects.factories);
    for (const resource of this.objects.resources.values()) {
      objects.push(resource);
    }
    objects.push(this.objects.lab);
    objects = objects.concat(this.objects.minions.toList());
    objects = objects.filter(object => insideViewBox(viewBox, object));
    return <g>{objects.map(x => x.draw())}</g>;
  };
}
