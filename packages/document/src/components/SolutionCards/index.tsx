import clsx from 'clsx';
import styles from './index.module.scss';

type Card = {
  link: string;
  title: string;
  description: string;
};

export const SolutionCards = ({ cards }: { cards: Card[] }) => {
  const classNames = [styles.card1, styles.card2, styles.card3];
  const renderCards = () =>
    cards.map((card, index) => (
      <a
        key={card.title}
        href={card.link}
        className={clsx([
          styles.card,
          classNames[index],
          cards.length === 2 ? styles.twoCards : '',
        ])}
        target="_blank"
      >
        <div className={styles.title}>{card.title}</div>
        <div className={styles.description}>{card.description}</div>
      </a>
    ));

  return <div className={styles.root}>{renderCards()}</div>;
};
