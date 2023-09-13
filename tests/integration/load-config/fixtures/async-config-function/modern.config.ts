import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default async () => {
  return applyBaseConfig({
    output: {
      distPath: {
        root: 'dist/foo',
      },
    },
  });
};
