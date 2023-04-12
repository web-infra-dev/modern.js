import clsx from 'clsx';
import { useLang, Helmet, useLocation } from '@modern-js/doc-tools/runtime';
import { useEffect } from 'react';
import ContentCard from '../components/ContentCard';
import SecondaryTitle from '../components/SecondaryTitle';
import { FeatureLayout } from '../components/FeatureLayout';
import Footer from '../components/Footer';
import { useI18n, useUrl } from '../i18n';
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
            href={useUrl('/guides/get-started/introduction')}
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

export default function Home() {
  const t = useI18n();
  const { pathname } = useLocation();
  useEffect(() => {
    window.MODERN_THEME = 'dark';
    return () => {
      window.MODERN_THEME = undefined;
    };
  }, [pathname]);

  const features = [
    {
      title: t('feature1'),
      href: useUrl('/guides/concept/builder'),
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
      href: useUrl('/guides/basic-features/css'),
      desc: t('featureDesc5'),
    },
    {
      title: t('feature6'),
      href: useUrl('/configure/app/usage'),
      desc: t('featureDesc6'),
    },
  ];

  const lang = useLang();
  const solutions = [
    {
      title: 'Modern.js Framework',
      href: useUrl('/guides/get-started/introduction'),
      desc: t('solutionsDesc1'),
    },
    {
      title: 'Modern.js Module',
      href: `https://modernjs.dev/module-tools${lang === 'en' ? '/en' : ''}`,
      desc: t('solutionsDesc2'),
    },
    {
      title: 'Modern.js Doc',
      href: `https://modernjs.dev/doc-tools${lang === 'en' ? '' : '/zh'}`,
      desc: t('solutionsDesc3'),
    },
    {
      title: 'Modern.js Builder',
      href: `https://modernjs.dev/builder${lang === 'en' ? '/en' : ''}`,
      desc: t('solutionsDesc4'),
    },
  ];

  return (
    <div>
      <Helmet>
        <html className="dark"></html>
        <script>window.MODERN_THEME = 'dark';</script>
        <style type="text/css">{`
          .modern-doc-appearance {
            display: none!important;
          }
        `}</style>
      </Helmet>
      <HomepageHeader />
      <main className={styles['homepage-main']}>
        <FeatureLayout>
          <SecondaryTitle>{t('solutions')}</SecondaryTitle>
          <div className={styles.cardContainer}>
            {solutions.map((card, cardIndex) => (
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
          <SecondaryTitle>Modern.js Framework</SecondaryTitle>
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
        <Footer />
      </main>
    </div>
  );
}
