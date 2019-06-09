// @flow

import * as jsdomExtensions from "./jsdomExtensions/svg";
import { Minion } from "./minion";
import React from "react";

function transformClickEvent(
  svgRef: jsdomExtensions.SvgElement,
  event: SyntheticMouseEvent<HTMLElement>
): jsdomExtensions.SvgPoint {
  const point = svgRef.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(svgRef.getScreenCTM().inverse());
}

type Scene = {| minion: Minion |};

export class App extends React.Component<{}, Scene> {
  svgRef: null | jsdomExtensions.SvgElement = null;

  constructor() {
    super();
    this.state = {
      minion: new Minion()
    };
  }

  handleClick = (event: SyntheticMouseEvent<HTMLElement>): void => {
    if (this.svgRef) {
      const svgPoint = transformClickEvent(this.svgRef, event);
      this.state.minion.setPosition({ x: svgPoint.x, y: svgPoint.y });
      this.setState({
        minion: this.state.minion
      });
    }
  };

  render = () => {
    return (
      <svg
        ref={svgRef => (this.svgRef = (svgRef: any))}
        height="500"
        width="500"
        onClick={this.handleClick}
      >
        {this.state.minion.draw()}
      </svg>
    );
  };
}
