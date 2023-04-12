import { SearchOptions } from '../search';
import { Provider, SearchQuery } from '../Provider';
import { RemoteSearchOptions } from '@/shared/types';

function buildQueryString(params: Record<string, string>) {
  return Object.entries(params)
    .map(pair => pair.map(encodeURIComponent).join('='))
    .join('&');
}

export class RemoteProvider implements Provider {
  #options: SearchOptions;

  async init(options: SearchOptions) {
    this.#options = options;
  }

  async search(query: SearchQuery) {
    const { apiUrl, searchIndexes } = this.#options as RemoteSearchOptions;
    const { keyword, limit } = query;
    const urlParams = buildQueryString({
      keyword,
      limit: limit.toString(),
      searchIndexes:
        searchIndexes
          ?.map(indexInfo =>
            typeof indexInfo === 'string' ? indexInfo : indexInfo.value,
          )
          .join(',') || '',
      lang: this.#options.currentLang,
    });
    try {
      const result = await fetch(`${apiUrl}?${urlParams}`);
      return result.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  }
}
