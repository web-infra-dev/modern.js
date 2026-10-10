import { defineMcpServer } from '@modern-js/mcp-apps/config';
import { name } from '../package.json';
import { addNumbers, greet } from './mcp-tools';

export default defineMcpServer({
  name,
  version: '1.0.0',
  tools: [
    {
      ...greet,
      visibility: ['model', 'app'],
      view: { module: './src/components/Greeting.tsx' },
    },
    {
      ...addNumbers,
      visibility: ['model', 'app'],
      view: { module: './src/components/Sum.tsx' },
    },
  ],
});
