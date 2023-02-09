import React, { useEffect } from 'react';
import clsx from 'clsx';
import { useLocation } from '@modern-js/doc-tools/runtime';
import UnitySVG from '@site/static/img/features/unity.svg';
import DynamicSVG from '@site/static/img/features/dynamic.svg';
import APISVG from '@site/static/img/features/api.svg';
import HTMLSVG from '@site/static/img/features/html.svg';
import CssFileSVG from '@site/static/img/features/css-file.svg';
import FrameWorkConfigSVG from '@site/static/img/features/framework-config.svg';
import QuickStartCard from '../components/QuickStartCard';
import ContentCard from '../components/ContentCard';
import SecondaryTitle from '../components/SecondaryTitle';
import { FeatureLayout } from '../components/FeatureLayout';
import Footer from '../theme/Footer';
import { useI18n, useUrl } from '../i18n';
import styles from './index.module.scss';

const HomepageHeader = () => {
  const t = useI18n();
  return (
    <div className={styles.header}>
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <h1 className={styles.title}>
          <div>Building</div>
          <div className={styles.titleGradient}>Modern Web Application</div>
          <div>Without Limits</div>
        </h1>
        <div className={styles.buttons}>
          <a
            href={useUrl('/tutorials/foundations/introduction')}
            className={styles.leftButton}
          >
            {t('introduction')}
            <img
              width="20"
              height="20"
              className={styles['start-arrow']}
              src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/right-arrow.svg?url"
            />
          </a>
          <a
            href={useUrl('/guides/get-started/quick-start')}
            className={styles.rightButton}
          >
            {t('quickStart')}
          </a>
        </div>
      </header>
    </div>
  );
};

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
      document.documentElement.classList.remove('dark');

      if (navDom) {
        navDom.style.backgroundColor = '';
      }
      if (appearanceDom) {
        appearanceDom.style.display = 'block';
      }
    };
  }
  return undefined;
}

export default function Home() {
  let count = 0;

  const t = useI18n();
  const { pathname } = useLocation();

  const bestPractice = [
    {
      title: t('feature1'),
      img: FrameWorkConfigSVG,
      href: useUrl('/guides/basic-features/builder'),
      desc: t('featureDesc1'),
    },
    {
      img: UnitySVG,
      title: t('feature2'),
      href: useUrl('/guides/advanced-features/bff/index'),
      desc: t('featureDesc2'),
    },
    {
      title: t('feature3'),
      img: CssFileSVG,
      href: useUrl('/guides/basic-features/routes'),
      desc: t('featureDesc3'),
    },
    {
      title: t('feature4'),
      img: DynamicSVG,
      href: useUrl('/guides/advanced-features/ssr'),
      desc: t('featureDesc4'),
    },
    {
      title: t('feature5'),
      img: HTMLSVG,
      href: useUrl('/guides/basic-features/css/css-in-js'),
      desc: t('featureDesc5'),
    },
    {
      title: t('feature6'),
      img: APISVG,
      href: useUrl('/configure/app/usage'),
      desc: t('featureDesc6'),
    },
  ];

  const bestPracticeCards = bestPractice.map((card, cardIndex) => (
    <ContentCard
      key={cardIndex}
      title={card.title}
      desc={card.desc}
      img={card.img}
      href={card.href}
    />
  ));

  useEffect(() => {
    const restore = initPageStyle();
    return () => {
      restore?.();
    };
  }, [pathname]);

  return (
    <div>
      <HomepageHeader />
      <main className={styles['homepage-main']}>
        <FeatureLayout>
          <SecondaryTitle seqNum={++count}>{t('features')}</SecondaryTitle>
          <div className={styles.cardContainer}>{bestPracticeCards}</div>
        </FeatureLayout>
        <QuickStartCard />
        <Footer />
      </main>
    </div>
  );
}
