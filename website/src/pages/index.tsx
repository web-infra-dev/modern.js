/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
// TODO: enable eslint
import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import JavascriptSVG from '@site/static/img/features/javascript.svg';
import BrowserSVG from '@site/static/img/features/browser.svg';
import cl from 'classnames';
import UnitySVG from '@site/static/img/features/unity.svg';
import ServerLessSVG from '@site/static/img/features/serverless.svg';
import FrameWorkSVG from '@site/static/img/features/framework.svg';
import DeveloperSVG from '@site/static/img/features/developer.svg';
import AISVG from '@site/static/img/features/ai.svg';
import CloudSVG from '@site/static/img/features/cloud.svg';
import BlocksSVG from '@site/static/img/features/blocks.svg';
import UrltSVG from '@site/static/img/features/url.svg';
import DynamicSVG from '@site/static/img/features/dynamic.svg';
import APISVG from '@site/static/img/features/api.svg';
import AppSVG from '@site/static/img/features/app.svg';
import WebServerSVG from '@site/static/img/features/web-server.svg';
import HTMLSVG from '@site/static/img/features/html.svg';
import CodingBackEndSVG from '@site/static/img/features/coding-backend.svg';
import ServerNetworkSVG from '@site/static/img/features/server-network.svg';
import FrameworksSVG from '@site/static/img/features/frameworks.svg';
import CustomizeSVG from '@site/static/img/features/customize.svg';
import TrinitySVG from '@site/static/img/features/trinity.svg';
import CompilerSVG from '@site/static/img/features/compiler.svg';
import CssFileSVG from '@site/static/img/features/css-file.svg';
import FrameWorkConfigSVG from '@site/static/img/features/framework-config.svg';
import TestSVG from '@site/static/img/features/test.svg';
import EditorSVG from '@site/static/img/features/editor.svg';
import ProductSVG from '@site/static/img/features/product.svg';
import VisualSVG from '@site/static/img/features/visual.svg';
import MonorepoSVG from '@site/static/img/features/monorepo.svg';
import VideoCard from '../components/VideoCard';
import NavTabs from '../components/NavTabs';
import QuickStartCard from '../components/QuickStartCard';
import FlowCard from '../components/FlowCard';
import ContentCard, { ContentCardProps } from '../components/ContentCard';
import SecondaryTitle from '../components/SecondaryTitle';
import { Featurelayout } from '../components/FeatureLayout';
import Features from '../components/HomePageFeatures';
import styles from './index.module.css';
import 'swiper/css';

const headerTabs = [
  {
    tabName: '移动页面',
    href: '/docs/start/mobile',
  },
  {
    tabName: '响应式网站',
    href: '/docs/start/website',
  },
  {
    tabName: '中后台',
    href: '/docs/start/admin',
  },
  {
    tabName: '微前端',
    href: '/docs/start/micro-frontend',
  },
  {
    tabName: '桌面应用',
    href: '/docs/start/electron',
  },
  {
    tabName: 'API服务',
    href: '/docs/start/api-service',
  },
  {
    tabName: '工具库',
    href: '/docs/start/library',
  },
  {
    tabName: 'UI组件',
    href: '/docs/start/component',
  },
];

const features = [
  {
    icon: BrowserSVG,
    desc: '客户端为中心的 Web 框架',
    href: '/docs/guides/tutorials/c01-getting-started/1.2-minimal-mwa',
  },
  {
    icon: JavascriptSVG,
    desc: 'JS 为中心、FP 优先的 GUI 软件研发技术栈',
    href: '/docs/guides/tutorials/c07-app-entry/7.1-intro',
  },
  {
    icon: UnitySVG,
    desc: '从「前后端分离」到「前后端一体化」',
    href: '/docs/guides/features/server-side/web/routes',
  },
  {
    icon: ServerLessSVG,
    desc: 'Serverless 优先',
    href: '/docs/guides/tutorials/c09-bff/9.1-serverless',
  },
  {
    icon: FrameWorkSVG,
    desc: '对 Web 应用开发的充分抽象',
    href: '/docs/guides/tutorials/c01-getting-started/1.2-minimal-mwa',
  },
  {
    icon: DeveloperSVG,
    desc: 'DX 和 UX 同时最大化',
    href: '/docs/guides/usages/compatibility',
  },
  {
    icon: AISVG,
    desc: '智能化',
    href: '/docs/guides/tutorials/c03-ide/3.2-hints-in-ide',
  },
  {
    icon: CloudSVG,
    desc: '平台化',
    href: '/coming-soon',
  },
  {
    icon: BlocksSVG,
    desc: '低码化',
    href: '/coming-soon',
  },
];
const universalGroups: ContentCardProps[] = [
  {
    title: '同时支持「服务器端路由」和「客户端路由」',
    img: UrltSVG,
    href: '/docs/guides/tutorials/c07-app-entry/7.1-intro',
  },
  {
    title: 'Serverless 范式的「动静一体 Web」',
    img: DynamicSVG,
    href: '/docs/guides/features/server-side/web/ssg',
  },
  {
    title: '低门槛、全功能、一体化的「BFF」开发',
    img: APISVG,
    href: '/docs/guides/tutorials/c09-bff/9.2-enable-bff',
  },
  {
    title: '不同类型的应用',
    img: AppSVG,
    href: '/docs/guides/features/electron/basic',
  },
];

