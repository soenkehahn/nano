// @flow

import * as jsdomExtensions from "./jsdomExtensions/svg";
import { type Vector } from "./vector";
import React from "react";

export class SvgWithMouse extends React.Component<{|
  width: string,
  height: string,
  onClick: Vector => void,
  children: React$Node
|}> {
  svgRef: null | jsdomExtensions.SvgElement = null;

  transformClickEvent = (
    svgRef: jsdomExtensions.SvgElement,
    event: SyntheticMouseEvent<HTMLElement>
  ): jsdomExtensions.SvgPoint => {
    const point = svgRef.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svgRef.getScreenCTM().inverse());
  };

  handleClick = (event: SyntheticMouseEvent<HTMLElement>): void => {
    if (this.svgRef) {
      const svgPoint = this.transformClickEvent(this.svgRef, event);
      this.props.onClick({ x: svgPoint.x, y: svgPoint.y });
    }
  };

  render() {
    return (
      <svg
        ref={svgRef => (this.svgRef = (svgRef: any))}
        onClick={this.handleClick}
        width={this.props.width}
        height={this.props.height}
      >
        {this.props.children}
      </svg>
    );
  }
}
