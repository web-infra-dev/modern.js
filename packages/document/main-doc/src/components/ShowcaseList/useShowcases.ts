import { useI18n } from '../../i18n';

export type ShowcaseType = 'framework' | 'builder' | 'doc' | 'module';

export type ShowcaseItem = {
  url: string;
  name: string;
  preview: string;
  type: ShowcaseType;
};

export const useShowcases = (): ShowcaseItem[] => {
  const t = useI18n();

  return [
    {
      name: 'Tiktok Seller',
      url: 'https://seller-us-accounts.tiktok.com/',
      preview:
        'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/showcase/tiktok-seller-showcase-08172.png',
      type: 'framework',
    },
    {
      name: 'Tiktok Streamer',
      url: 'https://shop.tiktok.com/streamer/welcome',
      preview:
        'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/showcase/tiktok-steamer-showcase-08172.png',
      type: 'framework',
    },
    {
      name: 'Tiktok Shop Partner',
      url: 'https://partner-us.tiktok.com/',
      preview:
        'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/showcase/tiktok-shop-partner-0817.png',
      type: 'framework',
    },
    {
      name: t('doubao'),
      url: 'https://www.doubao.com/',
      preview:
        'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/showcase/doubao-showcase-0817.png',
      type: 'framework',
    },
    {
      name: t('volctrans'),
      url: 'https://translate.volcengine.com/',
      preview:
        'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/showcase/volctrans-0424.jpeg',
      type: 'framework',
    },
    {
      name: t('writingo'),
      url: 'https://writingo.net/',
      preview:
        'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/showcase/writingo-0424.jpeg',
      type: 'framework',
    },
    {
      name: 'Rspack',
      url: 'https://rspack.dev/',
      preview:
        'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/showcase/rspack-0424.jpeg',
      type: 'doc',
    },
    {
      name: 'Modern.js',
      url: 'https://modernjs.dev/en/',
      preview:
        'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/showcase/modernjs-dev-0425.jpeg',
      type: 'doc',
    },
    {
      name: t('shidianbaike'),
      url: 'https://shidian.baike.com/',
      preview:
        'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/showcase/shidianbaike-0424.jpeg',
      type: 'framework',
    },
    {
      name: t('xiaohe'),
      url: 'https://xiaohe.cn/',
      preview:
        'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/showcase/xiaohe-0424.png',
      type: 'framework',
    },
    {
      name: t('dongchedi'),
      url: 'https://m.dcdapp.com/motor/feoffline/usedcar_channel/channel.html',
      preview:
        'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/showcase/dongchedi-0425.png',
      type: 'builder',
    },
    {
      name: t('volcengineDeveloper'),
      url: 'https://developer.volcengine.com/',
      preview:
        'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/showcase/developer-volcengine-0425.png',
      type: 'framework',
    },
  ];
};
