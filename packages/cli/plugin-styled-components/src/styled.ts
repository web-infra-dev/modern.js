import * as styledComponents from 'styled-components';
import type { StyledInterface } from 'styled-components';

/**
 * Safely resolves the styled-components default export.
 * This helper function handles potential interoperability issues between CJS and ESM,
 * where the default export might be nested or directly attached.
 */
function resolveStyledComponents(): StyledInterface {
  const moduleExports = styledComponents as any;

  if (moduleExports.default?.default !== undefined) {
    return moduleExports.default.default;
  }

  return moduleExports.default ?? moduleExports;
}

const styled: StyledInterface = resolveStyledComponents();

export default styled;
export * from 'styled-components';
