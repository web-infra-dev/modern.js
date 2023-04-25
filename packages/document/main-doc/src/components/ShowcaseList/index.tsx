import { useShowcases } from './useShowcases';
import styles from './index.module.scss';

const getDomain = (url: string) => new URL(url).hostname;

const TYPE_MAP = {
  doc: 'Modern.js Doc',
  module: 'Modern.js Module',
  builder: 'Modern.js Builder',
  framework: 'Modern.js Framework',
};

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
              <div className={styles.name}>
                {item.name}
                <span className={styles.type}>{TYPE_MAP[item.type]}</span>
              </div>
              <div className={styles.domain}>{getDomain(item.url)}</div>
            </div>
          </a>
        );
      })}
    </div>
  );
};
