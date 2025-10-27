import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  plugins: [],
  tools: {
    babel: {
      plugins: [
        [
          'babel-plugin-macros',
          {
            twin: {
              preset: 'styled-components',
              config: './tailwind.config.js',
            },
          },
        ],
      ],
    },
  },
});
