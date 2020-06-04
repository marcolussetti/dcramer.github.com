import React from "react";
import { Link } from "gatsby";

import Container from "./container";

import HeaderLinks from "./headerLinks";

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
                fontSize: "60px",
                margin: 0,
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: "-4px",
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
                David Cramer
              </Link>
            </h1>
          </div>
          <HeaderLinks />
        </div>
      </Container>
    </header>
  );
};
