import React from "react";
import { PageProps, Link, graphql } from "gatsby";
import styled from "@emotion/styled";

import HeaderLinks from "../components/headerLinks";
import HeaderTitle from "../components/headerTitle";
import SEO from "../components/seo";
import { rhythm } from "../utils/typography";

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

const Side = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  height: 100%;
  padding: ${rhythm(1)};
  min-width: 400px;

  &:first-child {
    justify-content: flex-end;
    background: #6f5dbb;
    color: #fff;
  }

  article {
    margin-bottom: ${rhythm(1)};

    &:last-child {
      margin-bottom: 0;
    }
  }

  @media only screen and (max-width: 800px) {
    &:first-child {
      display: block;
      height: auto;
      padding: ${rhythm(1 / 4)};
    }

    &:last-child {
      align-items: flex-start;
    }
  }
`;

const BlogIndex = ({ data }: PageProps<Data>) => {
  const siteTitle = data.site.siteMetadata.title;
  const posts = data.allMarkdownRemark.edges;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "row",
        height: "100%",
      }}
    >
      <SEO title={siteTitle} />
      <Side>
        <header>
          <HeaderTitle style={{ textAlign: "center" }}>
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
          </HeaderTitle>
          <HeaderLinks />
        </header>
      </Side>
      <Side
        style={{
          flexDirection: "row",
          justifyContent: "flex-start",
        }}
      >
        <main>
          <h1
            style={{
              fontWeight: 300,
            }}
          >
            Ramblings
          </h1>
          {posts.map(({ node }) => {
            const title = node.frontmatter.title || node.fields.slug;
            return (
              <article key={node.fields.slug}>
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
        </main>
      </Side>
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
