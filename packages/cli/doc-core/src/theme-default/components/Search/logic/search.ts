import { uniqBy } from 'lodash-es';
import { Provider } from './Provider';
import { backTrackHeaders, normalizeTextCase } from './util';
import { LocalProvider } from './providers/LocalProvider';
import { RemoteProvider } from './providers/RemoteProvider';
import { normalizeHref } from '@/runtime';
import {
  PageIndexInfo,
  SearchOptions as UserSearchConfig,
} from '@/shared/types';

const THRESHOLD_CONTENT_LENGTH = 100;

export interface Header {
  id: string;
  text: string;
  depth: number;
}

interface CommonMatchResult {
  title: string;
  header: string;
  link: string;
  query: string;
  highlightIndex: number;
  group: string;
}

interface TitleMatch extends CommonMatchResult {
  type: 'title';
}

interface HeaderMatch extends CommonMatchResult {
  type: 'header';
}

interface ContentMatch extends CommonMatchResult {
  type: 'content';
  statement: string;
}

export type MatchResultItem = TitleMatch | HeaderMatch | ContentMatch;

export type SearchOptions = UserSearchConfig & {
  currentLang: string;
  extractGroupName: (path: string) => string;
};

export class PageSearcher {
  #options: SearchOptions;

  #provider?: Provider;

  constructor(options: SearchOptions) {
    this.#options = options;
    switch (options.mode) {
      case 'remote':
        this.#provider = new RemoteProvider();
        break;
      default:
        this.#provider = new LocalProvider();
        break;
    }
  }

  async init() {
    await this.#provider?.init(this.#options);
  }

  async match(keyword: string, limit = 7) {
    const searchResult = await this.#provider?.search({ keyword, limit });
    const matchedResult: MatchResultItem[] = [];
    const normaizedKeyWord = normalizeTextCase(keyword);
    searchResult?.forEach(item => {
      // Title Match
      this.#matchTitle(item, normaizedKeyWord, matchedResult);
      // Header match
      const matchedHeader = this.#matchHeader(
        item,
        normaizedKeyWord,
        matchedResult,
      );
      // If we have matched header, we don't need to match content
      // Because the header is already in the content
      if (matchedHeader) {
        return;
      }
      // Content match
      this.#matchContent(item, normaizedKeyWord, matchedResult);
    });
    const res = uniqBy(matchedResult, 'link');
    return res;
  }

  #matchTitle(
    item: PageIndexInfo,
    query: string,
    matchedResult: MatchResultItem[],
  ): boolean {
    const { title } = item;
    const normalizedTitle = normalizeTextCase(title);
    if (normalizedTitle.includes(query)) {
      matchedResult.push({
        type: 'title',
        title,
        header: title,
        link: `${item.domain}${normalizeHref(item.routePath)}`,
        query,
        highlightIndex: normalizedTitle.indexOf(query),
        group: this.#options.extractGroupName(item.routePath),
      });
      return true;
    }
    return false;
  }

  #matchHeader(
    item: PageIndexInfo,
    query: string,
    matchedResult: MatchResultItem[],
  ): boolean {
    const { toc, domain = '', title } = item;
    for (const [index, header] of toc.entries()) {
      const normalizedHeader = normalizeTextCase(header.text);
      if (normalizedHeader.includes(query)) {
        // Find the all parent headers
        // So we can show the full path of the header in search result
        // e.g. header2 > header3 > header4
        const headerGroup = backTrackHeaders(toc, index);
        const headerStr = headerGroup.map(item => item.text).join(' > ');
        const headerMatchIndex = normalizeTextCase(headerStr).indexOf(query);
        const titlePrefix = `${title} > `;

        matchedResult.push({
          type: 'header',
          title: item.title,
          header: `${titlePrefix}${headerStr}`,
          highlightIndex: titlePrefix.length + Number(headerMatchIndex),
          link: `${domain}${normalizeHref(item.routePath)}#${header.id}`,
          query,
          group: this.#options.extractGroupName(item.routePath),
        });
        return true;
      }
    }
    return false;
  }

  #matchContent(
    item: PageIndexInfo,
    query: string,
    matchedResult: MatchResultItem[],
  ) {
    const { content, toc, domain } = item;
    const normalizedContent = normalizeTextCase(content);
    const queryIndex = normalizedContent.indexOf(query);
    if (queryIndex === -1) {
      return;
    }
    const headersIndex = toc.map(h =>
      normalizedContent.indexOf(normalizeTextCase(h.text)),
    );
    const currentHeaderIndex = headersIndex.findIndex((hIndex, position) => {
      if (position < toc.length - 1) {
        const next = headersIndex[position + 1];
        if (hIndex <= queryIndex && next >= queryIndex) {
          return true;
        }
      } else {
        return hIndex < queryIndex;
      }
      return false;
    });
    const currentHeader = toc[currentHeaderIndex] ?? item.title;

    let statementStartIndex = content.slice(0, queryIndex).lastIndexOf('\n');
    statementStartIndex = statementStartIndex === -1 ? 0 : statementStartIndex;
    const statementEndIndex = content.indexOf('\n', queryIndex + query.length);
    let statement = content.slice(statementStartIndex, statementEndIndex);
    if (statement.length > THRESHOLD_CONTENT_LENGTH) {
      statement = this.#normalizeStatement(statement, query);
    }
    matchedResult.push({
      type: 'content',
      title: item.title,
      header: currentHeader.text,
      statement,
      highlightIndex: normalizeTextCase(statement).indexOf(query),
      link: `${domain}${normalizeHref(item.routePath)}#${currentHeader.id}`,
      query,
      group: this.#options.extractGroupName(item.routePath),
    });
  }

  #normalizeStatement(statement: string, query: string) {
    // If statement is too long, we will only show 120 characters
    const queryIndex = statement.indexOf(query);
    const maxPrefixOrSuffix = Math.floor(
      (THRESHOLD_CONTENT_LENGTH - query.length) / 2,
    );
    let prefix = statement.slice(0, queryIndex);
    if (prefix.length > maxPrefixOrSuffix) {
      prefix = `...${statement.slice(
        queryIndex - maxPrefixOrSuffix + 3,
        queryIndex,
      )}`;
    }
    let suffix = statement.slice(queryIndex + query.length);
    if (suffix.length > maxPrefixOrSuffix) {
      suffix = `${statement.slice(
        queryIndex + query.length,
        queryIndex + maxPrefixOrSuffix - 3,
      )}...`;
    }
    return prefix + query + suffix;
  }
}
