import React from "react";
import { Link } from "gatsby";

import Container from "./container";

import HeaderLinks from "./headerLinks";
import HeaderTitle from "./headerTitle";

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
            <HeaderTitle long>
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
            </HeaderTitle>
          </div>
          <HeaderLinks />
        </div>
      </Container>
    </header>
  );
};
