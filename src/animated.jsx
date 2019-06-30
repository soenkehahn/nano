// @flow

import * as React from "react";

export type Animated = { draw: TimeStep => React.Node };

export type TimeStep = {| time: number, timeDelta: number |};

export function animate(animated: Animated): React.AbstractComponent<{||}> {
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
        requestAnimationFrame(now => {
          this.loop(now);
        });
      }
    };

    render() {
      if (this.state.time !== null && this.state.timeDelta !== null) {
        return animated.draw({
          time: this.state.time,
          timeDelta: this.state.timeDelta,
        });
      } else {
        return null;
      }
    }
  }
  return Wrapper;
}
