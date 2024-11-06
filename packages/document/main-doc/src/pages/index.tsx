import clsx from 'clsx';
import { useEffect } from 'react';
import { Helmet, useLocation } from 'rspress/runtime';
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
      href: useUrl('/guides/basic-features/routes'),
      desc: t('featureDesc3'),
    },
    {
      id: 'feature4',
      title: t('feature4'),
      href: useUrl('/guides/advanced-features/ssr'),
      desc: t('featureDesc4'),
    },
    {
      id: 'feature5',
      title: t('feature5'),
      href: useUrl('/guides/basic-features/css'),
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
      <Helmet>
        <html className="dark" />
        <script>window.MODERN_THEME = 'dark';</script>
        <style type="text/css">{`
          .rspress-doc-appearance {
            display: none!important;
          }
        `}</style>
      </Helmet>
      <HomepageHeader />
      <main className={styles['homepage-main']}>
        <FeatureLayout>
          <SecondaryTitle>Features</SecondaryTitle>
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

        <FeatureLayout>
          <h1
            className={clsx([styles.title, styles.titleGradient])}
            style={{ textAlign: 'left', marginBottom: 32 }}
          >
            <div>{t('secondSlogan1')}</div>
            <div>{t('secondSlogan2')}</div>
          </h1>
        </FeatureLayout>

        <Footer />
      </main>
    </div>
  );
}
