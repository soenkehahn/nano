// @flow

import React from "react";
import { type Node } from "react";
import dom from "react-dom";

export const App: () => Node = () => <div>hello world</div>;

if (!module.parent) {
  const appElement = document.getElementById("app");
  if (!appElement) {
    throw new Error("cannot find element 'app'");
  }
  dom.render(<App />, appElement);
}
