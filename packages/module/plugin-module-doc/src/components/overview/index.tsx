import { usePageData } from '@modern-js/doc-core/runtime';
import { PageData } from '@modern-js/doc-core';
import { IconRight } from '@arco-design/web-react/icon';
import { Divider } from '@arco-design/web-react';
import '@arco-design/web-react/es/Divider/style';
import { locales } from '../../locales';

import styles from './index.module.scss';

type ModuleList = {
  text: string;
  link: string;
};

const PRESET_COUNT = [2, 3, 4];

const getGridClass = (count?: number): string => {
  if (!count) {
    return '';
  } else if (PRESET_COUNT.includes(count)) {
    return `grid-${12 / count}`;
  } else if (count % 3 === 0) {
    return 'grid-4';
  } else if (count % 2 === 0) {
    return 'grid-6';
  }
  return '';
};

export default () => {
  const pageData = usePageData() as PageData;
  const { siteData, lang } = pageData;
  const moduleList: ModuleList[] = [];

  siteData.themeConfig.locales?.forEach(locale => {
    if (locale.lang === lang) {
      Object.values(locale.sidebar!)[0].forEach((sidebarItem: any) => {
        sidebarItem.items.forEach((item: ModuleList) => {
          moduleList.push({
            text: item.text,
            link: item.link,
          });
        });
      });
    }
  });
  const gridClass = getGridClass(moduleList?.length);

  return (
    <div>
      <h1>{locales[lang as 'zh' | 'en']?.overview}</h1>
      <Divider></Divider>
      <div className="overflow-hidden m-auto flex flex-wrap justify-between max-w-6xl">
        {moduleList?.map(({ text, link }) => {
          return (
            <div
              key={link + text}
              className={`${
                gridClass ? styles[gridClass] : 'w-full'
              } rounded hover:var(--modern-c-brand)`}
            >
              <div className="h-full p-2">
                <article
                  key={link + text}
                  className={`${styles.featureCard} h-full p-2 pl-4 border-transparent flex items-center justify-between`}
                  style={{
                    cursor: link ? 'pointer' : 'auto',
                  }}
                  onClick={() => {
                    if (link) {
                      window.location.href = link;
                    }
                  }}
                >
                  <h2 className=" text-center" style={{ fontSize: '24px' }}>
                    {text}
                  </h2>
                  <IconRight style={{ height: '24px', marginRight: '4px' }} />
                </article>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
