import { applyBaseConfig } from '../../utils/applyBaseConfig';

const plugin = () => {
  return {
    name: 'test',

    setup() {
      return {
        config() {
          return {
            tools: {
              devServer: {
                before: [
                  (_req: any, res: any, next: any) => {
                    res.setHeader('x-plugin', 'test-plugin');
                    next();
                  },
                ],
              },
            },
          };
        },
      };
    },
  };
};

export default applyBaseConfig({
  plugins: [plugin()],
  tools: {
    devServer: {
      before: [
        (req, res, next) => {
          res.setHeader('x-config', 'test-config');
          next();
        },
      ],
    },
  },
  runtime: {
    router: true,
    state: false,
  },
});
