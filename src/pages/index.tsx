// Gatsby supports TypeScript natively!
import React from "react";
import { PageProps, Link, graphql } from "gatsby";
import { GitHub, Rss, Twitter } from "react-feather";

import Container from "../components/container";
import Footer from "../components/footer";
import SEO from "../components/seo";
import { rhythm, scale } from "../utils/typography";

type Data = {
  site: {
    siteMetadata: {
      title: string;
    };
  };
  allMarkdownRemark: {
    edges: {
      node: {
        excerpt: string;
        frontmatter: {
          title: string;
          date: string;
        };
        fields: {
          slug: string;
        };
      };
    }[];
  };
};

const BlogIndex = ({ data }: PageProps<Data>) => {
  const siteTitle = data.site.siteMetadata.title;
  const posts = data.allMarkdownRemark.edges;

  return (
    <div
      style={{
        background: "#6f5dbb",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        overflow: "none",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <SEO title={siteTitle} />
      <Container>
        <header
          style={{
            marginBottom: rhythm(2),
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h1
              style={{
                ...scale(2),
                margin: 0,
                marginBottom: rhythm(1 / 4),
                fontWeight: 900,
                letterSpacing: -8,
                textAlign: "center",
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
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
        </header>
        <main
          style={{
            marginTop: rhythm(1),
            flex: 1,
          }}
        >
          <section>
            <h1
              style={{
                fontWeight: 300,
              }}
            >
              Recent Ramblings
            </h1>
            {posts.map(({ node }) => {
              const title = node.frontmatter.title || node.fields.slug;
              return (
                <article
                  key={node.fields.slug}
                  style={{ marginBottom: rhythm(1) }}
                >
                  <header>
                    <h3 style={{ margin: 0 }}>
                      <Link
                        style={{
                          textDecoration: "none",
                          boxShadow: `none`,
                          color: "inherit",
                        }}
                        to={node.fields.slug}
                      >
                        {title}
                      </Link>
                    </h3>
                    <small>{node.frontmatter.date}</small>
                  </header>
                </article>
              );
            })}
          </section>
        </main>
        <Footer />
      </Container>
    </div>
  );
};

export default BlogIndex;

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      limit: 3
    ) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
          }
        }
      }
    }
  }
`;
