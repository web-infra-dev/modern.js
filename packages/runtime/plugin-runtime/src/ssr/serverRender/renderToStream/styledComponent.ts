import { ServerStyleSheet } from 'styled-components';
import { RuntimeContext } from '../types';

export function getStyledComponentCss(
  _context: RuntimeContext,
  jsx: React.ReactElement,
) {
  const sheet = new ServerStyleSheet();

  sheet.collectStyles(jsx);
  return sheet.getStyleTags();
}
