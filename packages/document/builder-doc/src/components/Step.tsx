import { useUrl } from '../utils';
import styles from './Step.module.scss';

const Step = (props: { href: string; title: string; description: string }) => {
  return (
    <a className={styles.step} href={useUrl(props.href)}>
      <p className={styles.title}>{props.title}</p>
      <p className={styles.description}>{props.description}</p>
    </a>
  );
};

export default Step;
