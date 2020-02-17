// @flow

import * as React from "react";
import { type Item, button, renderList } from "../web/lists";
import { type Rational, fromInt } from "../data/rational";
import {
  TAU,
  type Vector,
  add,
  collides,
  fromAngle,
  scale,
} from "../data/vector";

export type SvgElement = {
  getScreenCTM: () => SvgTransform,
  createSVGPoint: () => SvgPoint,
};

export class SvgTransform {
  x: number = 0;
  y: number = 0;

  inverse(): SvgTransform {
    const result = new SvgTransform();
    result.x = -this.x;
    result.y = -this.y;
    return result;
  }
}

export class SvgPoint {
  x: number = 0;
  y: number = 0;

  matrixTransform(transform: SvgTransform): SvgPoint {
    const result = new SvgPoint();
    result.x = this.x + transform.x;
    result.y = this.y + transform.y;
    return result;
  }
}

export function Pie({
  color,
  position: { x, y },
  radius,
  completion,
}: {|
  color: string,
  position: Vector,
  radius: number,
  completion: ?number,
|}): React.Element<"path"> {
  completion = completion || 0;
  const endpoint = add({ x, y }, scale(fromAngle(-TAU * completion), radius));
  return (
    <path
      d={`
        M ${x} ${y}
        l 0 ${-radius}
        A ${radius} ${radius} 0
          ${completion <= 0.5 ? 0 : 1}
          1
          ${endpoint.x} ${endpoint.y}
        L ${x} ${y}
      `}
      stroke={null}
      fill={color}
    />
  );
}
