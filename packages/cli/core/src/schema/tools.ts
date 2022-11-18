export const tools = {
  type: 'object',
  additionalProperties: false,
  properties: {
    tailwindcss: { typeof: ['object', 'function'] },
    jest: { typeof: ['object', 'function'] },
  },
};
