import React, { ComponentType, SVGProps } from 'react';
import cl from 'classnames';
import { withBase } from '@modern-js/doc-tools/runtime';
import styles from './index.module.scss';

export interface ContentCardProps {
  title: string;
  desc?: string;
  img?: string | ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
}

const ContentCard: React.FC<ContentCardProps> = ({ title, desc, href }) => (
  <a
    href={withBase(href)}
    style={{ textDecoration: 'none' }}
    className={cl(styles.card)}
  >
    <span className={styles.title}>{title}</span>
    <span className={styles.desc}>{desc}</span>
  </a>
);

export default ContentCard;