const feBe: ContentCardProps[] = [
  {
    title: '自带 Web Server',
    img: WebServerSVG,
    href: '/docs/guides/tutorials/c01-getting-started/1.4-enable-ssr',
  },
  {
    title: '一体化 SSR/SPR/SSG',
    img: HTMLSVG,
    href: '/docs/guides/features/server-side/web/ssr-and-spr',
  },
  {
    title: '一体化 BFF',
    img: CodingBackEndSVG,
    href: '/docs/guides/features/server-side/bff/function',
  },
  {
    title: '为 Serverless 优化',
    img: ServerNetworkSVG,
    href: '/coming-soon',
  },
  {
    title: '多框架',
    img: FrameworksSVG,
    href: '/docs/guides/features/server-side/bff/frameworks',
  },
  {
    title: '定制 Web Server',
    img: CustomizeSVG,
    href: '/docs/guides/features/server-side/web/web-server',
  },
  {
    title: '三位一体',
    img: TrinitySVG,
    href: '/docs/start/api-service',
  },
];

const flowCards = [
  {
    title: '搭建',
    img: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/modern-js-landing-pics.003.jpeg',
    href: '/docs/guides/tutorials/c02-generator-and-studio/2.1-generator',
    top: 53,
  },
  {
    title: '编码',
    img: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/modern-js-landing-pics.004.jpeg',
    href: '/docs/guides/tutorials/c03-ide/3.1-setting-up',
    top: 120,
  },
  {
    title: '测试',
    href: '/docs/guides/tutorials/c06-css-and-component/6.6-testing',
    top: 423,
  },
  {
    title: '调试',
    href: '/docs/guides/usages/debug/proxy-and-mock',
    top: 490,
  },
  {
    title: '构建',
    img: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/modern-js-landing-pics.005.jpeg',
    href: '/docs/apis/commands/module/build',
    top: 545,
  },
  {
    title: '运行',
    img: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/modern-js-landing-pics.007.jpeg',
    href: '/docs/guides/usages/compatibility',
    top: 610,
  },
  {
    title: '部署',
    img: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js//modern-js-landing-pics.008.jpeg',
    href: '/coming-soon',
    top: 915,
  },
];

const bestPractice = [
  {
    title: 'Post-Webpack Era',
    img: CompilerSVG,
    href: '/docs/guides/usages/debug/unbundled',
  },
  {
    title: 'CSS 解决方案',
    img: CssFileSVG,
    href: '/docs/guides/tutorials/c06-css-and-component/6.1-css-in-js',
  },
  {
    title: '默认零配置、样板文件最小化',
    img: FrameWorkConfigSVG,
    href: '/docs/guides/tutorials/c01-getting-started/1.2-minimal-mwa',
  },
  {
    title: '单元测试、集成测试',
    img: TestSVG,
    href: '/docs/guides/tutorials/c11-container/11.4-testing',
  },
  {
    title: 'ESLint 全量规则集、IDE 支持',
    img: EditorSVG,
    href: '/docs/guides/tutorials/c03-ide/3.1-setting-up',
  },
  {
    title: '模块构建产物规范',
    img: ProductSVG,
    href: '/docs/guides/features/modules/build',
  },
  {
    title: 'Visual Testing',
    img: VisualSVG,
    href: '/docs/guides/features/modules/storybook',
  },
  {
    title: 'Monorepo',
    img: MonorepoSVG,
    href: '/docs/guides/features/monorepo/intro',
  },
];

