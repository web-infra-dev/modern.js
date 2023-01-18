/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
// TODO: enable eslint
import React, { useEffect } from 'react';
import clsx from 'clsx';
import { NoSSR, withBase } from '@modern-js/doc-tools/runtime';
import UnitySVG from '@site/static/img/features/unity.svg';
import DynamicSVG from '@site/static/img/features/dynamic.svg';
import APISVG from '@site/static/img/features/api.svg';
import HTMLSVG from '@site/static/img/features/html.svg';
import CssFileSVG from '@site/static/img/features/css-file.svg';
import FrameWorkConfigSVG from '@site/static/img/features/framework-config.svg';
import TestSVG from '@site/static/img/features/test.svg';
import EditorSVG from '@site/static/img/features/editor.svg';
import QuickStartCard from '../components/QuickStartCard';
import FlowCard from '../components/FlowCard';
import ContentCard from '../components/ContentCard';
import SecondaryTitle from '../components/SecondaryTitle';
import { Featurelayout } from '../components/FeatureLayout';
import Footer from '../theme/Footer';
import styles from './index.module.css';
import 'swiper/css';

const bestPractice = [
  {
    title: '零配置运行',
    img: FrameWorkConfigSVG,
    href: '/tutorials/first-app/c01-start',
    desc: '直接启动你的应用，Modern.js 来管理其他的一切',
  },
  {
    img: UnitySVG,
    title: '基于文件的路由',
    href: '/guides/basic-features/routes',
    desc: '页面的自动路由，并支持代码拆分',
  },
  {
    title: '丰富的 CSS 解决方案',
    img: CssFileSVG,
    href: '/guides/basic-features/css/css-in-js',
    desc: '支持 Less、Sass、CSS Module、TailwindCSS',
  },
  {
    title: '数据获取',
    img: DynamicSVG,
    href: '/guides/basic-features/data-fetch',
    desc: '在组件中获取应用数据，Modern.js 会自动并发优化，支持 SSR',
  },
  {
    title: '多种渲染模式',
    img: HTMLSVG,
    href: '/guides/advanced-features/ssr',
    desc: '使用 SSR、SSG、SPR 来优化应用',
  },
  {
    title: '一体化 BFF 开发',
    img: APISVG,
    href: '/guides/advanced-features/bff/function',
    desc: '内置 BFF 支持，像调用函数一样请求 BFF 接口',
  },
  {
    title: '全量 ESLint 规则集',
    img: EditorSVG,
    href: '/guides/advanced-features/eslint',
    desc: '完备的 ESLint 规则，自动规范代码',
  },
  {
    title: '单元测试、集成测试',
    img: TestSVG,
    href: '/guides/advanced-features/testing',
    desc: '容器、组件、接口全功能测试支持',
  },
];

const flowCards = [
  {
    title: '搭建',
    img: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/modern-js-landing-pics.003.jpeg',
    href: '/guides/get-started/quick-start',
    top: 53,
  },
  {
    title: '编码',
    img: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/modern-js-landing-pics.004.jpeg',
    href: '/tutorials/first-app/c03-ide/3.1-setting-up',
    top: 120,
  },
  {
    title: '调试',
    href: '/guides/basic-features/mock',
    top: 423,
  },
  {
    title: '测试',
    href: '/guides/advanced-features/testing',
    top: 490,
  },
  {
    title: '构建',
    img: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/modern-js-landing-pics.005.jpeg',
    href: '/apis/app/commands/build',
    top: 545,
  },
  {
    title: '运行',
    img: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/modern-js-landing-pics.007.jpeg',
    href: '/apis/app/commands/start',
    top: 610,
  },
];

const HomepageHeader = () => (
  <div className={styles['homepage-header']}>
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <img
        src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/modern-logo.svg?url"
        className={styles.logo}
      />
      <h1 className={styles.title}>现代 Web 工程体系</h1>
      <div className={styles.buttons}>
        <a
          href={withBase('/tutorials/foundations/introduction')}
          className={styles.start}
        >
          介绍{' '}
          <img
            width="20"
            height="20"
            className={styles['start-arrow']}
            src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/right-arrow.svg?url"
          />
        </a>
        <a
          href={withBase('/guides/get-started/quick-start')}
          className={styles['doc-btn']}
        >
          快速开始
        </a>
        <a
          href={withBase('/guides/get-started/quick-start')}
          className={styles['doc-btn']}
        >
          文档
        </a>
      </div>
    </header>
  </div>
);

