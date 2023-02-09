import { SearchOptions } from '../search';
import { Provider, SearchQuery } from '../Provider';
import { RemoteSearchOptions } from '@/shared/types';

function buildQueryString(params: Record<string, string>) {
  return Object.entries(params)
    .map(pair => pair.map(encodeURIComponent).join('='))
    .join('&');
}

export class RemoteProvider implements Provider {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error we ensure the init will be called before search method
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
      searchIndexes: searchIndexes?.join(',') || '',
    });
    const result = fetch(`${apiUrl}?${urlParams})`);
    return (await result).json();
  }
}
