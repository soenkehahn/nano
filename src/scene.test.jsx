// @flow

import "@babel/polyfill";
import * as jsdomExtensions from "./jsdomExtensions/svg";
import { MinionRender } from "./minion";
import { ReactWrapper, configure } from "enzyme";
import { mkScene } from "./scene";
import { mount } from "enzyme";
import React from "react";
import { createElement } from "react";

describe("App", () => {
  let app;

  beforeEach(() => {
    const Scene = mkScene({ velocity: 1 });
    app = mount(<Scene time={0} timeDelta={0} />);
  });

  it("shows minion in svg context", () => {
    expect(
      app
        .find("svg")
        .find(MinionRender)
        .exists()
    ).toEqual(true);
  });

  it("allows to set the minion coordinates with a mouse click", async () => {
    mockSvgJsdomExtensions(app.find("svg"), { x: 0, y: 0 });
    app.simulate("click", { clientX: 10, clientY: 10 });
    app.setProps({ timeDelta: 100 });
    expect(app.find(MinionRender).props()).toEqual({ x: 10, y: 10 });
  });

  it("takes the offset of the svg pane into account", () => {
    mockSvgJsdomExtensions(app.find("svg"), { x: 2, y: 1 });
    app.simulate("click", { clientX: 10, clientY: 10 });
    app.setProps({ timeDelta: 100 });
    expect(app.find(MinionRender).props()).toEqual({ x: 8, y: 9 });
  });

  it("minions need time to move around", () => {
    mockSvgJsdomExtensions(app.find("svg"), { x: 0, y: 0 });
    app.simulate("click", { clientX: 1, clientY: 0 });
    app.setProps({ timeDelta: 0.5 });
    expect(app.find(MinionRender).props()).toEqual({ x: 0.5, y: 0 });
  });
});

function mockSvgJsdomExtensions(
  svgWrapper: ReactWrapper<*>,
  offset: { x: number, y: number }
) {
  const svgElement = svgWrapper.instance();
  if (!svgElement || svgElement.constructor.name !== "SVGSVGElement") {
    throw new Error(`expected: SVGSVGElement, not ${svgWrapper.debug()}`);
  }
  const mockExtensions: jsdomExtensions.SvgElement = {
    getScreenCTM: () => {
      const result = new jsdomExtensions.SvgTransform();
      result.x = offset.x;
      result.y = offset.y;
      return result;
    },
    createSVGPoint: () => new jsdomExtensions.SvgPoint()
  };
  for (const field in mockExtensions) {
    (svgElement: any)[field] = mockExtensions[field];
  }
}
