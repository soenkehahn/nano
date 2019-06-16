// @flow

export type Position = { x: number, y: number };

export function add(a: Position, b: Position): Position {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function vectorLength(v: Position): number {
  return Math.sqrt(v.x ** 2 + v.y ** 2);
}

export function scale(v: Position, factor: number): Position {
  return { x: v.x * factor, y: v.y * factor };
}

export function difference(a: Position, b: Position): Position {
  return { x: b.x - a.x, y: b.y - a.y };
}

export function distance(a: Position, b: Position): number {
  return vectorLength(difference(a, b));
}

export function unit(v: Position): Position {
  const length = vectorLength(v);
  const factor = 1 / length;
  return { x: v.x * factor, y: v.y * factor };
}
