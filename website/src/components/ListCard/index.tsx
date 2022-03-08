import React from 'react';
import styles from './index.module.css';
import Link from '@docusaurus/Link'

export interface ICardProps {
  desc: string;
  icon: string;
  href: string;
}

const ListCard: React.FC<ICardProps> = ({ desc, icon: Icon, href }) => {
  return (
    <Link className={styles.card} to={href} style={{textDecoration: 'none'}}>
      <Icon className={styles.icon} />
      <span className={styles.desc}>{desc}</span>
    </Link>
  )
};

export default ListCard;
