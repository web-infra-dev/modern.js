import { createReadableStreamFromElement } from '../../src/core/server/stream/createReadableStream';
import { headIsolationCases } from './headIsolationCases';

headIsolationCases(createReadableStreamFromElement);
