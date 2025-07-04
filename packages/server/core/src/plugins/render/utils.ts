import type { UserConfig } from '../../types';
import type { RequestHandlerConfig } from '../../types/requestHandler';

export function createRequestHandlerConfig(
  userConfig: UserConfig,
): RequestHandlerConfig {
  const { output, server, security, html, source } = userConfig;

  return {
    ssr: server?.ssr,
    ssrByEntries: server?.ssrByEntries,
    nonce: security?.nonce,
    enableInlineScripts: output?.enableInlineScripts,
    enableInlineStyles: output?.enableInlineStyles,
    crossorigin: html?.crossorigin,
    scriptLoading: html?.scriptLoading,
    useJsonScript: server?.useJsonScript,
    enableAsyncEntry: source?.enableAsyncEntry,
  };
}
