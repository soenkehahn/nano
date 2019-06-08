// @flow

import { shallow } from "enzyme";
import { App } from "./index.jsx";
import React from "react";
import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

configure({ adapter: new Adapter() });

describe("App", () => {
  it("displays hello world", () => {
    const app = shallow(<App />);
    expect(app.text()).toEqual("hello world");
  });
});
