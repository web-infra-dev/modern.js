import styles from './index.module.scss';
import { usePageData } from '@/runtime';

const getGridClass = (count?: number): string => {
  if (!count) {
    return '';
  } else if (count === 2) {
    return 'grid2';
  } else if (count === 3) {
    return 'grid3';
  } else if (count % 3 === 0) {
    return 'grid4';
  } else if (count % 2 === 0) {
    return 'grid6';
  }
  return '';
};

export function HomeFeature() {
  const { frontmatter } = usePageData();
  const features = frontmatter?.features;
  const gridClass = getGridClass(features?.length);

  return (
    <div className="max-w-1152px" m="auto" flex="~ wrap" justify="between">
      {features?.map(feature => {
        const { icon, title, details } = feature;
        return (
          <div
            key={title}
            rounded="md"
            pr="0 md:4"
            pb="4"
            w="100%"
            className={`${gridClass ? styles[gridClass] : ''}`}
          >
            <article
              key={title}
              rounded="xl"
              h="100%"
              p="6"
              bg="bg-soft"
              border="~ bg-soft solid"
            >
              <div
                flex="center"
                mb="5"
                w="12"
                h="12"
                text="3xl"
                bg="gray-light-4 dark:bg-default"
                rounded="md"
              >
                {icon}
              </div>
              <h2 font="bold">{title}</h2>
              <p pt="2" text="sm text-2" font="medium" leading-6="">
                {details}
              </p>
            </article>
          </div>
        );
      })}
    </div>
  );
}
