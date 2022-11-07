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
        src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/right-dot.png"
        alt="decoration"
      />
    )}
    {direction === 'left' && (
      <img
        className={styles.rightDot}
        src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/left-dot.png"
        alt="decoration"
      />
    )}
    {img && <img className={styles.icon} src={img} alt="img" />}
  </Link>
);

export default FlowCard;
