/// <reference types="react/canary" />
/// <reference types="react-dom/canary" />
import { readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
// import { createRequestHandler } from '@modern-js/runtime/ssr/server';
import { getModuleMap } from './renderRsc';
import { createFromReadableStream } from 'react-server-dom-webpack/client.browser';
import { renderToReadableStream as renderToStream } from 'react-dom/server.edge';
import React, { use, type ReactNode } from 'react';
import { Router } from './framework/router';
import { renderRsc, ServerRoot } from './framework/ServerRoot';
import { injectRSCPayload } from 'rsc-html-stream/server';
import { handleAction } from './framework/rsc-runtime';
export { renderRsc, ServerRoot };

type Elements = Promise<ReactNode[]>;
export function Html({
  elements,
  styles,
}: {
  elements: Elements;
  styles: string[];
}) {
  const res = use(elements);
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {styles.map(style => (
          // biome-ignore lint/style/useSelfClosingElements: <explanation>
          <link key={style} rel="stylesheet" href={style}></link>
        ))}
        <title>My app</title>
      </head>
      <body>{res}</body>
    </html>
  );
}

function collectStyles(moduleMap: SSRModuleMap) {
  const styles: string[] = [];
  if (!moduleMap) return [];
  for (const module of Object.values(moduleMap)) {
    if (module.styles) {
      styles.push(...module.styles);
    }
  }
  return styles;
}

export const handleRequest = async (request: Request): Promise<Response> => {
  const distDir = path.resolve(__dirname, '../');

  const serverReference = request.headers.get('rsc-action');
  if (serverReference) {
    return handleAction(request, distDir);
  }

  const files = await fs.readdir(path.join(distDir, 'static/js'));
  const jsFiles = files.filter(file => file.endsWith('.js'));
  const bootstrapScripts = jsFiles.map(jsFile =>
    path.join('static/js', jsFile),
  );

  const url = new URL(request.url);
  const location = JSON.parse(url.searchParams.get('location') as string);
  const stream = await renderRsc({
    Component: ServerRoot,
    distDir,
    props: {
      selectedId: location?.selectedId,
      isEditing: location?.isEditing,
      searchText: location?.searchText,
    },
  });

  const [stream1, stream2] = stream.tee();

  const clientManifest = getModuleMap(distDir);
  const ssrManifest = JSON.parse(
    readFileSync(path.resolve(distDir, './react-ssr-manifest.json'), 'utf8'),
  );
  const styles = collectStyles(clientManifest).concat(ssrManifest.styles);

  const elements: Promise<ReactNode[]> = createFromReadableStream(stream1, {
    ssrManifest: { moduleMap: clientManifest },
  });

  const htmlStream = await renderToStream(
    <Html elements={elements} styles={styles} />,
    {
      bootstrapScripts: bootstrapScripts,
      onError(error) {
        console.error(error);
      },
    },
  );

  const responseStream = htmlStream.pipeThrough(injectRSCPayload(stream2));

  const response = new Response(responseStream, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  });

  return response;
};

export const requestHandler = handleRequest;
