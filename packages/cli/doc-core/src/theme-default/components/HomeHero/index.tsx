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
      p="t-12 x-6 b-12 sm:t-0 sm:x-8 sm:x-16 md:t-20 md:x-16 md:b-28"
    >
      <div className="max-w-1152px" m="auto" flex="~ col md:row">
        <div
          m="auto md:0"
          order="2 md:1"
          text="center md:left"
          flex="~ col lt-sm:c"
          className="max-w-592px"
        >
          <h1
            font="bold"
            text="3xl sm:5xl md:6xl"
            m="auto md:0"
            p="b-3"
            className="max-w-392px sm:max-w-576px"
          >
            <span className={styles.clip}>{hero.name}</span>
          </h1>
          <p
            m="x-auto md:0"
            text="3xl sm:5xl md:6xl"
            font="bold"
            className="max-w-392px sm:max-w-576px"
          >
            {hero.text}
          </p>
          <p
            p="t-4"
            m="auto md:0"
            text="sm sm:xl md:2xl text-2"
            font="medium"
            className="whitespace-pre-wrap max-w-392px sm:max-w-576px"
          >
            {hero.tagline}
          </p>
          <div flex="~ wrap" justify="center md:start" m="-1.5" p="t-8">
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
