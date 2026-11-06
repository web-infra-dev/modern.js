import { createBridgeComponent } from '@module-federation/bridge-react/server';
import { renderStream } from './callbacks.node';
import type { ModernBridgeComponentOptions } from './types';

/** The Node export renders the same scoped Root through the Modern request flow. */
export function createModernBridgeComponent<Props = Record<string, unknown>>(
  options: ModernBridgeComponentOptions<Props>,
) {
  return createBridgeComponent<Props>({
    ...options,
    renderStream,
  });
}
