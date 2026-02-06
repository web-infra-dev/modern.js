import {
  Form,
  useFetcher,
  useMatch,
} from '@modern-js/runtime/tanstack-router';

export default function MutationPage() {
  const match = useMatch({ from: '/mutation' });
  const fetcher = useFetcher();
  const loaderFetcher = useFetcher();
  const FetcherForm = fetcher.Form;
  const count = match.loaderData!.count;
  const loaderFetcherData = loaderFetcher.data as { count?: number } | undefined;

  return (
    <div id="mutation">
      <div id="mutation-count">string-mutation:{count}</div>
      <Form method="post" action="/mutation">
        <input name="amount" defaultValue="2" />
        <button type="submit" data-testid="mutation-form-submit">
          submit-form
        </button>
      </Form>

      <button
        type="button"
        data-testid="mutation-fetcher-submit"
        onClick={() => {
          void fetcher.submit(
            { amount: 3 },
            {
              method: 'post',
              action: '/mutation',
            },
          );
        }}
      >
        submit-fetcher
      </button>

      <FetcherForm method="post" action="/mutation">
        <input name="amount" defaultValue="4" />
        <button type="submit" data-testid="mutation-fetcher-form-submit">
          submit-fetcher-form
        </button>
      </FetcherForm>

      <button
        type="button"
        data-testid="mutation-fetcher-load"
        onClick={() => {
          void loaderFetcher.submit(
            {},
            {
              method: 'get',
              action: '/mutation',
            },
          );
        }}
      >
        load-fetcher
      </button>
      <div id="mutation-loader-fetcher-data">
        string-mutation-loader:
        {typeof loaderFetcherData?.count === 'number'
          ? loaderFetcherData.count
          : 'none'}
      </div>
      <div id="mutation-fetcher-state">{fetcher.state}</div>
    </div>
  );
}
