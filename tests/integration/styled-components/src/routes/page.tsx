import styled from '@modern-js/plugin-styled-components/styled';
import React from 'react';

const RedDiv = styled.div`
  color: red;
`;

const Page = () => {
  return (
    <div>
      <h1>Hello, world!</h1>
      <RedDiv>Hello Modern.js-----</RedDiv>
    </div>
  );
};

export default Page;
