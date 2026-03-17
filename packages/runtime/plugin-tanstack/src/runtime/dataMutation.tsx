import { useRouter } from '@tanstack/react-router';
import type { AnyRouter } from '@tanstack/react-router';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';

type SubmitTarget =
  | HTMLFormElement
  | FormData
  | URLSearchParams
  | Record<string, string | number | boolean | null | undefined>;
type SubmitterElement = HTMLButtonElement | HTMLInputElement;

export type SubmitOptions = {
  action?: string;
  method?: string;
  encType?: string;
};

export type FetcherState = 'idle' | 'submitting' | 'loading';

export class RouteActionResponseError<TData = unknown> extends Error {
  readonly response: Response;
  readonly data: TData;

  constructor(response: Response, data: TData) {
    super(`Route action failed with status ${response.status}`);
    this.name = 'RouteActionResponseError';
    this.response = response;
    this.data = data;
  }
}

type RouteAction = (args: {
  request: Request;
  params: Record<string, string>;
  context?: unknown;
}) => Promise<unknown> | unknown;

type RouteLoader = (args: {
  request: Request;
  params: Record<string, string>;
  context?: unknown;
}) => Promise<unknown> | unknown;

function formDataToUrlSearchParams(formData: FormData) {
  const searchParams = new URLSearchParams();
  formData.forEach((value, key) => {
    if (typeof value === 'string') {
      searchParams.append(key, value);
    }
  });
  return searchParams;
}

function formDataToTextPlain(formData: FormData) {
  return Array.from(formData.entries())
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('\n');
}

function toFormData(target: SubmitTarget): FormData {
  if (target instanceof HTMLFormElement) {
    return new FormData(target);
  }

  if (target instanceof FormData) {
    return target;
  }

  if (target instanceof URLSearchParams) {
    const formData = new FormData();
    target.forEach((value, key) => {
      formData.append(key, value);
    });
    return formData;
  }

  const formData = new FormData();
  Object.entries(target).forEach(([key, value]) => {
    if (typeof value === 'undefined' || value === null) {
      return;
    }
    formData.append(key, String(value));
  });
  return formData;
}

function getSubmitter(event: React.FormEvent<HTMLFormElement>) {
  const nativeEvent = event.nativeEvent as SubmitEvent | undefined;
  const submitter = nativeEvent?.submitter;
  if (
    submitter instanceof HTMLButtonElement ||
    submitter instanceof HTMLInputElement
  ) {
    return submitter;
  }
  return null;
}

function createFormDataFromSubmit({
  form,
  submitter,
}: {
  form: HTMLFormElement;
  submitter: SubmitterElement | null;
}) {
  if (submitter) {
    try {
      return new FormData(form, submitter);
    } catch {}
  }
  return new FormData(form);
}

function resolveSubmitOptionsFromForm({
  form,
  submitter,
  action,
  method,
  encType,
}: {
  form: HTMLFormElement;
  submitter: SubmitterElement | null;
  action?: string;
  method?: string;
  encType?: string;
}): Required<SubmitOptions> {
  const resolvedAction =
    submitter?.getAttribute('formaction') ||
    action ||
    form.getAttribute('action') ||
    '.';
  const resolvedMethod = (
    submitter?.getAttribute('formmethod') ||
    method ||
    form.getAttribute('method') ||
    'get'
  ).toLowerCase();
  const resolvedEncType =
    submitter?.getAttribute('formenctype') ||
    encType ||
    form.getAttribute('enctype') ||
    'application/x-www-form-urlencoded';

  return {
    action: resolvedAction,
    method: resolvedMethod,
    encType: resolvedEncType,
  };
}

function resolveRouteHandlers(router: AnyRouter, actionTo: string) {
  const builtLocation = router.buildLocation({
    to: actionTo as any,
  } as any);
  const href = router.getParsedLocationHref(builtLocation as any);
  const matchedRoutes = router.getMatchedRoutes(
    (builtLocation as any).pathname,
  );
  const routeStaticData = matchedRoutes.foundRoute?.options?.staticData as
    | Record<string, unknown>
    | undefined;
  const action = routeStaticData?.modernRouteAction as RouteAction | undefined;
  const loader = routeStaticData?.modernRouteLoader as RouteLoader | undefined;

  return {
    action,
    loader,
    href,
    params: (matchedRoutes.routeParams || {}) as Record<string, string>,
  };
}

