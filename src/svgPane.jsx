// @flow

import * as React from "react";
import * as jsdomExtensions from "./jsdomExtensions/svg";
import { type Vector, scale } from "./vector";

export type ViewBox = {| offset: Vector, size: Vector |};

type Child = {
  onClick: Vector => void,
  drawSvgElements: (viewBox: ViewBox) => React.Element<"g">,
};

type WheelEvent = SyntheticMouseEvent<HTMLElement> & {
  deltaMode: number,
  deltaY: number,
};

export class SvgPane {
  width: number;
  height: number;
  zoomVelocity: number;
  svgRef: null | jsdomExtensions.SvgElement = null;
  dragging: boolean = false;
  static draggingEnabled: boolean = true;
  zoomFactor: number;
  offset: Vector;

  constructor({
    width,
    height,
    zoomVelocity,
  }: {|
    width: number,
    height: number,
    zoomVelocity: number,
  |}) {
    this.width = width;
    this.height = height;
    this.zoomVelocity = zoomVelocity;
    this.zoomFactor = 1.0;
    this.setCenter({ x: 0, y: 0 });
    document.addEventListener("wheel", (this.onWheel: any), { passive: false });
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

  setCenter: Vector => void = center => {
    this.offset = {
      x: center.x - (this.zoomFactor * this.width) / 2,
      y: center.y - (this.zoomFactor * this.height) / 2,
    };
  };

  handleClick: (Child, SyntheticMouseEvent<HTMLElement>) => void = (
    child,
    event,
  ) => {
    if (this.svgRef) {
      const svgPoint = this.transformClickEvent(this.svgRef, event);
      child.onClick({
        x: svgPoint.x,
        y: svgPoint.y,
      });
    }
  };

  getNumberOfScrolls = (event: WheelEvent): number => {
    if (event.deltaMode === 0) {
      return event.deltaY / 53;
    } else if (event.deltaMode === 1) {
      return event.deltaY / 3;
    } else {
      throw "unsupported WheelEvent.deltaMode";
    }
  };

  onWheel = (event: WheelEvent): void => {
    if (this.svgRef !== null) {
      const point = this.transformClickEvent(this.svgRef, event);
      const zoomFactor = Math.pow(
        this.zoomVelocity,
        this.getNumberOfScrolls(event),
      );
      this.zoomFactor = this.zoomFactor * zoomFactor;
      this.offset = {
        x: (this.offset.x - point.x) * zoomFactor + point.x,
        y: (this.offset.y - point.y) * zoomFactor + point.y,
      };
      event.preventDefault();
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
      const old = this.offset;
      this.offset = {
        x: old.x - event.movementX * this.zoomFactor,
        y: old.y - event.movementY * this.zoomFactor,
      };
    }
  };

  draw: (Child, Size) => React.Node = (child, size) => {
    const center = {
      x: this.offset.x + (this.zoomFactor * this.width) / 2,
      y: this.offset.y + (this.zoomFactor * this.height) / 2,
    };
    this.width = size.width;
    this.height = size.height;
    this.setCenter(center);
    const width = this.width * this.zoomFactor;
    const height = this.height * this.zoomFactor;
    const viewBox = [this.offset.x, this.offset.y, width, height].join(" ");
    return (
      <svg
        ref={svgRef => (this.svgRef = (svgRef: any))}
        onClick={event => this.handleClick(child, event)}
        width="100%"
        height="100%"
        viewBox={viewBox}
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
        onMouseMove={this.onMouseMove}
      >
        <rect
          x={this.offset.x - 1}
          y={this.offset.y - 1}
          width="101%"
          height="101%"
          fill="black"
        />
        {child.drawSvgElements({
          offset: this.offset,
          size: scale({ x: this.width, y: this.height }, this.zoomFactor),
        })}
      </svg>
    );
  };
}

export type Size = {| width: number, height: number |};
