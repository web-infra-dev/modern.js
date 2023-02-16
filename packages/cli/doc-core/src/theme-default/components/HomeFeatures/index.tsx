import styles from './index.module.scss';
import { usePageData } from '@/runtime';

const PRESET_COUNT = [2, 3, 4];

const getGridClass = (count?: number): string => {
  if (!count) {
    return '';
  } else if (PRESET_COUNT.includes(count)) {
    return `grid-${12 / count}`;
  } else if (count % 3 === 0) {
    return 'grid-4';
  } else if (count % 2 === 0) {
    return 'grid-6';
  }
  return '';
};

export function HomeFeature() {
  const { frontmatter } = usePageData();
  const features = frontmatter?.features;
  const gridClass = getGridClass(features?.length);

  return (
    <div
      className="max-w-1152px overflow-hidden"
      m="auto"
      flex="~ wrap"
      justify="between"
    >
      {features?.map(feature => {
        const { icon, title, details } = feature;
        return (
          <div
            key={title}
            border="rounded-md"
            p="b-4 lg:l-0"
            className={`${gridClass ? styles[gridClass] : 'w-full'}`}
          >
            <div p="2" className="h-full">
              <article
                key={title}
                h="full"
                p="8"
                className={styles.featureCard}
                border="rounded-4xl transparent"
              >
                <div className="flex-center">
                  <div className="w-12 h-12 text-3xl text-center">{icon}</div>
                </div>
                <h2 font="bold" text="center">
                  {title}
                </h2>
                <p p="t-2" text="sm text-2" font="medium" className="leading-6">
                  {details}
                </p>
              </article>
            </div>
          </div>
        );
      })}
    </div>
  );
}
