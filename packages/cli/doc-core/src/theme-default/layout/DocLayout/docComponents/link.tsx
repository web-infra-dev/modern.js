import { ComponentProps } from 'react';
import styles from './index.module.scss';

export const A = (props: ComponentProps<'a'>) => {
  return <a {...props} className={`${styles.link} ${props.className}`} />;
};
