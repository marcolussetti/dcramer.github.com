import React from "react";
import { Link } from "gatsby";
import { GitHub, Rss, Twitter } from "react-feather";

import Container from "./container";
import { rhythm, scale } from "../utils/typography";

export default () => {
  return (
    <header
      style={{
        background: "#6f5dbb",
        color: "#ffffff",
      }}
    >
      <Container>
        <div style={{ display: "flex" }}>
          <div style={{ flex: 1, justifyContent: "center" }}>
            <h1
              style={{
                ...scale(2),
                margin: 0,
                fontWeight: 900,
                letterSpacing: -8,
              }}
            >
              <Link
                style={{
                  boxShadow: `none`,
                  color: `inherit`,
                  textDecoration: "none",
                }}
                to={`/`}
              >
                DC
              </Link>
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <a
              href="https://twitter.com/zeeg"
              style={{ marginRight: rhythm(1) }}
            >
              <Twitter color="white" />
            </a>
            <a
              href="https://github.com/dcramer"
              style={{ marginRight: rhythm(1) }}
            >
              <GitHub color="white" />
            </a>
            <a href="/rss.xml">
              <Rss color="white" />
            </a>
          </div>
        </div>
      </Container>
    </header>
  );
};
