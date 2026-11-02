import { createBridgeComponent } from '@module-federation/bridge-react/v18';
import { render, hydrate, renderStream } from './callbacks';
import type { ModernBridgeComponentOptions } from './types';

/** Bind Modern's application lifecycle to the shared Bridge provider. */
export function createModernBridgeComponent<Props = Record<string, unknown>>(
  options: ModernBridgeComponentOptions<Props>,
) {
  return createBridgeComponent<Props>({
    ...options,
    render,
    hydrate,
    renderStream,
  });
}
