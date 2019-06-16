// @flow

import * as React from "react";
import { useState, useEffect } from "react";

export function animated(
  Component: React.AbstractComponent<{| time: number, timeDelta: number |}>
): React.AbstractComponent<{||}> {
  class Wrapper extends React.Component<
    {||},
    {|
      time: null | number,
      timeDelta: null | number
    |}
  > {
    mounted: boolean = false;
    constructor() {
      super();
      this.state = { time: null, timeDelta: null };
    }

    componentDidMount = () => {
      this.mounted = true;
      requestAnimationFrame(this.loop);
    };

    componentWillUnmount = () => {
      this.mounted = false;
    };

    loop = (now: number) => {
      if (this.mounted) {
        const timeDelta = this.state.time ? now - this.state.time : null;
        this.setState({ time: now, timeDelta });
        requestAnimationFrame(this.loop);
      }
    };

    render() {
      if (this.state.time !== null && this.state.timeDelta !== null) {
        return (
          <Component time={this.state.time} timeDelta={this.state.timeDelta} />
        );
      } else {
        return <div />;
      }
    }
  }
  return Wrapper;
}
