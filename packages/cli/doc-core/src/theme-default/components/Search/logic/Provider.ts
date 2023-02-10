import { SearchOptions } from './search';
import { PageIndexInfo } from '@/shared/types';

export interface SearchQuery {
  keyword: string;
  limit: number;
}

export interface NormalizedSearchResultItem {
  hits: PageIndexInfo[];
  index: string;
}

export type NormalizedSearchResult = NormalizedSearchResultItem[];

export const LOCAL_INDEX = 'LOCAL_INDEX';

/**
 * Implement universal behavior of different search engine
 */
export abstract class Provider {
  /**
   * Init the search engine
   */
  async init(_options: SearchOptions): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Search the pages according to the query
   */
  search(_query: SearchQuery): Promise<NormalizedSearchResult> {
    throw new Error('Not implemented');
  }
}