function isRedirectResponse(value: unknown): value is Response {
  if (!(value instanceof Response)) {
    return false;
  }
  return [301, 302, 303, 307, 308].includes(value.status);
}

async function parseResponseData(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

async function parseResponseResultOrThrow(response: Response) {
  const parsed = await parseResponseData(response);
  if (!response.ok) {
    throw new RouteActionResponseError(response, parsed);
  }
  return parsed;
}

async function submitRouteAction({
  router,
  target,
  options = {},
  isFetcher = false,
  onInvalidateStart,
}: {
  router: AnyRouter;
  target: SubmitTarget;
  options?: SubmitOptions;
  isFetcher?: boolean;
  onInvalidateStart?: () => void;
}) {
  const method = (options.method || 'post').toLowerCase();
  const encType = options.encType || 'application/x-www-form-urlencoded';
  const actionTo = options.action || '.';
  const formData = toFormData(target);
  const resolved = resolveRouteHandlers(router, actionTo);

  if (method === 'get') {
    const search = formDataToUrlSearchParams(formData).toString();
    const requestUrl = new URL(resolved.href, window.location.origin);
    requestUrl.search = search;

    if (isFetcher && resolved.loader) {
      const result = await resolved.loader({
        request: new Request(requestUrl, {
          method: 'GET',
        }),
        params: resolved.params,
      });

      if (result instanceof Response) {
        const redirectTo =
          result.headers.get('X-Modernjs-Redirect') ||
          result.headers.get('Location');
        if (redirectTo || isRedirectResponse(result)) {
          await router.navigate({
            to: (redirectTo || '/') as any,
          } as any);
          return parseResponseData(result);
        }
        return parseResponseResultOrThrow(result);
      }

      return result;
    }

    await router.navigate({
      href: search ? `${resolved.href}?${search}` : resolved.href,
    } as any);
    return;
  }

  if (!resolved.action) {
    throw new Error(`No route action found for "${actionTo}"`);
  }

  const headers = new Headers();
  let body: BodyInit | null = null;
  if (encType.includes('application/json')) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(
      Object.fromEntries(formDataToUrlSearchParams(formData).entries()),
    );
  } else if (encType.includes('text/plain')) {
    headers.set('Content-Type', 'text/plain;charset=UTF-8');
    body = formDataToTextPlain(formData);
  } else if (encType.includes('application/x-www-form-urlencoded')) {
    headers.set(
      'Content-Type',
      'application/x-www-form-urlencoded;charset=UTF-8',
    );
    body = formDataToUrlSearchParams(formData);
  } else {
    body = formData;
  }

  const request = new Request(new URL(resolved.href, window.location.origin), {
    method: method.toUpperCase(),
    headers,
    body,
  });

  const result = await resolved.action({
    request,
    params: resolved.params,
  });

  if (result instanceof Response) {
    const redirectTo =
      result.headers.get('X-Modernjs-Redirect') ||
      result.headers.get('Location');
    if (redirectTo || isRedirectResponse(result)) {
      await router.navigate({
        to: (redirectTo || '/') as any,
      } as any);
      return parseResponseData(result);
    }

    const parsed = isFetcher
      ? await parseResponseResultOrThrow(result)
      : await parseResponseData(result);
    onInvalidateStart?.();
    await router.invalidate();
    return parsed;
  }

  onInvalidateStart?.();
  await router.invalidate();
  return result;
}

export type FormProps = Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  'onSubmit' | 'action'
> & {
  action?: string;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  reloadDocument?: boolean;
};

