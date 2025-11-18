import { withBase } from '@rspress/core/runtime';
import cl from 'classnames';
import type React from 'react';
import styles from './index.module.scss';

export interface ContentCardProps {
  title: string;
  desc?: string;
  href: string;
}

const ContentCard: React.FC<ContentCardProps> = ({ title, desc, href }) => (
  <a
    href={withBase(href)}
    target="_blank"
    style={{ textDecoration: 'none' }}
    className={cl(styles.card)}
  >
    <span className={styles.title}>{title}</span>
    <span className={styles.desc}>{desc}</span>
  </a>
);

export default ContentCard;
