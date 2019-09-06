// @flow

import * as React from "react";

export type Button = {|
  id: string,
  text: string,
  disabled: boolean,
  onClick: () => void,
|};

export function renderButtons(buttons: Array<Button>): ?React.Node {
  if (buttons.length === 0) return null;
  return (
    <ul>
      {buttons.map(button => {
        return (
          <li key={button.id}>
            <button
              id={button.id}
              disabled={button.disabled}
              onClick={button.onClick}
              style={{ pointerEvents: "auto" }}
            >
              {button.text}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
