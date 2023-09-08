import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
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

  plugins: [appTools()],
});
