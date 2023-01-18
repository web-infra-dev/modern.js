import React from 'react';
import { withBase } from '@modern-js/doc-tools/runtime';
import { Swiper, SwiperSlide } from 'swiper/react';
import styles from './index.module.css';

export interface ITab {
  tabName: string;
  href: string;
}
export interface INavTabs {
  tabs: ITab[];
}

const NavTabs: React.FC<INavTabs> = ({ tabs }) => {
  const renderedTabs = tabs.map(({ tabName, href }) => (
    <SwiperSlide key={tabName} className={styles.tab}>
      <a href={withBase(href)} style={{ textDecoration: 'none' }}>
        {tabName}
      </a>
    </SwiperSlide>
  ));

  return (
    <Swiper
      slidesPerView={renderedTabs.length - 1}
      className={styles.navTabs}
      breakpoints={{
        1400: {
          slidesPerView: renderedTabs.length,
        },
        1200: {
          slidesPerView: renderedTabs.length - 2,
        },
        1000: {
          slidesPerView: renderedTabs.length - 3,
        },
        800: {
          slidesPerView: renderedTabs.length - 4,
        },
        600: {
          slidesPerView: renderedTabs.length - 5,
        },
        400: {
          slidesPerView: renderedTabs.length - 6,
        },
        200: {
          slidesPerView: renderedTabs.length - 7,
        },
      }}
    >
      {renderedTabs}
    </Swiper>
  );
};

export default NavTabs;
