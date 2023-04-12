import { ComponentProps } from 'react';
import styles from './index.module.scss';

export const H1 = (props: ComponentProps<'h1'>) => {
  return (
    <h1
      {...props}
      className={`text-3xl mb-10 leading-10 tracking-tight ${styles.title}`}
    />
  );
};

export const H2 = (props: ComponentProps<'h2'>) => {
  return (
    <h2
      {...props}
      className={`mt-14 mb-6 text-2xl tracking-tight ${styles.title}`}
    />
  );
};

export const H3 = (props: ComponentProps<'h3'>) => {
  return (
    <h3 {...props} className={`mt-10 mb-2 leading-7 text-xl ${styles.title}`} />
  );
};

export const H4 = (props: ComponentProps<'h4'>) => {
  return (
    <h4 {...props} className={`mt-8 leading-6 text-base ${styles.title}`} />
  );
};

export const H5 = (props: ComponentProps<'h5'>) => {
  return <h5 {...props} className={styles.title} />;
};

export const H6 = (props: ComponentProps<'h6'>) => {
  return <h6 {...props} className={styles.title} />;
};
