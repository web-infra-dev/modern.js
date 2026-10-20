import type { McpUiResourceMeta } from '@modelcontextprotocol/ext-apps';
import { AppBridge } from '@modelcontextprotocol/ext-apps/app-bridge';

export interface InspectorTool {
  name: string;
  _meta?: {
    ui?: { resourceUri?: string; visibility?: Array<'model' | 'app'> };
  };
}

export function appTools<T extends InspectorTool>(tools: T[]) {
  return tools.filter(
    tool =>
      !tool._meta?.ui?.visibility || tool._meta.ui.visibility.includes('app'),
  );
}

export function assertAppTool(tools: InspectorTool[], name: string) {
  if (!appTools(tools).some(tool => tool.name === name))
    throw new Error(`App cannot call tool: ${name}`);
}

export function readHtmlResource(
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
    _meta?: { ui?: McpUiResourceMeta };
  }>,
  uri: string,
  fallback?: McpUiResourceMeta,
) {
  const content = contents.find(
    item => item.uri === uri && item.mimeType === 'text/html;profile=mcp-app',
  );
  if (!content)
    throw new Error('UI resource did not return matching MCP App HTML');
  const html =
    content.text ??
    (content.blob === undefined
      ? undefined
      : new TextDecoder().decode(
          Uint8Array.from(atob(content.blob), char => char.charCodeAt(0)),
        ));
  if (html === undefined) throw new Error('UI resource has no text or blob');
  return { html, ui: content._meta?.ui ?? fallback ?? {} };
}

export async function disposeBridge(bridge: AppBridge | null) {
  if (!bridge) return;
  try {
    if (bridge.getAppCapabilities())
      await bridge.teardownResource({}, { timeout: 1500 });
  } finally {
    await bridge.close();
  }
}

/** Keep the iframe mounted until graceful teardown and transport close finish. */
export async function disposePreview(
  bridge: AppBridge | null,
  clearPreview: () => void,
) {
  await disposeBridge(bridge).catch(() => {});
  clearPreview();
}

export function externalUrl(value: string) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('Only HTTP and HTTPS URLs are allowed');
  return url.href;
}

export function downloadName(uri: string) {
  const name = uri.split('/').pop()?.split(/[?#]/)[0] ?? 'download';
  return (
    decodeURIComponent(name)
      .replace(/[\\/\x00-\x1f\x7f:]/g, '_')
      .replace(/^\.+$/, '_') || 'download'
  );
}
