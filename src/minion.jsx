// @flow

import React from "react";

export const Minion = () => (
  <circle
    cx="50"
    cy="50"
    r="50"
    style={{ fill: lightBlue }}
    onClick={() => console.error("jes")}
  />
);

const lightBlue = "#8888ff";
