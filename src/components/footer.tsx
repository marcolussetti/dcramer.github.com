import React from "react";
import { Link } from "gatsby";

import Container from "./container";
import { rhythm } from "../utils/typography";

export default () => {
  return (
    <footer
      style={{
        fontSize: "12px",
        textAlign: "center",
        marginTop: rhythm(2),
        marginBottom: rhythm(1),
      }}
    >
      <Container>
        © {new Date().getFullYear()} David Cramer —{" "}
        <Link to="/archive/" style={{ color: "inherit" }}>
          Archive
        </Link>
      </Container>
    </footer>
  );
};
