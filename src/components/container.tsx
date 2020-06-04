import React from "react";

import { rhythm } from "../utils/typography";

interface Props {
  children?: any;
}

export default ({ children }: Props) => {
  return (
    <div
      style={{
        maxWidth: rhythm(28),
        marginLeft: "auto",
        marginRight: "auto",
        padding: `${rhythm(1 / 8)} ${rhythm(3 / 4)}`,
      }}
    >
      {children}
    </div>
  );
};
