import React from 'react';
import Link from '@docusaurus/Link';
import styles from './index.module.css';

export interface ICardProps {
  desc: string;
  icon: string;
  href: string;
}

const ListCard: React.FC<ICardProps> = ({ desc, icon: Icon, href }) => (
  <Link className={styles.card} to={href} style={{ textDecoration: 'none' }}>
    {typeof Icon === 'function' ? (
      <Icon className={styles.icon} />
    ) : (
      <img src={Icon} className={styles.icon} />
    )}
    <span className={styles.desc}>{desc}</span>
  </Link>
);

export default ListCard;
