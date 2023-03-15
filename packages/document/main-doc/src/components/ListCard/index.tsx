import React from 'react';
import { withBase } from '@modern-js/doc-tools/runtime';
import styles from './index.module.css';

export interface ICardProps {
  desc: string;
  icon: string;
  href: string;
}

const ListCard: React.FC<ICardProps> = ({ desc, icon: Icon, href }) => (
  <a
    className={styles.card}
    href={withBase(href)}
    style={{ textDecoration: 'none' }}
  >
    {typeof Icon === 'function' ? (
      <Icon className={styles.icon} />
    ) : (
      <img src={Icon} className={styles.icon} />
    )}
    <span className={styles.desc}>{desc}</span>
  </a>
);

export default ListCard;
