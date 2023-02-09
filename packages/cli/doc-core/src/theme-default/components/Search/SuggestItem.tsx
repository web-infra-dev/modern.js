import FileSvg from './assets/file.svg';
import JumpSvg from './assets/jump.svg';
import HeaderSvg from './assets/header.svg';
import TitleSvg from './assets/title.svg';
import { MatchResultItem } from './logic/search';
import styles from './index.module.scss';
import { removeDomain } from './logic/util';
import { isProduction } from '@/runtime';

const ICON_MAP = {
  title: TitleSvg,
  header: HeaderSvg,
  content: FileSvg,
};

export function SuggestItem({
  suggestion,
  closeSearch,
  isCurrent,
  setCurrentSuggestionIndex,
  inCurrentDocIndex,
}: {
  suggestion: MatchResultItem;
  closeSearch: () => void;
  isCurrent: boolean;
  setCurrentSuggestionIndex: () => void;
  inCurrentDocIndex: boolean;
}) {
  const HitIcon = ICON_MAP[suggestion.type];
  const { query } = suggestion;
  const link =
    inCurrentDocIndex && !isProduction()
      ? removeDomain(suggestion.link)
      : suggestion.link;
  const renderHeaderMatch = () => {
    if (suggestion.type === 'header' || suggestion.type === 'title') {
      const { header, highlightIndex } = suggestion;
      const headerPrefix = header.slice(0, highlightIndex);
      const queryStr = header.slice(
        highlightIndex,
        highlightIndex + query.length,
      );
      const headerSuffix = header.slice(highlightIndex + query.length);
      return (
        <div font="medium">
          <span>{headerPrefix}</span>
          <span className={styles.mark}>{queryStr}</span>
          <span>{headerSuffix}</span>
        </div>
      );
    } else {
      return <div font="medium">{suggestion.header}</div>;
    }
  };
  const renderStatementMatch = () => {
    if (suggestion.type !== 'content') {
      return <div></div>;
    }
    const { highlightIndex, statement } = suggestion;
    const statementPrefix = statement.slice(0, highlightIndex);
    const queryStr = statement.slice(
      highlightIndex,
      highlightIndex + query.length,
    );
    const statementSuffix = statement.slice(highlightIndex + query.length);
    return (
      <div text="sm gray-light" w="full">
        <span>{statementPrefix}</span>
        <span className={styles.mark}>{queryStr}</span>
        <span>{statementSuffix}</span>
      </div>
    );
  };

  let hitContent = null;

  switch (suggestion.type) {
    case 'title':
    case 'header':
      hitContent = renderHeaderMatch();
      break;
    case 'content':
      hitContent = (
        <>
          {renderStatementMatch()}
          <p className={styles.titleForContent}>{suggestion.title}</p>
        </>
      );
      break;
    default:
      break;
  }

  return (
    <li
      key={suggestion.link}
      className={`${styles.suggestItem} ${isCurrent ? styles.current : ''}`}
      onMouseEnter={setCurrentSuggestionIndex}
    >
      <a
        href={link}
        onClick={e => {
          closeSearch();
          e.stopPropagation();
        }}
        target={inCurrentDocIndex ? '_self' : '_blank'}
      >
        <div className={styles.suggestItemContainer}>
          <div className={styles.hitIcon}>
            <HitIcon />
          </div>
          <div className={styles.contentWrapper}>
            <span>{hitContent}</span>
          </div>
          <div className={styles.actionIcon}>
            <JumpSvg />
          </div>
        </div>
      </a>
    </li>
  );
}
