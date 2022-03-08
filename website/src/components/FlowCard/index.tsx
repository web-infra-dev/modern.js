import React from 'react';
import Link from '@docusaurus/Link';
import styles from './index.module.css';

export interface FlowCardProps {
  cardStyle?: Record<string, string | number>;
  title: string;
  desc: string;
  img: string;
  href?: string;
  direction: string;
}

const FlowCard: React.FC<FlowCardProps> = ({
  img,
  title,
  cardStyle,
  href,
  direction,
}) => (
  <Link className={styles.card} style={cardStyle} to={href}>
    <span className={styles.title} style={{ marginBottom: '16px' }}>
      {title}
    </span>
    {direction === 'right' && (
      <img
        className={styles.leftDot}
        src="/img/homepage/flow/right-dot.png"
        alt="decoration"
      />
    )}
    {direction === 'left' && (
      <img
        className={styles.rightDot}
        src="/img/homepage/flow/left-dot.png"
        alt="decoration"
      />
    )}
    {img && <img className={styles.icon} src={img} alt="img" />}
  </Link>
);

export default FlowCard;
