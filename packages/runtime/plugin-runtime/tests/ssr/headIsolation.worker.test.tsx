import { renderToReadableStream } from 'react-dom/server.browser';
import { createReadableStreamFromElement } from '../../src/core/server/stream/createReadableStream.worker';
import { headIsolationCases } from './headIsolationCases';

// Use React's real Web Stream renderer without the application RSC manifest.
rstest.mock('@modern-js/render/ssr', () => ({
  renderSSRStream: (...args: Parameters<typeof renderToReadableStream>) =>
    renderToReadableStream(...args),
}));

headIsolationCases(createReadableStreamFromElement);
