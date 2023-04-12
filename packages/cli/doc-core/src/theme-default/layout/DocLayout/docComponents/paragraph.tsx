import { ComponentProps } from 'react';
import styles from './index.module.scss';

export const P = (props: ComponentProps<'p'>) => {
  return <p {...props} className="my-4 leading-7" />;
};

export const Blockquote = (props: ComponentProps<'blockquote'>) => {
  return (
    <blockquote
      {...props}
      className={`border-l-2 border-solid border-divider pl-4 my-6 transition-colors duration-500 ${styles.blockquote}`}
    />
  );
};

export const Strong = (props: ComponentProps<'strong'>) => {
  return <strong {...props} className="font-semibold" />;
};
