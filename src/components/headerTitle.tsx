import styled from "@emotion/styled";
import { css } from "@emotion/core";

// XXX: letter-spacing fucks up the box model, which is why we have margin-left
export default styled.h1`
  font-size: 120px;
  margin: 0;
  font-weight: 900;
  letter-spacing: -16px;
  line-height: 1;
  margin-left: -16px;
  overflow: none;

  ${(props) =>
    props.long &&
    css`
      font-size: 40px;
      letter-spacing: -4px;
      margin-left: -4px;
    `}

  @media only screen and (max-width: 800px) {
    font-size: 40px !important;
    letter-spacing: -4px !important;
    margin-left: -8px !important;
  }
`;
