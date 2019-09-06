// @flow

import * as React from "react";

export function animate<Props: {}>(animated: {
  draw: Props => React.Node,
}): React.AbstractComponent<Props> {
  class Wrapper extends React.Component<Props> {
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

    render = () => animated.draw(this.props);
  }
  return Wrapper;
}
