import { serializeJson } from '@modern-js/runtime-utils/node';
import type {
  StaticHandlerContext,
  TrackedPromise,
} from '@modern-js/runtime-utils/remix-router';
import { Await, useAsyncError } from '@modern-js/runtime-utils/router';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { ROUTER_DATA_JSON_ID } from '../../core/constants';
import { modernInline, runRouterDataFnStr, runWindowFnStr } from './constants';
import { serializeErrors } from './utils';

/**
 * DeferredDataScripts only renders in server side,
 * it doesn't need to be hydrated in client side.
 */
const DeferredDataScripts = (props?: {
  nonce?: string;
  inlineScript?: boolean;
  context: StaticHandlerContext;
}) => {
  const staticContext = props?.context;
  const inlineScript = props?.inlineScript;
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = true;
  }, []);

  // No need to memo since DeferredDataScripts only renders in server side,
  // here we memo it in case DeferredDataScripts renders in client side one day.
  const deferredScripts:
    | [
        string,
        string,
        {
          fnName: string;
          fnArgs: any[];
          fnRun: string;
          fnScriptSrc: string;
        }[],
        JSX.Element[],
      ]
    | null = useMemo(() => {
    if (!staticContext) {
      return null;
    }

    const activeDeferreds = staticContext.activeDeferreds || [];

    const _ROUTER_DATA = {
      loaderData: staticContext.loaderData,
      errors: serializeErrors(staticContext.errors),
    };

    const initialScript0 = inlineScript ? '' : `${serializeJson(_ROUTER_DATA)}`;
    const initialScript1 = inlineScript
      ? [`_ROUTER_DATA = ${serializeJson(_ROUTER_DATA)};`, modernInline].join(
          '\n',
        )
      : modernInline;
    const deferredDataScripts: JSX.Element[] = [];

    const initialScripts = Object.entries(activeDeferreds).map(
      ([routeId, deferredData]) => {
        const pendingKeys = new Set(deferredData.pendingKeys);
        const { deferredKeys } = deferredData;
        const deferredKeyPromiseManifests = deferredKeys.map(key => {
          if (pendingKeys.has(key)) {
            deferredDataScripts.push(
              <DeferredDataScript
                nonce={props?.nonce}
                key={`${routeId} | ${key}`}
                data={deferredData.data[key]}
                dataKey={key}
                routeId={routeId}
              />,
            );

            return {
              key,
              routerDataFnName: 's',
              routerDataFnArgs: [serializeJson(routeId), serializeJson(key)],
            };
          } else {
            const trackedPromise = deferredData.data[key] as TrackedPromise;
            if (typeof trackedPromise._error !== 'undefined') {
              const error = {
                message: trackedPromise._error.message,
                stack:
                  process.env.NODE_ENV !== 'production'
                    ? trackedPromise._error.stack
                    : undefined,
              };

              return {
                key,
                routerDataFnName: 'p',
                routerDataFnArgs: [
                  serializeJson(undefined),
                  serializeJson(error),
                ],
              };
            } else {
              if (typeof trackedPromise._data === 'undefined') {
                throw new Error(
                  `The deferred data for ${key} was not resolved, did you forget to return data from a deferred promise`,
                );
              }

              return {
                key,
                routerDataFnName: 'p',
                routerDataFnArgs: [serializeJson(trackedPromise._data)],
              };
            }
          }
        });

        return {
          fnName: `mergeLoaderData`,
          fnRun: runWindowFnStr,
          fnArgs: [routeId, deferredKeyPromiseManifests],
          fnScriptSrc: 'modern-run-window-fn',
        };
      },
    );

    return [
      initialScript0,
      initialScript1,
      initialScripts,
      deferredDataScripts,
    ];
  }, []);

  if (!deferredScripts) {
    return null;
  }

  return (
    <>
      {!hydratedRef.current && (
        <>
          {/* json or empty string */}
          {deferredScripts[0].length !== 0 && (
            <script
              type="application/json"
              id={ROUTER_DATA_JSON_ID}
              nonce={props?.nonce}
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: deferredScripts[0] }}
            />
          )}
          <script
            async
            nonce={props?.nonce}
            data-script-src="modern-inline"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: deferredScripts[1] }}
          />
          {deferredScripts[2].map(({ fnName, fnArgs, fnRun, fnScriptSrc }) => (
            <script
              async
              key={fnName}
              data-script-src={fnScriptSrc}
              data-fn-name={fnName}
              data-fn-args={JSON.stringify(fnArgs)}
              nonce={props?.nonce}
              suppressHydrationWarning
              dangerouslySetInnerHTML={{
                __html: fnRun,
              }}
            />
          ))}
        </>
      )}
      {!hydratedRef.current && deferredScripts[3]}
    </>
  );
};

const DeferredDataScript = ({
  data,
  routeId,
  dataKey,
  nonce,
}: {
  data: any;
  routeId: string;
  dataKey: string;
  nonce?: string;
}) => {
  return (
    <Suspense>
      {typeof document === 'undefined' && data && dataKey && routeId ? (
        <Await
          resolve={data}
          errorElement={
            <ErrorDeferredDataScript
              routeId={routeId}
              dataKey={dataKey}
              nonce={nonce}
            />
          }
        >
          {(data: any) => (
            <script
              async
              nonce={nonce}
              data-fn-name="r"
              data-script-src="modern-run-router-data-fn"
              data-fn-args={`${JSON.stringify([routeId, dataKey, data])}`}
              suppressHydrationWarning
              dangerouslySetInnerHTML={{
                __html: runRouterDataFnStr,
              }}
            />
          )}
        </Await>
      ) : null}
    </Suspense>
  );
};

const ErrorDeferredDataScript = ({
  routeId,
  dataKey,
  nonce,
}: {
  routeId: string;
  dataKey: string;
  nonce?: string;
}) => {
  const error = useAsyncError() as Error;

  return (
    <script
      data-fn-name="r"
      data-script-src="modern-run-router-data-fn"
      data-fn-args={`${JSON.stringify([
        routeId,
        dataKey,
        undefined,
        {
          message: error.message,
          stack: error.stack,
        },
      ])}`}
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: runRouterDataFnStr,
      }}
    />
  );
};

export default DeferredDataScripts;
