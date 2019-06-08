// @flow

import React from "react";
import { type Node } from "react";
import { Minion } from "./minion";

export const App: () => Node = () => (
  <svg height="500" width="500">
    <Minion />
  </svg>
);
