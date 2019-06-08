// @flow

import { shallow } from "enzyme";
import { App } from "./app";
import { Minion } from "./minion";
import React from "react";
import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

configure({ adapter: new Adapter() });

describe("App", () => {
  it("shows minion in svg context", () => {
    const app = shallow(<App />);
    expect(
      app
        .find("svg")
        .find(Minion)
        .exists()
    ).toEqual(true);
  });
});
