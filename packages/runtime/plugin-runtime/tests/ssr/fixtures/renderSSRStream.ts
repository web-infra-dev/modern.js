// Exercise real React Web streaming without an RSC bundler runtime in unit tests.
import { rstest } from '@rstest/core';
import { renderToReadableStream } from 'react-dom/server.edge';
export const renderSSRStream = rstest.fn(renderToReadableStream);
