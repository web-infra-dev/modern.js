/**
 * The local search provider for Modern.js Doc.
 * Powered by FlexSearch. https://github.com/nextapps-de/flexsearch
 */

import type { CreateOptions, Index as SearchIndex } from 'flexsearch';
import FlexSearch from 'flexsearch';
import { SearchOptions } from '../search';
import { LOCAL_INDEX, Provider, SearchQuery } from '../Provider';
import { normalizeTextCase } from '../util';
import { SEARCH_INDEX_JSON } from '@/shared/utils';
import { PageIndexInfo } from '@/shared/types';

interface PageIndexForFlexSearch extends PageIndexInfo {
  normalizedContent: string;
  headers: string;
  normalizedTitle: string;
}

const cjkRegex =
  /[\u3131-\u314e|\u314f-\u3163|\uac00-\ud7a3]|[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]|[\u3041-\u3096]|[\u30A1-\u30FA]/giu;

export class LocalProvider implements Provider {
  #index?: SearchIndex<PageIndexInfo[]>;

  #cjkIndex?: SearchIndex<PageIndexInfo[]>;

  async #getPages(): Promise<PageIndexInfo[]> {
    const result = await fetch(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error __ASSET_PREFIX__ is injected by webpack
      `${__ASSET_PREFIX__}/static/${SEARCH_INDEX_JSON}`,
    );
    return result.json();
  }

  async init(options: SearchOptions) {
    const { currentLang } = options;
    const pagesForSearch: PageIndexForFlexSearch[] = (await this.#getPages())
      .filter(page => page.lang === currentLang)
      .map(page => ({
        ...page,
        normalizedContent: normalizeTextCase(page.content),
        headers: page.toc
          .map(header => normalizeTextCase(header.text))
          .join(' '),
        normalizedTitle: normalizeTextCase(page.title),
      }));
    const createOptions: CreateOptions = {
      tokenize: 'full',
      async: true,
      doc: {
        id: 'routePath',
        field: ['normalizedTitle', 'headers', 'normalizedContent'],
      },
      cache: 100,
      split: /\W+/,
    };
    // Init Search Indexes
    // English Index
    this.#index = FlexSearch.create(createOptions);
    // CJK: Chinese, Japanese, Korean
    this.#cjkIndex = FlexSearch.create({
      ...createOptions,
      tokenize(str: string) {
        const cjkWords: string[] = [];
        let m: RegExpExecArray | null = null;
        do {
          m = cjkRegex.exec(str);
          if (m) {
            cjkWords.push(m[0]);
          }
        } while (m);
        return cjkWords;
      },
    });
    this.#index.add(pagesForSearch);
    this.#cjkIndex.add(pagesForSearch);
  }

  async search(query: SearchQuery) {
    const { keyword, limit } = query;
    const searchParams = {
      query: keyword,
      limit,
      field: ['normalizedTitle', 'headers', 'normalizedContent'],
    };

    const searchResult = await Promise.all([
      this.#index?.search(searchParams),
      this.#cjkIndex?.search(searchParams),
    ]);
    const flattenSearchResult = searchResult
      .flat(2)
      .filter(Boolean) as PageIndexInfo[];

    return [
      {
        index: LOCAL_INDEX,
        hits: flattenSearchResult,
      },
    ];
  }
}
