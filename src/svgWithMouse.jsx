// @flow

import * as jsdomExtensions from "./jsdomExtensions/svg";
import { type Vector } from "./vector";
import React from "react";

type Props = {|
  width: number,
  height: number,
  onClick: Vector => void,
  zoomVelocity: number,
  children: React$Node
|};

export class SvgWithMouse extends React.Component<
  Props,
  {| zoomFactor: number, offset: Vector |}
> {
  svgRef: null | jsdomExtensions.SvgElement = null;

  constructor(props: Props) {
    super();
    this.state = {
      zoomFactor: 1.0,
      offset: {
        x: -props.width / 2,
        y: -props.height / 2
      }
    };
  }

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
      this.props.onClick({
        x: svgPoint.x,
        y: svgPoint.y
      });
    }
  };

  onWheel = (
    event: SyntheticMouseEvent<HTMLElement> & { deltaY: number }
  ): void => {
    if (this.svgRef !== null) {
      const point = this.transformClickEvent(this.svgRef, event);
      const zoomFactor = Math.pow(this.props.zoomVelocity, event.deltaY / 3);
      this.setState({
        zoomFactor: this.state.zoomFactor * zoomFactor,
        offset: {
          x: (this.state.offset.x - point.x) * zoomFactor + point.x,
          y: (this.state.offset.y - point.y) * zoomFactor + point.y
        }
      });
    }
  };

  render() {
    const width = this.props.width * this.state.zoomFactor;
    const height = this.props.height * this.state.zoomFactor;
    const viewBox = [
      this.state.offset.x,
      this.state.offset.y,
      width,
      height
    ].join(" ");
    return (
      <svg
        ref={svgRef => (this.svgRef = (svgRef: any))}
        onClick={this.handleClick}
        onWheel={this.onWheel}
        width={500}
        height={500}
        viewBox={viewBox}
      >
        <rect
          x={this.state.offset.x}
          y={this.state.offset.y}
          width="100%"
          height="100%"
          fill="black"
        />
        {this.props.children}
      </svg>
    );
  }
}
