// @flow

import { App } from "./app";
import { Minion } from "./minion";
import { configure } from "enzyme";
import { shallow } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import React from "react";

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
