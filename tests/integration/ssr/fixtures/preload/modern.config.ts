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
  runtime: {
    router: true,
  },
});
