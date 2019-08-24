// @flow

import * as React from "react";

export function animate(animated: {
  draw: () => React.Node,
}): React.AbstractComponent<{||}> {
  class Wrapper extends React.Component<{||}> {
    mounted: boolean = false;

    componentDidMount = () => {
      this.mounted = true;
      this.loop();
    };

    componentWillUnmount = () => {
      this.mounted = false;
    };

    loop: () => Promise<void> = async () => {
      if (this.mounted) {
        requestAnimationFrame(() => {
          this.forceUpdate();
          this.loop();
        });
      }
    };

    render = animated.draw;
  }
  return Wrapper;
}
