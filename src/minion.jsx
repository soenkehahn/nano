// @flow

import React from "react";

type Position = { x: number, y: number };

export class Minion {
  x: number = 0;
  y: number = 0;

  setPosition(position: Position) {
    this.x = position.x;
    this.y = position.y;
  }

  draw() {
    return <MinionRender x={this.x} y={this.y} />;
  }
}

export const MinionRender = (position: Position) => (
  <circle cx={position.x} cy={position.y} r="50" style={{ fill: lightBlue }} />
);

const lightBlue = "#8888ff";
