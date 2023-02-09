import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { groupBy, debounce } from 'lodash-es';
import { getSidebarGroupData } from '../../logic/useSidebarData';
import { useLocaleSiteData } from '../../logic/useLocaleSiteData';
import { Tabs, Tab } from '../Tabs';
import styles from './index.module.scss';
import SearchSvg from './assets/search.svg';
import LoadingSvg from './assets/loading.svg';
import CloseSvg from './assets/close.svg';
import { MatchResult, MatchResultItem, PageSearcher } from './logic/search';
import { SuggestItem } from './SuggestItem';
import { removeDomain } from './logic/util';
import { isProduction, usePageData } from '@/runtime';

const KEY_CODE = {
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ENTER: 'Enter',
  SEARCH: 'KeyK',
  ESC: 'Escape',
};

const RECOMMEND_WORD: Record<string, string> = {
  zh: '其它站点推荐结果',
  en: 'Other Site Search Results',
};

export function Search() {
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<MatchResult>({
    current: [],
    others: [],
  });
  const [focused, setFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [searching, setSearching] = useState(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const pageSearcherRef = useRef<PageSearcher | null>(null);
  const { siteData, lang } = usePageData();
  const { sidebar } = useLocaleSiteData();
  const { search } = siteData;

  const suggestions = [
    ...searchResult.current,
    ...searchResult.others.map(item => item.items),
  ].flat();

  // We need to extract the group name by the link so that we can divide the search result into different groups.
  const extractGroupName = (link: string) =>
    getSidebarGroupData(sidebar, link).group;

  async function initPageSearcher() {
    const pageSearcher = new PageSearcher({
      ...search,
      currentLang: lang,
      extractGroupName,
    });
    pageSearcherRef.current = pageSearcher;
    await pageSearcherRef.current.init();
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case KEY_CODE.SEARCH:
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setFocused(!focused);
          }
          break;
        case KEY_CODE.ARROW_DOWN:
          e.preventDefault();
          setCurrentSuggestionIndex(
            (currentSuggestionIndex + 1) % suggestions.length,
          );
          break;
        case KEY_CODE.ARROW_UP:
          e.preventDefault();
          setCurrentSuggestionIndex(
            (currentSuggestionIndex - 1 + suggestions.length) %
              suggestions.length,
          );
          break;
        case KEY_CODE.ENTER:
          if (currentSuggestionIndex >= 0) {
            const suggestion = suggestions[currentSuggestionIndex];
            const isCurrent =
              currentSuggestionIndex < searchResult.current.length;
            if (isCurrent) {
              window.location.href = isProduction()
                ? suggestion.link
                : removeDomain(suggestion.link);
              setFocused(false);
            } else {
              window.open(suggestion.link);
            }
          }
          break;
        case KEY_CODE.ESC:
          setFocused(false);
          break;
        default:
          break;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [
    setCurrentSuggestionIndex,
    setFocused,
    suggestions,
    currentSuggestionIndex,
  ]);

  useEffect(() => {
    if (focused) {
      setSearchResult({ current: [], others: [] });
      if (!pageSearcherRef.current) {
        initPageSearcher();
      }
    }
  }, [focused]);

  useEffect(() => {
    initPageSearcher();
    // init pageSearcher again when lang changed
  }, [lang]);

  const onQueryChanged = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSearching(true);
    const matched = await pageSearcherRef.current?.match(newQuery);
    setSearching(false);
    setSearchResult(matched || { current: [], others: [] });
  };

  const normalizeSuggestions = (suggestions: MatchResultItem[]) =>
    groupBy(suggestions, 'group');

  // accumulateIndex is used to calculate the index of the suggestion in the whole list.
  let accumulateIndex = -1;

  const renderSearchResult = (result: MatchResult) => {
    const hasOtherResult =
      searchResult.others.map(item => item.items).flat().length > 0;
    return (
      <div>
        {/* current index */}
        {renderSearchResultItem(result.current)}
        {/* other indexes */}
        {hasOtherResult && (
          <h2 className={styles.groupTitle}>{RECOMMEND_WORD[lang]}</h2>
        )}
        <div style={{ marginTop: '-12px' }}>
          <Tabs
            values={result.others.map(item => item.index)}
            tabContainerClassName={styles.tabClassName}
          >
            {result.others.map(item => (
              <Tab key={item.index}>
                {renderSearchResultItem(item.items, false, item.index)}
              </Tab>
            ))}
          </Tabs>
        </div>
      </div>
    );
  };

  const renderSearchResultItem = (
    suggestionList: MatchResultItem[],
    isCurrent = true,
  ) => {
    // if no result, show no result
    if (suggestionList.length === 0) {
      return (
        <div flex="~ center" className="mt-4">
          <div p="2" font="bold" text="md #2c3e50">
            No results found
          </div>
        </div>
      );
    }
    const normalizedSuggestions = normalizeSuggestions(suggestionList);
    return (
      <ul className={styles.suggestList}>
        {Object.keys(normalizedSuggestions).map(group => {
          const groupSuggestions = normalizedSuggestions[group] || [];
          return (
            <li key={group}>
              {isCurrent && <h2 className={styles.groupTitle}>{group}</h2>}
              <ul>
                {groupSuggestions.map(suggestion => {
                  accumulateIndex++;
                  const suggestionIndex = accumulateIndex;
                  return (
                    <SuggestItem
                      key={suggestion.link}
                      suggestion={suggestion}
                      isCurrent={suggestionIndex === currentSuggestionIndex}
                      setCurrentSuggestionIndex={() => {
                        setCurrentSuggestionIndex(suggestionIndex);
                      }}
                      closeSearch={() => setFocused(false)}
                      inCurrentDocIndex={
                        suggestionIndex < searchResult.current.length
                      }
                    />
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <div className={styles.navSearchButton} onClick={() => setFocused(true)}>
        <button>
          <SearchSvg width="18" hight="18" />
          <p className={styles.searchWord}>Search</p>
          <div>
            <span>⌘</span>
            <span>K</span>
          </div>
        </button>
      </div>
      <div
        className={styles.mobileNavSearchButton}
        onClick={() => setFocused(true)}
      >
        <SearchSvg />
      </div>
      {focused &&
        createPortal(
          <div className={styles.mask} onClick={() => setFocused(false)}>
            <div
              className={`${styles.modal}`}
              onClick={e => {
                setFocused(true);
                e.stopPropagation();
              }}
            >
              <div className="flex items-center">
                <div className={styles.inputForm}>
                  <label>
                    <SearchSvg />
                  </label>
                  <input
                    className={styles.input}
                    ref={searchInputRef}
                    placeholder="Search Docs"
                    aria-label="Search"
                    autoComplete="off"
                    autoFocus
                    onChange={debounce(onQueryChanged, 150)}
                  />
                  <label>
                    <CloseSvg
                      className={styles.close}
                      onClick={() => {
                        if (searchInputRef.current) {
                          searchInputRef.current.value = '';
                        }
                      }}
                    />
                  </label>
                </div>
                <h2
                  className="text-brand ml-2 sm:hidden cursor-pointer"
                  onClick={e => {
                    e.stopPropagation();
                    setFocused(false);
                  }}
                >
                  Cancel
                </h2>
              </div>

              {query && suggestions.length ? (
                <div className={`${styles.searchHits}  modern-scrollbar`}>
                  {renderSearchResult(searchResult)}
                </div>
              ) : null}
              {searching && (
                <div flex="~ center">
                  <div p="2" text="sm">
                    <LoadingSvg />
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.getElementById('search-container')!,
        )}
    </>
  );
}
