import { useShowcases } from './useShowcases';
import styles from './index.module.scss';

const getDomain = (url: string) => new URL(url).hostname;

export const ShowcaseList = () => {
  const showcases = useShowcases();

  return (
    <div className={styles.wrapper}>
      {showcases.map(item => {
        return (
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            className={styles.card}
          >
            <img src={item.preview} className={styles.preview} />
            <div className={styles.bottom}>
              <div className={styles.name}>{item.name}</div>
              <div className={styles.domain}>{getDomain(item.url)}</div>
            </div>
          </a>
        );
      })}
    </div>
  );
};
