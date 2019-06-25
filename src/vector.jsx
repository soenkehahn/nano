// @flow

export type Vector = {| x: number, y: number |};

export function equals(a: Vector, b: Vector): boolean {
  if (a.x !== b.x) {
    return false;
  }
  if (a.y !== b.y) {
    return false;
  }
  return true;
}

export function add(a: Vector, b: Vector): Vector {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function vectorLength(v: Vector): number {
  return Math.sqrt(v.x ** 2 + v.y ** 2);
}

export function scale(v: Vector, factor: number): Vector {
  return { x: v.x * factor, y: v.y * factor };
}

export function difference(a: Vector, b: Vector): Vector {
  return { x: b.x - a.x, y: b.y - a.y };
}

export function distance(a: Vector, b: Vector): number {
  return vectorLength(difference(a, b));
}

export function unit(v: Vector): Vector {
  const length = vectorLength(v);
  const factor = 1 / length;
  return { x: v.x * factor, y: v.y * factor };
}

export const TAU = 2 * Math.PI;

export function fromAngle(radians: number): Vector {
  return { x: -Math.sin(radians), y: -Math.cos(radians) };
}

export function collides(
  a: { position: Vector, getRadius: () => number },
  b: { position: Vector, getRadius: () => number },
): boolean {
  return distance(a.position, b.position) < a.getRadius() + b.getRadius();
}

export const random: (number, number) => Vector = (lower, upper) => ({
  x: Math.random() * (upper - lower) + lower,
  y: Math.random() * (upper - lower) + lower,
});

export const toClickEvent = (
  v: Vector,
): { clientX: number, clientY: number } => ({ clientX: v.x, clientY: v.y });
