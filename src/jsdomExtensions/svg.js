// @flow

export type SvgElement = {
  getScreenCTM: () => SvgTransform,
  createSVGPoint: () => SvgPoint
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
