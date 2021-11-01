import path from 'path';

export const UTILS_STATIC = path.join(__dirname, '../../static');
export const DOCS_RENDER_PATH = '/api/v1/docs/render';
export const MDX_DEFAULT_RENDERER = `
import React from 'react'
import { mdx } from '@mdx-js/react'
`;
