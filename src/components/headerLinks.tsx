// Gatsby supports TypeScript natively!
import React from "react";
import { GitHub, Rss, Twitter } from "react-feather";
import styled from "@emotion/styled";

import { rhythm } from "../utils/typography";

const HeaderLinks = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  a {
    display: flex;
    margin-right: ${rhythm(1)};

    &:last-child {
      margin-right: 0;
    }
  }

  @media only screen and (max-width: 800px) {
    display: none;
  }
`;

type Props = {
  size: number;
};

export default ({ size = 24 }: Props) => (
  <HeaderLinks>
    <a href="https://twitter.com/zeeg">
      <Twitter color="white" size={size} />
    </a>
    <a href="https://github.com/dcramer">
      <GitHub color="white" size={size} />
    </a>
    <a href="/rss.xml">
      <Rss color="white" size={size} />
    </a>
  </HeaderLinks>
);
