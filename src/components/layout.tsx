import React from "react";
import { Link } from "gatsby";

import Container from "./container";
import Header from "./header";
import { rhythm } from "../utils/typography";

interface Props {
  location: Location;
  title: str;
  children?: any;
}

export default ({ children }: Props) => {
  return (
    <div>
      <Header />
      <main
        style={{
          marginTop: rhythm(1),
        }}
      >
        <Container>{children}</Container>
      </main>
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
          <Link to="/archive/">Archive</Link>
        </Container>
      </footer>
    </div>
  );
};
