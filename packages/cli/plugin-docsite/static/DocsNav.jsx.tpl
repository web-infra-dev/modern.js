import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import Menu from 'antd/es/menu';

const MenuItem = Menu.Item;
const { SubMenu } = Menu;

const Container = styled.div`
  position: relative;
  box-sizing: border-box;
  height: 100%;
  padding: 2rem 0;
  border-right: 1px solid var(--theme-border);
  overflow: auto;
`;

const DocsNav = ({ meta }) => {
  return (
    <Container>
      <Menu>
        {meta.map(page => {
          const parts = page.moduleName.split(/\//g) || [];
          if (parts[parts.length - 1] === 'index') {
            parts.pop();
          }
          const level = Math.max(parts.length, 1);

          return (
            <MenuItem
              key={page.moduleName}
              style={{ paddingLeft: `${level + 0.5}rem` }}>
              <Link to={`/${page.moduleName}`}>{page.title}</Link>
            </MenuItem>
          );
        })}
      </Menu>
    </Container>
  );
};

export default DocsNav;
