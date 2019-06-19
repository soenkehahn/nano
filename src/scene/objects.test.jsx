// @flow

import { Scene } from "./index";
import { type ViewBox } from "../svgPane";
import {
  findRandom,
  inBiggerVicinity,
  inside,
  insideViewBox,
  mkObjects,
} from "./objects";

describe("mkObjects", () => {
  it("has multiple resources", () => {
    const config = {
      initialSize: { x: 200, y: 200 },
      zoomVelocity: 1.1,
      stepTimeDelta: 0.5,
      velocity: 1,
      prices: { factory: 3 },
      researchVelocity: 1,
    };
    expect(
      new Scene(config, mkObjects).objects.resources.length,
    ).toBeGreaterThan(5);
  });
});

describe("findRandom", () => {
  it("returns a random position", () => {
    const a = findRandom(1000, () => true);
    const b = findRandom(1000, () => true);
    expect(a).not.toEqual(b);
  });

  it("returns a position that fulfills the given predicate", () => {
    const predicate = v => Math.round(v.x) % 2 === 0;
    for (let i = 0; i < 100; i++) {
      const v = findRandom(1000, predicate);
      expect(predicate(v)).toEqual(true);
    }
  });
});

describe("inside", () => {
  const size = { x: 10, y: 10 };

  it("returns true if vector is inside the given size", () => {
    expect(inside(size, { x: 0, y: 0 })).toEqual(true);
    expect(inside(size, { x: 4, y: 4 })).toEqual(true);
    expect(inside(size, { x: -3, y: 4 })).toEqual(true);
  });

  it("returns false if vector is outside the given size", () => {
    expect(inside(size, { x: 6, y: 6 })).toEqual(false);
    expect(inside(size, { x: 6, y: 4 })).toEqual(false);
    expect(inside(size, { x: 0, y: -6 })).toEqual(false);
  });
});

describe("insideViewBox", () => {
  const viewBox: ViewBox = {
    offset: { x: -5, y: -15 },
    size: { x: 10, y: 10 },
  };

  it("returns true if vector is inside the given viewBox", () => {
    expect(
      insideViewBox(viewBox, { position: { x: 0, y: -10 }, radius: 0 }),
    ).toEqual(true);
    expect(
      insideViewBox(viewBox, { position: { x: 4, y: -6 }, radius: 0 }),
    ).toEqual(true);
    expect(
      insideViewBox(viewBox, { position: { x: -3, y: -6 }, radius: 0 }),
    ).toEqual(true);
  });

  it("returns false if vector is outside the given viewBox", () => {
    expect(
      insideViewBox(viewBox, { position: { x: 6, y: -4 }, radius: 0 }),
    ).toEqual(false);
    expect(
      insideViewBox(viewBox, { position: { x: 6, y: -6 }, radius: 0 }),
    ).toEqual(false);
    expect(
      insideViewBox(viewBox, { position: { x: 0, y: -16 }, radius: 0 }),
    ).toEqual(false);
  });

  it("returns true if vector is outside the given viewBox, but reaches inside", () => {
    expect(
      insideViewBox(viewBox, { position: { x: 0, y: -3 }, radius: 3 }),
    ).toEqual(true);
    expect(
      insideViewBox(viewBox, { position: { x: 7, y: -10 }, radius: 3 }),
    ).toEqual(true);
    expect(
      insideViewBox(viewBox, { position: { x: 7, y: -3 }, radius: 3 }),
    ).toEqual(true);
  });
});

describe("inBiggerVicinity", () => {
  const size = { x: 10, y: 10 };

  it("returns true if vector is inside the given size", () => {
    expect(inBiggerVicinity(3, size, { x: 4, y: 4 })).toEqual(true);
  });

  it("returns true if vector is outside size, but close enough", () => {
    expect(inBiggerVicinity(3, size, { x: 6, y: 4 })).toEqual(true);
    expect(inBiggerVicinity(3, size, { x: 14, y: 4 })).toEqual(true);
  });

  it("returns false if vector is too far away", () => {
    expect(inBiggerVicinity(3, size, { x: 16, y: 4 })).toEqual(false);
  });
});
