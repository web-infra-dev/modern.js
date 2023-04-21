import { useLang, usePageData } from '@modern-js/doc-core/runtime';
import { Link } from '@modern-js/doc-core/theme';
import { PageData } from '@modern-js/doc-core';
import { IconRight } from '@arco-design/web-react/icon';
import { Divider } from '@arco-design/web-react';
import '@arco-design/web-react/es/Divider/style';
import { locales } from '../../locales';

import styles from './index.module.scss';

type List = {
  icon?: React.ReactNode;
  text: string;
  link: string;
  arrow?: boolean;
};

const getGridClass = (count?: number): string => {
  if (!count) {
    return '';
  } else if (count % 3 === 0) {
    return 'grid-4';
  } else if (count % 2 === 0) {
    return 'grid-6';
  }
  return 'grid-6';
};

export default ({ list, ...props }: { list?: List[] }) => {
  const { siteData } = usePageData() as PageData;
  const lang = useLang();
  const moduleList = list ?? [];

  if (moduleList.length === 0) {
    // default list, from sidebar
    siteData.themeConfig.locales?.forEach(locale => {
      if (locale.lang === lang) {
        Object.values(locale.sidebar!)[0].forEach((sidebarItem: any) => {
          sidebarItem.items.forEach((item: List) => {
            moduleList.push({
              text: item.text,
              link: item.link,
              arrow: true,
            });
          });
        });
      }
    });
  }
  const gridClass = getGridClass(moduleList?.length);
  return (
    <div {...props}>
      <h1>{locales[lang as 'zh' | 'en']?.overview}</h1>
      <Divider />
      <div className="overflow-hidden m-auto flex flex-wrap max-w-6xl">
        {moduleList.map(({ text, link, icon, arrow }) => {
          return (
            <div
              key={link + text}
              className={`${gridClass ? styles[gridClass] : 'w-full'} rounded `}
            >
              <div className="h-full p-2">
                <Link href={link}>
                  <span
                    key={link + text}
                    className={`${styles.featureCard} h-full p-3 flex items-center justify-between text-center`}
                  >
                    <span className="flex items-center gap-2">
                      {icon}
                      {text}
                    </span>
                    {arrow && <IconRight />}
                  </span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
