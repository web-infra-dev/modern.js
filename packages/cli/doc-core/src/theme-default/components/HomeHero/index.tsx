import { Button } from '../Button';
import styles from './index.module.scss';
import { normalizeHref, usePageData } from '@/runtime';

const DEFAULT_HERO = {
  name: 'modern',
  text: 'modern ssg',
  tagline: 'modern ssg',
  actions: [],
  image: undefined,
};

export function HomeHero() {
  const { frontmatter } = usePageData();
  const hero = frontmatter?.hero || DEFAULT_HERO;
  const hasImage = hero.image !== undefined;
  return (
    <div className="m-auto pt-0 px-6 pb-12 sm:pt-10 sm:px-16 md:pt-20 md:px-16 md:pb-16">
      <div
        className={styles.mask}
        style={{
          left: hasImage ? '75%' : '50%',
        }}
      ></div>
      <div className="max-w-1152px m-auto flex flex-col md:flex-row">
        <div className="flex flex-col justify-center text-center max-w-592px sm:max-w-768px m-auto order-2 md:order-1">
          <h1 className="font-bold text-3xl sm:text-6xl md:text-7xl m-auto sm:m-4 md:m-0 md:pb-3 lg:pb-5 leading-tight z-10">
            <span className={styles.clip} style={{ lineHeight: '1.15' }}>
              {hero.name}
            </span>
          </h1>
          {hero.text?.length && (
            <p
              className={`mx-auto md:m-0 text-3xl sm:text-5xl md:text-6xl pb-2 font-bold z-10 max-w-392px ${
                hasImage ? 'sm:max-w-576px' : 'sm:max-w-768px'
              }`}
              style={{ lineHeight: '1.15' }}
            >
              {hero.text}
            </p>
          )}

          <p className="whitespace-pre-wrap pt-4 m-auto md:m-0 text-sm sm:tex-xl md:text-2xl text-text-2 font-medium z-10">
            {hero.tagline}
          </p>
          <div className="flex flex-wrap justify-center gap-3 m--1.5 pt-8 z-10">
            {hero.actions.map(action => (
              <div className="flex flex-shrink-0 p-1" key={action.link}>
                <Button
                  type="a"
                  text={action.text}
                  href={normalizeHref(action.link)}
                  theme={action.theme}
                />
              </div>
            ))}
          </div>
        </div>

        {hasImage ? (
          <div className="modern-doc-home-hero-image sm:max-w-60 sm:max-h-60 md:flex-center m-auto order-1 md:order-2 sm:flex md:none lg:flex">
            <img src={hero.image?.src} alt={hero.image?.alt} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
