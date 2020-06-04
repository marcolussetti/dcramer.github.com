import React from "react";

import Container from "./container";
import Footer from "./footer";
import Header from "./header";
import { rhythm } from "../utils/typography";

interface Props {
  location: Location;
  title: string;
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
      <Footer />
    </div>
  );
};
