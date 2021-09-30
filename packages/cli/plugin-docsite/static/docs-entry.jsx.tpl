import React from 'react';
import { render } from 'react-dom';
import styled from 'styled-components';
import { BrowserRouter as Router } from 'react-router-dom';
import DocsNav from './DocsNav';
import DocsRoutes from './DocsRoutes';
import meta from './meta.json';
import 'antd/dist/antd.css';
import './docs.css';

const NavWrapper = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 12rem;
  overflow-y: auto;
`;
const MainWrapper = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 12rem;
  right: 0;
`;

const App = () => (
  <Router basename="<%= basename || '/' %>">
    <NavWrapper>
      <DocsNav meta={meta} />
    </NavWrapper>
    <MainWrapper>
      <DocsRoutes />
    </MainWrapper>
  </Router>
);

const root = document.createElement('div');
root.setAttribute('id', 'root');
document.body.append(root);
render(<App />, document.querySelector('#root'));
