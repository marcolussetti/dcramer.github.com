import Typography from "typography";

const typography = new Typography({
  baseFontSize: "18px",
  baseLineHeight: 1.8,
  headerFontFamily: ["Open Sans", "sans-serif"],
  bodyFontFamily: ["Open Sans", "sans-serif"],
  overrideThemeStyles: () => {
    return {
      "a.gatsby-resp-image-link": {
        boxShadow: `none`,
      },
      // figure: {
      //   display: "inline-block",
      // },
      a: {
        color: "#6f5dbb",
      },
      "figure.gatsbyRemarkImagesGrid": {
        marginBottom: 0,
      },
      figcaption: {
        textAlign: "center",
        color: "#999",
        fontSize: "14px",
      },
    };
  },
});

// Hot reload typography in development.
if (process.env.NODE_ENV !== `production`) {
  typography.injectStyles();
}

export default typography;
export const rhythm = typography.rhythm;
export const scale = typography.scale;
