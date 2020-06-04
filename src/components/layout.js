import React from "react";
import { Link } from "gatsby";
import { GitHub, Rss, Twitter } from "react-feather";

import { rhythm, scale } from "../utils/typography";

const Container = ({ children }) => {
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

const Header = () => {
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

const Layout = ({ location, title, children }) => {
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
        <Container>© {new Date().getFullYear()} David Cramer</Container>
      </footer>
    </div>
  );
};

export default Layout;
