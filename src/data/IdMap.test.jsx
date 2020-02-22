// @flow

import { IdMap } from "./IdMap";

describe("constructor", () => {
  it("works without arguments", () => {
    new IdMap();
  });

  it("puts all given elements into the map in order", () => {
    const map = new IdMap([
      { id: null, name: "a" },
      { id: null, name: "b" },
    ]);
    expect(map.unsafeGet(0).name).toEqual("a");
    expect(map.unsafeGet(1).name).toEqual("b");
  });
});

describe("add", () => {
  it("adds an element to the map at key 0", () => {
    const map = new IdMap();
    map.add({
      id: null,
      name: "a",
    });
    expect(map.unsafeGet(0).name).toEqual("a");
  });

  it("adds subsequent elements with increasing keys", () => {
    const map = new IdMap();
    map.add({ id: null, name: "a" });
    map.add({ id: null, name: "b" });
    expect(map.unsafeGet(1).name).toEqual("b");
  });

  it("sets the id in the element", () => {
    const map = new IdMap();
    const element = { id: null };
    map.add(element);
    expect(element.id).toEqual(0);
    map.add(element);
    expect(element.id).toEqual(1);
  });
});

describe("delete", () => {
  it("removes elements by id", () => {
    const map = new IdMap();
    map.add({ id: null });
    map.delete(0);
    expect(map.get(0)).toEqual(undefined);
  });

  it("doesn't reuse ids", () => {
    const map = new IdMap();
    map.add({ id: null });
    map.add({ id: null });
    map.add({ id: null });
    map.delete(1);
    map.add({ id: null });
    expect(Array.from(map.elements.keys())).toEqual([0, 2, 3]);
  });
});

describe("size", () => {
  it("works", () => {
    const map = new IdMap();
    expect(map.size()).toEqual(0);
    map.add({ id: null });
    expect(map.size()).toEqual(1);
    map.add({ id: null });
    expect(map.size()).toEqual(2);
  });
});

describe("toArray", () => {
  it("returns the elements in an array", () => {
    const map = new IdMap();
    map.add({ id: null, name: "a" });
    map.add({ id: null, name: "b" });
    expect(map.toArray()).toEqual([
      { id: 0, name: "a" },
      { id: 1, name: "b" },
    ]);
  });
});

describe("@@iterator", () => {
  it("allows to write for loops over the elements", () => {
    const array = [];
    for (const element of new IdMap([
      { id: null, name: "a" },
      { id: null, name: "b" },
    ])) {
      array.push(element.name);
    }
    expect(array).toEqual(["a", "b"]);
  });
});

it("works with classes with non-optional id fields", () => {
  class E {
    id: number;
  }
  const map = new IdMap();
  const element = new E();
  map.add(element);
  expect(element.id).toEqual(0);
});
