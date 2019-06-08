// @flow

import React from "react";
import dom from "react-dom";
import { App } from "./app";

if (!module.parent) {
  const appElement = document.getElementById("app");
  if (!appElement) {
    throw new Error("cannot find element 'app'");
  }
  dom.render(<App />, appElement);
}
