import type { Context, ServerPlugin } from '@modern-js/server-core';
import path from 'path';
import { readFileSync } from 'fs';
// import {
//   renderToPipeableStream,
//   renderToReadableStream,
// } from 'react-server-dom-webpack/server';
import { renderToReadableStream } from 'react-server-dom-webpack/server.edge';
import React from 'react';
import { Pool } from 'pg';
// import ReactApp from '../src/App';

console.log('react1111111111', React.version);
console.log('renderToReadableStream', renderToReadableStream);

const pool = new Pool(require('../credentials'));

interface IProps {
  selectedId: string;
  isEditing: boolean;
  searchText: string;
}

const renderRsc = async (distDir: string, props: IProps) => {
  const ReactApp = (await import('../src/App')).default;
  const manifest = readFileSync(
    path.resolve(distDir, './react-client-manifest.json'),
    'utf8',
  );

  const moduleMap = JSON.parse(manifest);
  const readable = renderToReadableStream(
    React.createElement(ReactApp, props),
    moduleMap,
  );
  return readable;
};

const handleResponse = async (
  c: Context,
  distDir: string,
  redirectId?: string,
) => {
  const location = JSON.parse(c.req.query('location') as string);
  if (redirectId) {
    location.selectedId = redirectId;
  }
  const readable = await renderRsc(distDir, {
    selectedId: location.selectedId,
    isEditing: location.isEditing,
    searchText: location.searchText,
  });
  return c.body(readable, 200);
};

export default (): ServerPlugin => ({
  name: 'rsc-server-plugin',
  setup(api) {
    return {
      prepare() {
        const { middlewares, distDirectory } = api.useAppContext();
        console.log('push middleware');
        middlewares.unshift({
          name: 'rsc',
          path: '/react',
          handler: async (c, next) => {
            // TODO: 临时代码
            return await handleResponse(c, distDirectory);
          },
        });

        // middlewares.unshift({
        //   name: 'notes',
        //   path: '/notes/:id',
        //   handler: async (c, next) => {
        //     const { req } = c;
        //     const now = new Date();
        //     const updatedId = Number(req.param('id'));
        //     await pool.query(
        //       'update notes set title = $1, body = $2, updated_at = $3 where id = $4',
        //       [req.body.title, req.body.body, now, updatedId],
        //     );
        //     await writeFile(
        //       path.resolve(NOTES_PATH, `${updatedId}.md`),
        //       req.body.body,
        //       'utf8',
        //     );
        //   },
        // });
      },
    };
  },
});
