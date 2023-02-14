import React, { useEffect } from 'react';
import clsx from 'clsx';
import { useLocation, Helmet } from '@modern-js/doc-tools/runtime';
import ContentCard from '../components/ContentCard';
import SecondaryTitle from '../components/SecondaryTitle';
import { FeatureLayout } from '../components/FeatureLayout';
import Footer from '../theme/Footer';
import { useI18n, useLang, useUrl } from '../i18n';
import styles from './index.module.scss';

const HomepageHeader = () => {
  const t = useI18n();
  return (
    <div className={styles.header}>
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <h1 className={styles.title}>
          <div>Inspire Creativity in</div>
          <div className={styles.titleGradient}>Modern Web Development</div>
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
              className={styles.startArrow}
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
    let navDom: HTMLDivElement;
    let appearanceDom: HTMLDivElement;
    requestAnimationFrame(() => {
      navDom = document.querySelector(
        '.dark .modern-doc-nav',
      ) as HTMLDivElement;
      appearanceDom = document.querySelector(
        '.modern-doc-appearance',
      ) as HTMLDivElement;
      if (navDom) {
        navDom.style.backgroundColor = '#000';
      }
      if (appearanceDom) {
        appearanceDom.style.display = 'none';
      }
    });

    return () => {
      document.documentElement.classList.remove('dark');

      if (navDom) {
        navDom.style.backgroundColor = '';
      }

      if (appearanceDom) {
        appearanceDom.style.display = 'flex';
      }
    };
  }
  return undefined;
}

export default function Home() {
  const t = useI18n();
  const { pathname } = useLocation();

  const features = [
    {
      title: t('feature1'),
      href: useUrl('/guides/basic-features/builder'),
      desc: t('featureDesc1'),
    },
    {
      title: t('feature2'),
      href: useUrl('/guides/advanced-features/bff/index'),
      desc: t('featureDesc2'),
    },
    {
      title: t('feature3'),
      href: useUrl('/guides/basic-features/routes'),
      desc: t('featureDesc3'),
    },
    {
      title: t('feature4'),
      href: useUrl('/guides/advanced-features/ssr'),
      desc: t('featureDesc4'),
    },
    {
      title: t('feature5'),
      href: useUrl('/guides/basic-features/css/css-in-js'),
      desc: t('featureDesc5'),
    },
    {
      title: t('feature6'),
      href: useUrl('/configure/app/usage'),
      desc: t('featureDesc6'),
    },
  ];

  const lang = useLang();
  const ecosystem = [
    {
      title: 'Modern.js Module',
      href: `https://modernjs.dev/module-tools${lang === 'en' ? '/en' : ''}`,
      desc: t('ecosystemDesc1'),
    },
    {
      title: 'Modern.js Builder',
      href: `https://modernjs.dev/builder${lang === 'en' ? '/en' : ''}`,
      desc: t('ecosystemDesc2'),
    },
    {
      title: 'Garfish',
      href: 'https://github.com/modern-js-dev/garfish',
      desc: t('ecosystemDesc3'),
    },
    {
      title: 'Reduck',
      href: 'https://github.com/modern-js-dev/reduck',
      desc: t('ecosystemDesc4'),
    },
  ];

  useEffect(() => {
    const restore = initPageStyle();
    return () => {
      restore?.();
    };
  }, [pathname]);

  return (
    <div>
      <Helmet>
        <html className="dark"></html>
      </Helmet>
      <HomepageHeader />
      <main className={styles['homepage-main']}>
        <FeatureLayout>
          <SecondaryTitle>{t('features')}</SecondaryTitle>
          <div className={styles.cardContainer}>
            {features.map((card, cardIndex) => (
              <ContentCard
                key={cardIndex}
                title={card.title}
                desc={card.desc}
                href={card.href}
              />
            ))}
          </div>
        </FeatureLayout>

        <FeatureLayout>
          <h1
            className={clsx([styles.title, styles.titleGradient])}
            style={{ textAlign: 'left', marginBottom: 32 }}
          >
            <div>{t('secondSlogan1')}</div>
            <div>{t('secondSlogan2')}</div>
          </h1>
        </FeatureLayout>

        <FeatureLayout>
          <SecondaryTitle>{t('ecosystem')}</SecondaryTitle>
          <div className={styles.cardContainer}>
            {ecosystem.map((card, cardIndex) => (
              <ContentCard
                key={cardIndex}
                title={card.title}
                desc={card.desc}
                href={card.href}
              />
            ))}
          </div>
        </FeatureLayout>
        <Footer />
      </main>
    </div>
  );
}
