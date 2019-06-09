// @flow

import * as jsdomExtensions from "./jsdomExtensions/svg";
import { App } from "./app";
import { MinionRender } from "./minion";
import { ReactWrapper, configure } from "enzyme";
import { mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import React from "react";

configure({ adapter: new Adapter() });

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

describe("App", () => {
  let app;

  beforeEach(() => {
    app = mount(<App />);
  });

  it("shows minion in svg context", () => {
    expect(
      app
        .find("svg")
        .find(MinionRender)
        .exists()
    ).toEqual(true);
  });

  it("allows to set the minion coordinates with a mouse click", () => {
    mockSvgJsdomExtensions(app.find("svg"), { x: 2, y: 1 });
    app.simulate("click", { clientX: 10, clientY: 10 });
    expect(app.find(MinionRender).props()).toEqual({ x: 8, y: 9 });
  });
});
