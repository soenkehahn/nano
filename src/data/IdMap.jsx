// @flow

type HasId = { -id: number };

export class IdMap<Element> {
  counter: number = 0;
  elements: Map<number, Element> = new Map();

  constructor(values?: Array<Element & HasId> = []) {
    for (const element of values) {
      this.add(element);
    }
  }

  add(element: Element & HasId): void {
    element.id = this.counter++;
    this.elements.set(element.id, element);
  }

  get(id: number): ?Element {
    return this.elements.get(id);
  }

  unsafeGet(id: number): Element {
    return (this.get(id): any);
  }

  delete(id: number): void {
    this.elements.delete(id);
  }

  size(): number {
    return this.elements.size;
  }

  toArray(): Array<Element> {
    return Array.from(this.elements.values());
  }

  // $FlowFixMe
  [Symbol.iterator](): Iterator<Element> {
    return this.elements.values();
  }

  /*::
  @@iterator(): Iterator<Element> {
    throw "this is a workaround, see https://stackoverflow.com/questions/48491307/iterable-class-in-flow"
  }
  */
}
