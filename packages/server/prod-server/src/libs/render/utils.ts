// It will inject _SERVER_DATA twice, when SSG mode.
// The first time was in ssg html created, the seoncd time was in prod-server start.
// but the second wound causes route error.

import { Readable } from 'stream';
import type { ModernServerContext } from '@modern-js/types';
import { templateInjectableStream } from '../hook-api/templateToStream';
import { TemplateAPI } from '../hook-api/template';

// To ensure that the second injection fails, the _SERVER_DATA inject at the front of head,
export const injectServerData = (
  content: string,
  context: ModernServerContext,
) => {
  const template = new TemplateAPI(content);
  template.prependHead(
    `<script type="application/json" id="__MODERN_SERVER_DATA__">${JSON.stringify(
      context.serverData,
    )}</script>`,
  );
  return template.get();
};

export const injectServerDataStream = (
  content: Readable,
  context: ModernServerContext,
) => {
  return content.pipe(
    templateInjectableStream({
      prependHead: `<script type="application/json" id="__MODERN_SERVER_DATA__">${JSON.stringify(
        context.serverData,
      )}</script>`,
    }),
  );
};
