// @flow

import * as React from "react";

type InjectedProps = {| width: number, height: number |};

export function withSize(
  Component: React.AbstractComponent<InjectedProps>,
): React.AbstractComponent<{||}> {
  return class WithSize extends React.Component<
    {||},
    {| size: null | {| width: number, height: number |} |},
  > {
    div: null | HTMLDivElement = null;

    constructor(props) {
      super(props);
      this.state = { size: null };
    }

    handleResize = () => {
      if (this.div !== null) {
        this.setState({
          size: {
            width: this.div.clientWidth,
            height: this.div.clientHeight,
          },
        });
      }
    };

    componentDidMount = () => {
      window.addEventListener("resize", () => {
        this.handleResize();
      });
      this.handleResize();
    };

    render = () => {
      let child;
      if (this.state.size === null) {
        child = <div />;
      } else {
        child = <Component {...this.state.size} />;
      }
      return (
        <div
          style={{ height: "100%", width: "100%" }}
          ref={node => (this.div = node)}
        >
          {child}
        </div>
      );
    };
  };
}