const renderFlowCards = cards => {
  const isWeb = window.innerWidth > 1100;
  const flowLineImg = isWeb
    ? 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/flow-line-line.png'
    : 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/flow-line-mobile.png';
  let top1 = 53;
  let top2 = 120;
  const distance = 530;
  const renderedWebCards = cards.map((card, cardIndex) => {
    if (cardIndex % 2 !== 0) {
      const top = top2;
      top2 += distance;
      return (
        <FlowCard
          key={cardIndex}
          cardStyle={{
            right: 0,
            top: `${card.top}px`,
            textDecoration: 'none',
          }}
          direction="left"
          title={card.title}
          desc={card.desc}
          img={card.img}
          href={card.href}
        />
      );
    } else {
      const top = top1;
      top1 += distance;
      return (
        <FlowCard
          key={cardIndex}
          cardStyle={{
            left: 0,
            top: `${card.top}px`,
            textDecoration: 'none',
          }}
          direction="right"
          title={card.title}
          desc={card.desc}
          img={card.img}
          href={card.href}
        />
      );
    }
  });

  const renderedMobileCards = cards.map((card, cardIndex) => {
    const left = 53;
    const top = 10;
    // const distance = cardIndex * 60;
    const distance = cardIndex * 65;
    return (
      <FlowCard
        cardStyle={{
          top: `calc(${top}px + ${distance}vw)`,
          // left: `${left}px`,
        }}
        key={cardIndex}
        title={card.title}
        desc={card.desc}
        img={card.img}
      />
    );
  });
  return (
    <div className={styles.flowContainer}>
      {isWeb && (
        <img
          className={`${styles.flowLine} ${isWeb ? '' : styles.flowLineMobile}`}
          src={flowLineImg}
          style={{
            width: '1px',
          }}
          alt="flow line"
        />
      )}
      {isWeb ? renderedWebCards : renderedMobileCards}
    </div>
  );
};

const renderContentCards = cards =>
  cards.map((card, cardIndex) => (
    <ContentCard
      key={cardIndex}
      title={card.title}
      desc={card.desc}
      img={card.img}
      href={card.href}
    />
  ));

function initPageStyle() {
  if (typeof window !== 'undefined') {
    document.documentElement.classList.add('dark');
    const navDom = document.querySelector(
      '.dark .modern-doc-nav',
    ) as HTMLDivElement;
    const appearanceDom = document.querySelector(
      '.modern-doc-appearance',
    ) as HTMLDivElement;
    if (navDom) {
      navDom.style.backgroundColor = '#000';
    }
    if (appearanceDom) {
      appearanceDom.style.display = 'none';
    }
    return () => {
      if (navDom) {
        navDom.style.backgroundColor = '';
      }
      if (appearanceDom) {
        appearanceDom.style.display = 'block';
      }
    };
  }
}

export default function Home() {
  const bestPraticeCards = renderContentCards(bestPractice);
  let count = 0;
  useEffect(() => {
    const restore = initPageStyle();
    return () => {
      restore?.();
    };
  });
  return (
    <div>
      <HomepageHeader />
      <main className={styles['homepage-main']}>
        <Featurelayout>
          <SecondaryTitle seqNum={++count}>极致的开发者体验</SecondaryTitle>
          <div className={styles.cardContainer}>{bestPraticeCards}</div>
        </Featurelayout>
        <Featurelayout>
          <SecondaryTitle seqNum={++count}>提供 Web 开发全流程</SecondaryTitle>
          <NoSSR>{renderFlowCards(flowCards)}</NoSSR>
        </Featurelayout>
        <QuickStartCard />
        <Footer />
      </main>
    </div>
  );
}
/* eslint-enable */
