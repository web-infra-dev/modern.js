import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: {
      preload: {
        include: [
          {
            url: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvshpqnulg/eden-x-logo.png',
            as: 'image',
          },
        ],
      },
    },
  },
  performance: {
    chunkSplit: {
      strategy: 'all-in-one',
    },
  },
  runtime: {
    router: true,
  },
});