const HomepageHeader = () => (
  <div className={styles['homepage-header']}>
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <img
        src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/modern-logo.svg"
        className={styles.logo}
      />
      <h1 className={styles.title}>现代 Web 工程体系</h1>
      <div className={styles.buttons}>
        <Link
          className={styles.start}
          to="https://zhuanlan.zhihu.com/p/426707646">
          介绍{' '}
          <img
            width="20"
            height="20"
            className={styles['start-arrow']}
            src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/right-arrow.svg"
          />
        </Link>
        <Link className={styles['doc-btn']} to="/docs/start/mobile">
          快速开始{' '}
        </Link>
        <Link className={styles['doc-btn']} to="/docs/guides/overview">
          文档
        </Link>
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

const renderCards = cards => {
  const isWeb = window.innerWidth > 966;
  if (isWeb) {
    return (
      <div className={styles.cardContainer}>{renderContentCards(cards)}</div>
    );
  } else {
    return (
      <Swiper slidesPerView={1.65} spaceBetween={18} className={styles.swiper}>
        {renderSwiperContentCards(cards)}
      </Swiper>
    );
  }
};

const renderSwiperContentCards = cards =>
  cards.map(({ title, desc, img, href }, index) => (
    <SwiperSlide key={title + index}>
      <ContentCard
        title={title}
        desc={desc}
        img={img}
        href={href}
        isSwiper={true}
      />
    </SwiperSlide>
  ));

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

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  const renderedUniVerals = renderSwiperContentCards(universalGroups);
  const bestPraticeCards = renderContentCards(bestPractice);
  let count = 1;
  return (
    <Layout
      // title={`${siteConfig.title}`}
      description="The meta-framework suite designed from scratch for frontend-focused modern web development.">
      <HomepageHeader />
      <NavTabs tabs={headerTabs} />
      <main className={styles['homepage-main']}>
        <Features title="支持现代 Web 开发范式" features={features} />
        <Featurelayout>
          <SecondaryTitle seqNum={++count}>现代 Web 应用（MWA）</SecondaryTitle>
          <h3 className={styles['section-title']}>
            从 Universal JS 到 Universal App
          </h3>
          <div className={styles['swiper-container']}>
            <Swiper
              slidesPerView={1.65}
              spaceBetween={18}
              className={styles.swiper}
              breakpoints={{
                1023: {
                  slidesPerView: 4,
                },
                800: {
                  slidesPerView: 3,
                },
                200: {
                  slidesPerView: 1.65,
                },
              }}>
              {renderedUniVerals}
            </Swiper>
          </div>
          <h3 className={styles['section-title']}>前后端一体化</h3>
          <div className={styles['swiper-container']}>
            <BrowserOnly>{() => renderCards(feBe)}</BrowserOnly>
          </div>
          <h3 className={styles['section-title']}>应用架构</h3>
          <Link
            to="/docs/guides/tutorials/c10-model/10.1-application-architecture"
            className={cl(styles.singleImgWrap, styles.singleImgCard)}
            style={{ marginTop: '16px' }}>
            <img
              className={styles.singleImg}
              src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/framework.jpeg"
              alt="framework"
            />
          </Link>
          <h3 className={styles['section-title']}>Runtime API 标准库</h3>
          <Link
            to="/docs/guides/features/modules/use-runtime-api"
            className={cl(styles.singleImgWrap, styles.singleImgCard)}
            style={{ marginTop: '16px' }}>
            <img
              className={styles.singleImg}
              src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/runtime-api.jpeg"
              alt="framework"
            />
          </Link>
        </Featurelayout>
        <Featurelayout>
          <SecondaryTitle seqNum={++count}>内置工程最佳实践</SecondaryTitle>
          <div className={styles.cardContainer}>{bestPraticeCards}</div>
        </Featurelayout>
        <Featurelayout>
          <SecondaryTitle seqNum={++count}>包含 Web 开发全流程</SecondaryTitle>
          <BrowserOnly>{() => renderFlowCards(flowCards)}</BrowserOnly>
        </Featurelayout>
        <Featurelayout>
          <SecondaryTitle seqNum={++count}>提供工程标准体系</SecondaryTitle>
          <VideoCard
            title="三大工程类型"
            imgUrl={
              'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js//modern-js-landing-pics.009.jpeg'
            }
            detailUrl="/docs/apis/hooks/overview"
          />
          <VideoCard
            title="应用（MWA）"
            direction="right"
            imgUrl={
              'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/modern-js-landing-pics.010.jpeg'
            }
            detailUrl="/docs/guides/tutorials/c02-generator-and-studio/2.1-generator"
          />
          <VideoCard
            title="模块（Module）"
            imgUrl={
              'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/modern-js-landing-pics.011.jpeg'
            }
            detailUrl="/docs/guides/features/modules/intro"
          />
          <VideoCard
            title="Monorepo"
            direction="right"
            imgUrl={
              'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/modern-js-landing-pics.006.jpeg'
            }
            detailUrl="/docs/guides/features/monorepo/intro"
          />
        </Featurelayout>
        <Featurelayout>
          <SecondaryTitle seqNum={++count}>鼓励定制工程方案</SecondaryTitle>
          <a
            className={styles.singleImgWrap}
            href="/docs/guides/features/custom/framework-plugin/abstract">
            <img
              className={styles.singleImg}
              src={
                'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/modern-js-landing-pics.012.jpeg'
              }
              alt=""
            />
          </a>
        </Featurelayout>
        <QuickStartCard />
      </main>
    </Layout>
  );
}
/* eslint-enable */
