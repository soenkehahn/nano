// @flow

import * as React from "react";

export type Item = {|
  id: string,
  node: React.Node,
|};

export function renderList(listItems: Array<Item>): ?React.Node {
  if (listItems.length === 0) return null;
  return (
    <ul>
      {listItems.map((item) => {
        return <li key={item.id}>{item.node}</li>;
      })}
    </ul>
  );
}

export function button(button: {
  id: string,
  text: string,
  disabled: boolean,
  onClick: () => void,
}): Item {
  return {
    id: button.id,
    node: (
      <button
        id={button.id}
        disabled={button.disabled}
        onClick={button.onClick}
      >
        {button.text}
      </button>
    ),
  };
}
