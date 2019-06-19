// @flow

import * as React from "react";
import { wait } from "./utils";

export function animated(
  slowDown: null | number,
  Component: React.AbstractComponent<{| time: number, timeDelta: number |}>,
): React.AbstractComponent<{||}> {
  class Wrapper extends React.Component<
    {||},
    {|
      time: null | number,
      timeDelta: null | number,
    |},
  > {
    mounted: boolean = false;

    constructor() {
      super();
      this.state = { time: null, timeDelta: null };
    }

    componentDidMount = () => {
      this.mounted = true;
      requestAnimationFrame(now => {
        this.loop(now);
      });
    };

    componentWillUnmount = () => {
      this.mounted = false;
    };

    loop = async (now: number) => {
      if (this.mounted) {
        const timeDelta =
          this.state.time === null ? null : now - this.state.time;
        this.setState({ time: now, timeDelta });
        if (slowDown !== null) {
          await wait(slowDown);
        }
        requestAnimationFrame(now => {
          this.loop(now);
        });
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
