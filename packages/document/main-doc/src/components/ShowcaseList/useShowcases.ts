import { useI18n } from '../../i18n';

export type ShowcaseItem = {
  url: string;
  name: string;
  preview: string;
};

export const useShowcases = (): ShowcaseItem[] => {
  const t = useI18n();

  return [
    {
      name: t('volctrans'),
      url: 'https://translate.volcengine.com/',
      preview:
        'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/showcase/volctrans-0424.jpeg',
    },
    {
      name: t('writingo'),
      url: 'https://writingo.net/',
      preview:
        'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/showcase/writingo-0424.jpeg',
    },
    {
      name: 'Rspack',
      url: 'https://rspack.dev/',
      preview:
        'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/showcase/rspack-0424.jpeg',
    },
    {
      name: t('shidianbaike'),
      url: 'https://shidian.baike.com/',
      preview:
        'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/showcase/shidianbaike-0424.jpeg',
    },
    {
      name: t('xiaohe'),
      url: 'https://xiaohe.cn/',
      preview:
        'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/showcase/xiaohe-0424.png',
    },
  ];
};
