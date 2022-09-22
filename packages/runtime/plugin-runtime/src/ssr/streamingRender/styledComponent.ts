import { ServerStyleSheet } from 'styled-components';
import { RuntimeContext } from '../../core';

export function getStyledComponentCss(
  _context: RuntimeContext,
  jsx: React.ReactElement,
) {
  const sheet = new ServerStyleSheet();
  sheet.collectStyles(jsx);
  return sheet.getStyleTags();
}
