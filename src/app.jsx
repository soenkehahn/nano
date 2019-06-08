// @flow

import { Minion } from "./minion";
import { type Node } from "react";
import React from "react";

export const App: () => Node = () => (
  <svg height="500" width="500">
    <Minion />
  </svg>
);
