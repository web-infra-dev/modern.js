import type { RemoteToolHandler } from '@modern-js/mcp-apps/config';

export const greet: RemoteToolHandler = input => {
  const { name } = input as { name: string };
  const message = `Hello, ${name}!`;
  return {
    content: [{ type: 'text', text: message }],
    structuredContent: { message },
    viewProps: { message },
  };
};
