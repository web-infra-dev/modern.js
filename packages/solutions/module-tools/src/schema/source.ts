export const sourceSchema = [
  // 启动区块运行时
  {
    target: 'source.enableBlockRuntime',
    schema: { type: 'boolean' },
  },
  {
    target: 'source.jsxTransformRuntime',
    schema: {
      // https://babeljs.io/docs/en/babel-preset-react#runtime
      enum: ['classic', 'automatic'],
      // TODO: 目前default是无效的
      default: 'automatic',
    },
  },
];
