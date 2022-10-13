import React from 'react';
import SecondaryTitle from '../SecondaryTitle';
import ListCard, { ICardProps } from '../ListCard';
import styles from './index.module.css';

export interface IFeaturesProps {
  title: string;
  features: ICardProps[];
}

const Features: React.FC<IFeaturesProps> = ({ title, features }) => {
  const renderedCards = features.map(card => (
    <ListCard
      key={card.icon}
      desc={card.desc}
      icon={card.icon}
      href={card.href}
    />
  ));
  return (
    <div className={styles.features}>
      <SecondaryTitle seqNum={1}>{title}</SecondaryTitle>
      <div className={styles['card-list']}>{renderedCards}</div>
    </div>
  );
};

export default Features;
