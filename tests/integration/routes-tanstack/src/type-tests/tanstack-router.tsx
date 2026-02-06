import * as React from 'react';
import {
  Form,
  Link,
  useBlocker,
  useFetcher,
  useMatch,
  useNavigate,
} from '@modern-js/runtime/tanstack-router';

export function TanstackRouterTypeTests() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const blocker = useBlocker({
    shouldBlockFn: () => true,
    withResolver: true,
  });

  const userMatch = useMatch({ from: '/user/$id' });

  const id: string = userMatch.loaderData!.id;
  // @ts-expect-error loaderData.id should be a string
  const idNumber: number = userMatch.loaderData!.id;

  // Valid: required params for a dynamic route
  const goodLink = <Link to="/user/$id" params={{ id: '123' }} />;
  const goodLinkWithPrefetch = (
    <Link to="/user/$id" params={{ id: '123' }} prefetch="intent" />
  );

  // @ts-expect-error params are required for /user/$id
  const badLinkMissingParams = <Link to="/user/$id" />;

  // @ts-expect-error invalid prefetch mode
  const badPrefetchValue = <Link to="/user/$id" params={{ id: '123' }} prefetch="viewport" />;

  // Optional param route: params should be optional
  const optionalLinkNoParams = <Link to="/optional/{-$id}" />;
  const optionalLinkWithParams = (
    <Link to="/optional/{-$id}" params={{ id: '123' }} />
  );

  fetcher.submit(
    { amount: 1 },
    {
      method: 'post',
      action: '/mutation',
    },
  );
  fetcher.submit(
    {},
    {
      method: 'get',
      action: '/mutation',
    },
  );

  const mutationForm = (
    <Form method="post" action="/mutation">
      <input name="amount" />
    </Form>
  );
  const FetcherForm = fetcher.Form;
  const mutationFetcherForm = (
    <FetcherForm method="post" action="/mutation">
      <input name="amount" />
    </FetcherForm>
  );

  // @ts-expect-error unknown route path
  const badLinkUnknownRoute = <Link to="/does-not-exist" />;

  React.useEffect(() => {
    navigate({ to: '/user/$id', params: { id } });
    // @ts-expect-error params are required for /user/$id
    navigate({ to: '/user/$id' });

    navigate({ to: '/optional/{-$id}' });
    navigate({ to: '/optional/{-$id}', params: { id: '123' } });
  }, [id, navigate]);

  return (
    <>
      {goodLink}
      {goodLinkWithPrefetch}
      {optionalLinkNoParams}
      {optionalLinkWithParams}
      {mutationForm}
      {mutationFetcherForm}
      {blocker.status}
    </>
  );
}
