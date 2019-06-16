// @flow

import { add, difference, distance, scale, unit, vectorLength } from "./vector";

describe("add", () => {
  it("returns the addition between two points", () => {
    expect(add({ x: 3, y: 4 }, { x: 5, y: 6 })).toEqual({
      x: 8,
      y: 10
    });
  });
});

describe("vectorLength", () => {
  it("returns the length of a point interpreted as a vector", () => {
    expect(vectorLength({ x: 3, y: 4 })).toEqual(5);
  });
});

describe("scale", () => {
  it("scales a vector", () => {
    expect(scale({ x: 3, y: 4 }, 3)).toEqual({ x: 9, y: 12 });
  });
});

describe("difference", () => {
  it("returns the difference between two points", () => {
    expect(difference({ x: 10, y: 10 }, { x: 12, y: 7 })).toEqual({
      x: 2,
      y: -3
    });
  });
});

describe("distance", () => {
  it("returns the distance between two points", () => {
    expect(distance({ x: 100, y: 100 }, { x: 103, y: 104 })).toEqual(5);
  });
});

describe("unit", () => {
  it("returns the unit vector", () => {
    const result = unit({ x: 3, y: 4 });
    expect(result.x).toBeCloseTo(3 / 5);
    expect(result.y).toBeCloseTo(4 / 5);
  });
});
