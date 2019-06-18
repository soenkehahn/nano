// @flow

import { SvgWithMouse } from "./svgWithMouse";
import { mockSvgJsdomExtensions } from "./test/utils";
import { mount } from "enzyme";
import React from "react";

describe("SvgWithMouse", () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(
      <SvgWithMouse
        width={800}
        height={600}
        zoomVelocity={1.1}
        onClick={() => {}}
      >
        <g />
      </SvgWithMouse>
    );
    mockSvgJsdomExtensions(wrapper.find("svg"), { x: 400, y: 300 });
  });

  it("sets an initial viewBox", () => {
    expect(wrapper.find("svg").props().viewBox).toEqual("-400 -300 800 600");
  });

  it("allows to zoom out with a scroll wheel", () => {
    wrapper
      .find(SvgWithMouse)
      .simulate("wheel", { clientX: 400, clientY: 300, deltaY: 3 });
    expect(wrapper.find("svg").props().viewBox).toEqual(
      [-400, -300, 800, 600].map(x => x * 1.1).join(" ")
    );
  });

  it("allows to zoom in with a scroll wheel", () => {
    wrapper
      .find(SvgWithMouse)
      .simulate("wheel", { clientX: 400, clientY: 300, deltaY: -3 });
    expect(wrapper.find("svg").props().viewBox).toEqual(
      [-400, -300, 800, 600].map(x => x / 1.1).join(" ")
    );
  });

  it("zooms in on the mouse position", () => {
    wrapper
      .find(SvgWithMouse)
      .simulate("wheel", { clientX: 600, clientY: 200, deltaY: -3 });
    expect(wrapper.find("svg").props().viewBox).toEqual(
      [
        (-400 - 200) * (1 / 1.1) + 200,
        (-300 - -100) * (1 / 1.1) + -100,
        800 / 1.1,
        600 / 1.1
      ].join(" ")
    );
  });

  it("zooms out the same", () => {
    wrapper
      .find(SvgWithMouse)
      .simulate("wheel", { clientX: 600, clientY: 200, deltaY: 3 });
    expect(wrapper.find("svg").props().viewBox).toEqual(
      [
        (-400 - 200) * (1 * 1.1) + 200,
        (-300 - -100) * (1 * 1.1) + -100,
        800 * 1.1,
        600 * 1.1
      ].join(" ")
    );
  });
});
