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

export const addNumbers: RemoteToolHandler = input => {
  const { a, b } = input as { a: number; b: number };
  const sum = a + b;
  return {
    content: [{ type: 'text', text: `${a} + ${b} = ${sum}` }],
    structuredContent: { a, b, sum },
    viewProps: { a, b, sum },
  };
};
