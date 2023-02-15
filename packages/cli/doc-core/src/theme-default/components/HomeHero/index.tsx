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
    <div
      m="auto"
      p="t-12 x-6 b-12 sm:t-0 sm:x-8 sm:x-16 md:t-20 md:x-16 md:b-16"
    >
      <div className={styles.mask}></div>
      <div className="max-w-1152px" m="auto" flex="~ col md:row">
        <div
          order="2 md:1"
          flex="~ col"
          className={`max-w-592px ${
            hasImage ? 'm-0 text-left' : 'm-auto text-center'
          }`}
        >
          <h1
            font="bold"
            text="3xl sm:5xl md:6xl"
            m="auto md:0"
            p="md:b-3 lg:b-5"
            className="max-w-392px sm:max-w-576px"
            z="10"
          >
            <span className={styles.clip}>{hero.name}</span>
          </h1>
          {hero.text?.length && (
            <p
              m="x-auto md:0"
              text="3xl sm:5xl md:6xl"
              font="bold"
              p="b-2"
              className="max-w-392px sm:max-w-576px"
              z="10"
            >
              {hero.text}
            </p>
          )}

          <p
            p="t-4"
            m="auto md:0"
            text="sm sm:xl md:2xl text-2"
            font="medium"
            className="whitespace-pre-wrap max-w-392px sm:max-w-576px"
            z="10"
          >
            {hero.tagline}
          </p>
          <div
            flex="~ wrap"
            className={`${hasImage ? 'justify-start' : 'justify-center gap-3'}`}
            m="-1.5"
            p="t-8"
            z="10"
          >
            {hero.actions.map(action => (
              <div p="1" flex="shrink-0" key={action.link}>
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
          <div
            w="sm:max-60"
            h="sm:max-60"
            flex="md:center"
            m="auto"
            order="1 md:2"
            display="flex sm:flex md:none lg:flex"
          >
            <img src={hero.image?.src} alt={hero.image?.alt} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
