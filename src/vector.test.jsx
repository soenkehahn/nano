// @flow

import {
  add,
  collides,
  difference,
  distance,
  equals,
  random,
  scale,
  unit,
  vectorLength
} from "./vector";

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

describe("collides", () => {
  it("detects collisions when positions are equal", () => {
    const a = { position: { x: 2, y: 5 }, size: 2 };
    const b = { position: { x: 2, y: 5 }, size: 3 };
    expect(collides(a, b)).toEqual(true);
  });

  it("returns false when positions are too far apart", () => {
    const a = { position: { x: 2, y: 5 }, size: 2 };
    const b = { position: { x: 7.1, y: 5 }, size: 3 };
    expect(collides(a, b)).toEqual(false);
  });

  it("detects collisions when objects overlap slightly", () => {
    const a = { position: { x: 2, y: 5 }, size: 2 };
    const b = { position: { x: 6.9, y: 5 }, size: 3 };
    expect(collides(a, b)).toEqual(true);
  });
});

describe("random", () => {
  const lower = -10;
  const upper = 10;

  it("returns different vectors", () => {
    expect(random(lower, upper)).not.toEqual(random(lower, upper));
  });

  it("returns a random vector in the given bounds", () => {
    for (let i = 0; i < 100; i++) {
      const v = random(lower, upper);
      expect(
        v.x >= lower && v.x <= upper && v.y >= lower && v.y <= upper
      ).toEqual(true);
    }
  });
});

describe("equals", () => {
  it("returns true for equal vectors", () => {
    expect(equals({ x: 1, y: 2 }, { x: 1, y: 2 })).toEqual(true);
  });

  it("returns false for unequal vectors", () => {
    expect(equals({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual(false);
    expect(equals({ x: 1, y: 2 }, { x: 3, y: 2 })).toEqual(false);
    expect(equals({ x: 1, y: 2 }, { x: 1, y: 3 })).toEqual(false);
  });
});
