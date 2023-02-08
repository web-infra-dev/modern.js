import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { groupBy } from 'lodash-es';
import { getSidebarGroupData } from '../../logic/useSidebarData';
import { useLocaleSiteData } from '../../logic/useLocaleSiteData';
import styles from './index.module.scss';
import SearchSvg from './assets/search.svg';
import LoadingSvg from './assets/loading.svg';
import CloseSvg from './assets/close.svg';
import { MatchResultItem, PageSearcher } from './logic/search';
import { SuggestItem } from './SuggestItem';
import { usePageData } from '@/runtime';

const KEY_CODE = {
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ENTER: 'Enter',
  SEARCH: 'KeyK',
  ESC: 'Escape',
};

export function Search() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MatchResultItem[]>([]);
  const [focused, setFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [searching, setSearching] = useState(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const pageSearcherRef = useRef<PageSearcher | null>(null);
  const { siteData, lang } = usePageData();
  const { sidebar } = useLocaleSiteData();
  const { search } = siteData;

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
            window.location.href = suggestion.link;
            setFocused(false);
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
  });

  useEffect(() => {
    if (focused && !pageSearcherRef.current) {
      initPageSearcher();
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
    setSuggestions(matched || []);
  };

  const showNotFound = query && !searching && suggestions.length === 0;

  const normalizeSuggestions = (suggestions: MatchResultItem[]) =>
    groupBy(suggestions, 'group');

  const renderSearchResult = () => {
    const normalizedSuggestions = normalizeSuggestions(suggestions);
    // accumulateIndex is used to calculate the index of the suggestion in the whole list.
    let accumulateIndex = -1;
    return (
      <ul className={styles.suggestList}>
        {Object.keys(normalizedSuggestions).map(group => {
          const groupSuggestions = normalizedSuggestions[group];
          return (
            <li key={group}>
              <h2 className={styles.groupTitle}>{group}</h2>
              <ul>
                {groupSuggestions.map(suggestion => {
                  accumulateIndex++;
                  const suggestionIndex = accumulateIndex;
                  return (
                    <SuggestItem
                      key={suggestion.link}
                      suggestion={suggestion}
                      isCurrent={suggestionIndex === currentSuggestionIndex}
                      setCurrentSuggestionIndex={() =>
                        setCurrentSuggestionIndex(suggestionIndex)
                      }
                      closeSearch={() => setFocused(false)}
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
                    onChange={onQueryChanged}
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
                  {renderSearchResult()}
                </div>
              ) : null}
              {searching && (
                <div flex="~ center">
                  <div p="2" text="sm">
                    <LoadingSvg />
                  </div>
                </div>
              )}
              {showNotFound && (
                <div flex="~ center" className="mt-4">
                  <div p="2" font="bold" text="md #2c3e50">
                    No results found for &quot;{query}&quot;
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
