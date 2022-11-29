export const testing = {
  type: 'object',
  additionalProperties: false,
  properties: {
    transformer: { type: 'string', enum: ['babel-jest', 'ts-jest'] },
    jest: { typeof: ['object', 'function'] },
  },
};
