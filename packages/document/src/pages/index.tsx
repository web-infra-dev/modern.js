import { Head, useLocation } from '@rspress/core/runtime';
import clsx from 'clsx';
import { useEffect } from 'react';
import ContentCard from '../components/ContentCard';
import { FeatureLayout } from '../components/FeatureLayout';
import Footer from '../components/Footer';
import SecondaryTitle from '../components/SecondaryTitle';
import { useI18n, useUrl } from '../i18n';
import styles from './index.module.scss';

const HomepageHeader = () => {
  const t = useI18n();
  return (
    <div className={styles.header}>
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className={styles.mask} />
        <h1 className={styles.title}>
          <span className={clsx([styles.titleGradient, styles.mainTitle])}>
            Modern.js 3.0
          </span>
          <div>{t('slogan')}</div>
        </h1>
        <div className={styles.buttons}>
          <a
            href={useUrl('/guides/get-started/introduction')}
            className={styles.leftButton}
          >
            {t('introduction')}
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
      id: 'feature1',
      title: t('feature1'),
      href: useUrl('/guides/concept/builder'),
      desc: t('featureDesc1'),
    },
    {
      id: 'feature2',
      title: t('feature2'),
      href: useUrl('/guides/advanced-features/bff/index'),
      desc: t('featureDesc2'),
    },
    {
      id: 'feature3',
      title: t('feature3'),
      href: useUrl('/guides/basic-features/routes/routes'),
      desc: t('featureDesc3'),
    },
    {
      id: 'feature4',
      title: t('feature4'),
      href: useUrl('/guides/basic-features/render/ssr'),
      desc: t('featureDesc4'),
    },
    {
      id: 'feature5',
      title: t('feature5'),
      href: useUrl('/guides/basic-features/css/css'),
      desc: t('featureDesc5'),
    },
    {
      id: 'feature6',
      title: t('feature6'),
      href: useUrl('/configure/app/usage'),
      desc: t('featureDesc6'),
    },
  ];

  return (
    <div>
      <Head>
        <html className="dark" />
        <script>window.MODERN_THEME = 'dark';</script>
        <style type="text/css">{`
          .rspress-doc-appearance {
            display: none!important;
          }
        `}</style>
      </Head>
      <HomepageHeader />
      <main className={styles['homepage-main']}>
        <FeatureLayout>
          <div className={styles.cardContainer}>
            {features.map(card => (
              <ContentCard
                key={card.id}
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
