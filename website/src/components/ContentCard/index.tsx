import React, { ComponentType, SVGProps } from 'react';
import Link from '@docusaurus/Link';
import cl from 'classnames';
import styles from './index.module.css';

export interface ContentCardProps {
  title: string;
  desc?: string;
  img: string | ComponentType<SVGProps<SVGSVGElement>>;
  href?: string;
  isSwiper?: boolean;
}

const ContentCard: React.FC<ContentCardProps> = ({
  img: Icon,
  title,
  isSwiper = false,
  href,
}) => (
  <Link
    to={href}
    style={{ textDecoration: 'none' }}
    className={cl(styles.card, { [`${styles.swiperCard}`]: isSwiper })}>
    {typeof Icon === 'function' ? (
      <Icon className={styles.icon} width="48" height="48" />
    ) : (
      <img
        className={styles.icon}
        src={Icon}
        alt="img"
        width="48"
        height="48"
      />
    )}
    <span className={styles.title}>{title}</span>
  </Link>
);

export default ContentCard;
