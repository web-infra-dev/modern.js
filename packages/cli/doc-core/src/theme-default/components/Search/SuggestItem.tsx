import FileSvg from './assets/file.svg';
import JumpSvg from './assets/jump.svg';
import HeaderSvg from './assets/header.svg';
import TitleSvg from './assets/title.svg';
import { HightlightInfo, MatchResultItem } from './logic/search';
import styles from './index.module.scss';
import { getSlicedStrByByteLength, removeDomain } from './logic/util';
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
  const link =
    inCurrentDocIndex && !isProduction()
      ? removeDomain(suggestion.link)
      : suggestion.link;

  const getHighlightedFragments = (
    rawText: string,
    highlights: HightlightInfo[],
  ) => {
    // Split raw text into several parts, and add styles.mark className to the parts that need to be highlighted.
    // highlightInfoList is an array of objects, each object contains the start index and the length of the part that needs to be highlighted.
    // For example, if the statement is "This is a statement", and the query is "is", then highlightInfoList is [{start: 2, length: 2}, {start: 5, length: 2}].
    const framegmentList = [];
    let lastIndex = 0;
    for (const highlightInfo of highlights) {
      const { start, length } = highlightInfo;
      const prefix = rawText.slice(lastIndex, start);
      const queryStr = getSlicedStrByByteLength(rawText, start, length);
      framegmentList.push(prefix);
      framegmentList.push(
        <span key={start} className={styles.mark}>
          {queryStr}
        </span>,
      );
      lastIndex = start + queryStr.length;
    }

    if (lastIndex < rawText.length) {
      framegmentList.push(rawText.slice(lastIndex));
    }

    return framegmentList;
  };

  const renderHeaderMatch = () => {
    if (suggestion.type === 'header' || suggestion.type === 'title') {
      const { header, highlightInfoList } = suggestion;
      return (
        <div className="font-medium">
          {getHighlightedFragments(header, highlightInfoList)}
        </div>
      );
    } else {
      return <div className="font-medium">{suggestion.header}</div>;
    }
  };
  const renderStatementMatch = () => {
    if (suggestion.type !== 'content') {
      return <div></div>;
    }
    const { statement, highlightInfoList } = suggestion;
    return (
      <div className="text-sm text-gray-light w-full">
        {getHighlightedFragments(statement, highlightInfoList)}
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
