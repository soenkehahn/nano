// @flow

import * as React from "react";
import * as jsdomExtensions from "./jsdomExtensions/svg";
import { type Vector, scale } from "./vector";

export type ViewBox = {| offset: Vector, size: Vector |};

type Props = {|
  width: number,
  height: number,
  onClick: Vector => void,
  zoomVelocity: number,
  scene: {
    draw: (viewBox: ViewBox) => React.Node,
  },
|};

export class SvgPane extends React.Component<
  Props,
  {| zoomFactor: number, offset: Vector |},
> {
  svgRef: null | jsdomExtensions.SvgElement = null;
  dragging: boolean = false;
  static draggingEnabled: boolean = true;

  constructor(props: Props) {
    super();
    this.state = {
      zoomFactor: 1.0,
      offset: {
        x: -props.width / 2,
        y: -props.height / 2,
      },
    };
  }

  transformClickEvent = (
    svgRef: jsdomExtensions.SvgElement,
    event: SyntheticMouseEvent<HTMLElement>,
  ): jsdomExtensions.SvgPoint => {
    const point = svgRef.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svgRef.getScreenCTM().inverse());
  };

  handleClick: (SyntheticMouseEvent<HTMLElement>) => void = event => {
    if (this.svgRef) {
      const svgPoint = this.transformClickEvent(this.svgRef, event);
      this.props.onClick({
        x: svgPoint.x,
        y: svgPoint.y,
      });
    }
  };

  onWheel = (
    event: SyntheticMouseEvent<HTMLElement> & { deltaY: number },
  ): void => {
    if (this.svgRef !== null) {
      const point = this.transformClickEvent(this.svgRef, event);
      const zoomFactor = Math.pow(this.props.zoomVelocity, event.deltaY / 3);
      this.setState({
        zoomFactor: this.state.zoomFactor * zoomFactor,
        offset: {
          x: (this.state.offset.x - point.x) * zoomFactor + point.x,
          y: (this.state.offset.y - point.y) * zoomFactor + point.y,
        },
      });
    }
  };

  onMouseDown = () => {
    if (SvgPane.draggingEnabled) {
      this.dragging = true;
    }
  };

  onMouseUp = () => {
    this.dragging = false;
  };

  onMouseMove = (
    event: SyntheticMouseEvent<HTMLElement> & {
      movementX: number,
      movementY: number,
    },
  ) => {
    if (this.dragging) {
      const old = this.state.offset;
      this.setState({
        offset: {
          x: old.x - event.movementX * this.state.zoomFactor,
          y: old.y - event.movementY * this.state.zoomFactor,
        },
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
      height,
    ].join(" ");
    return (
      <svg
        ref={svgRef => (this.svgRef = (svgRef: any))}
        style={{ flexShrink: 0 }}
        onClick={this.handleClick}
        width={this.props.width}
        height={this.props.height}
        viewBox={viewBox}
        onWheel={this.onWheel}
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
        onMouseMove={this.onMouseMove}
      >
        <rect
          x={this.state.offset.x}
          y={this.state.offset.y}
          width="100%"
          height="100%"
          fill="black"
        />
        {this.props.scene.draw({
          offset: this.state.offset,
          size: scale(
            { x: this.props.width, y: this.props.height },
            this.state.zoomFactor,
          ),
        })}
      </svg>
    );
  }
}
