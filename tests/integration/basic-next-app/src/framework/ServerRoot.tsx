/// <reference types="react/canary" />
import type React from 'react';
import { use, type ReactNode } from 'react';

import { readFileSync } from 'node:fs';
import { renderToReadableStream } from 'react-server-dom-webpack/server.edge';
import path from 'node:path';
import App from '../components/App';

type Elements = Promise<ReactNode[]>;

interface IProps {
  selectedId?: string;
  isEditing?: boolean;
  searchText?: string;
}

export function ServerRoot(props: IProps) {
  return <App name="modern.js" />;
}

export const renderRsc = async ({
  Component,
  distDir,
  props = {},
  returnValue,
}: {
  Component: React.ComponentType<any>;
  distDir: string;
  props?: IProps;
  returnValue?: unknown;
}) => {
  const manifest = readFileSync(
    path.resolve(distDir, './react-client-manifest.json'),
    'utf8',
  );

  const moduleMap = JSON.parse(manifest);
  const element = <Component {...props} />;
  const payload = returnValue ? { returnValue, root: element } : element;
  const readable = renderToReadableStream(payload, moduleMap);
  return readable;
};
