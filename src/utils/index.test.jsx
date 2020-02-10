// @flow

import * as React from "react";
import { mount } from "enzyme";
import { sepBy } from ".";

function render(node: React.Node): string {
  const wrapper = mount(<>{node}</>);
  return wrapper.debug();
}

function assertEqual(a: React.Node, b: React.Node) {
  expect(render(a)).toEqual(render(b));
}

describe("sepBy", () => {
  it("seperates multiple elements by the given separator", () => {
    assertEqual(
      sepBy(<hr />, ["a", "b", "c"]),
      <>
        <div>a</div>
        <div>
          <hr />
        </div>
        <div>b</div>
        <div>
          <hr />
        </div>
        <div>c</div>
      </>,
    );
  });

  it("doesn't include a separator for a single element", () => {
    assertEqual(sepBy(<hr />, ["a"]), <div>a</div>);
  });

  it("works for two elements", () => {
    assertEqual(
      sepBy(<hr />, ["a", "b"]),
      <>
        <div>a</div>
        <div>
          <hr />
        </div>
        <div>b</div>
      </>,
    );
  });

  it("returns null for zero elements", () => {
    expect(sepBy(<hr />, [])).toEqual(null);
  });
});
