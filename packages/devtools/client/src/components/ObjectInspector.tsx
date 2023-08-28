import styled from '@emotion/styled';
import { Box } from '@radix-ui/themes';
import type { Theme } from 'react-base16-styling';
import { JSONTree } from 'react-json-tree';

const theme: Theme = {
  scheme: 'tomorrow',
  author: 'chris kempson (http://chriskempson.com)',
  base00: 'transparent',
  base01: '#282a2e',
  base02: '#373b41',
  base03: '#969896',
  base04: '#b4b7b4',
  base05: '#c5c8c6',
  base06: '#e0e0e0',
  base07: '#ffffff',
  base08: '#cc6666',
  base09: '#de935f',
  base0A: '#f0c674',
  base0B: '#b5bd68',
  base0C: '#8abeb7',
  base0D: '#81a2be',
  base0E: '#b294bb',
  base0F: '#a3685a',
};

const Container = styled(Box)({
  fontSize: 'var(--font-size-2)',
});

export const ObjectInspector: typeof JSONTree = props => {
  return (
    <Container>
      <JSONTree theme={theme} {...props} />
    </Container>
  );
};