export function Form({
  action,
  method = 'get',
  encType,
  reloadDocument,
  onSubmit,
  ...rest
}: FormProps) {
  const router = useRouter();

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      onSubmit?.(event);
      if (event.defaultPrevented || reloadDocument) {
        return;
      }

      event.preventDefault();
      const submitter = getSubmitter(event);
      const formData = createFormDataFromSubmit({
        form: event.currentTarget,
        submitter,
      });
      const normalizedOptions = resolveSubmitOptionsFromForm({
        form: event.currentTarget,
        submitter,
        action,
        method,
        encType,
      });
      await submitRouteAction({
        router,
        target: formData,
        options: normalizedOptions,
      });
    },
    [action, encType, method, onSubmit, reloadDocument, router],
  );

  return (
    <form
      {...rest}
      action={action}
      method={method}
      encType={encType}
      onSubmit={handleSubmit}
    />
  );
}

export type FetcherSubmitOptions = SubmitOptions;

export type Fetcher = {
  state: FetcherState;
  data: unknown;
  error: unknown;
  Form: React.ComponentType<FormProps>;
  submit: (
    target: SubmitTarget,
    options?: FetcherSubmitOptions,
  ) => Promise<void>;
};

export function useFetcher(): Fetcher {
  const router = useRouter();
  const [state, setState] = useState<FetcherState>('idle');
  const [data, setData] = useState<unknown>(undefined);
  const [error, setError] = useState<unknown>(undefined);
  const requestStatesRef = useRef<Map<number, Exclude<FetcherState, 'idle'>>>(
    new Map(),
  );
  const requestIdRef = useRef(0);

  const syncStateFromRequests = useCallback(() => {
    let hasSubmitting = false;
    let hasLoading = false;

    requestStatesRef.current.forEach(requestState => {
      if (requestState === 'submitting') {
        hasSubmitting = true;
      } else if (requestState === 'loading') {
        hasLoading = true;
      }
    });

    if (hasSubmitting) {
      setState('submitting');
      return;
    }
    if (hasLoading) {
      setState('loading');
      return;
    }
    setState('idle');
  }, []);

  const setRequestState = useCallback(
    (requestId: number, requestState: Exclude<FetcherState, 'idle'>) => {
      requestStatesRef.current.set(requestId, requestState);
      syncStateFromRequests();
    },
    [syncStateFromRequests],
  );

  const clearRequestState = useCallback(
    (requestId: number) => {
      requestStatesRef.current.delete(requestId);
      syncStateFromRequests();
    },
    [syncStateFromRequests],
  );

  const submit = useCallback(
    async (target: SubmitTarget, options?: FetcherSubmitOptions) => {
      setError(undefined);
      const requestId = ++requestIdRef.current;
      const normalizedMethod = (options?.method || 'post').toLowerCase();
      const isLoaderSubmit = normalizedMethod === 'get';
      setRequestState(requestId, isLoaderSubmit ? 'loading' : 'submitting');

      try {
        const result = await submitRouteAction({
          router,
          target,
          options,
          isFetcher: true,
          onInvalidateStart: () => {
            if (!isLoaderSubmit) {
              setRequestState(requestId, 'loading');
            }
          },
        });
        setData(result);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        clearRequestState(requestId);
      }
    },
    [clearRequestState, router, setRequestState],
  );

  const FetcherForm = useCallback(
    ({
      action,
      method = 'get',
      encType,
      reloadDocument,
      onSubmit,
      ...rest
    }: FormProps) => {
      const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        onSubmit?.(event);
        if (event.defaultPrevented || reloadDocument) {
          return;
        }

        event.preventDefault();
        const submitter = getSubmitter(event);
        const formData = createFormDataFromSubmit({
          form: event.currentTarget,
          submitter,
        });
        const normalizedOptions = resolveSubmitOptionsFromForm({
          form: event.currentTarget,
          submitter,
          action,
          method,
          encType,
        });
        await submit(formData, normalizedOptions);
      };

      return (
        <form
          {...rest}
          action={action}
          method={method}
          encType={encType}
          onSubmit={handleSubmit}
        />
      );
    },
    [submit],
  );

  return {
    state,
    data,
    error,
    Form: FetcherForm,
    submit,
  };
}
