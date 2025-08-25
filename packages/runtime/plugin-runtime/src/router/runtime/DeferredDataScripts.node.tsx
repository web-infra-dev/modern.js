import type {
  DeferredData,
  TrackedPromise,
} from '@modern-js/runtime-utils/browser';
import { serializeJson, storage } from '@modern-js/runtime-utils/node';
import type { StaticHandlerContext } from '@modern-js/runtime-utils/router';
import { useEffect, useMemo, useRef } from 'react';
import { ROUTER_DATA_JSON_ID } from '../../core/constants';
import { modernInline, runWindowFnStr } from './constants';
import { serializeErrors } from './utils';

/**
 * DeferredDataScripts only renders in server side,
 * it doesn't need to be hydrated in client side.
 */
const DeferredDataScripts = (props?: {
  nonce?: string;
  useJsonScript?: boolean;
  context: StaticHandlerContext;
}) => {
  const staticContext = props?.context;
  const useJsonScript = props?.useJsonScript;
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
        React.ReactElement[],
      ]
    | null = useMemo(() => {
    if (!staticContext) {
      return null;
    }

    const activeDeferreds = storage.useContext().activeDeferreds as Map<
      string,
      DeferredData
    >;

    const _ROUTER_DATA = {
      loaderData: staticContext.loaderData,
      errors: serializeErrors(staticContext.errors),
    };

    const initialScript0 = useJsonScript
      ? `${serializeJson(_ROUTER_DATA)}`
      : '';
    const initialScript1 = useJsonScript
      ? modernInline
      : [`_ROUTER_DATA = ${serializeJson(_ROUTER_DATA)};`, modernInline].join(
          '\n',
        );

    const deferredDataScripts: React.ReactElement[] = [];

    const initialScripts = Array.from(activeDeferreds.entries()).map(
      ([routeId, deferredData]) => {
        const pendingKeys = new Set(deferredData.pendingKeys);
        const { deferredKeys } = deferredData;
        const deferredKeyPromiseManifests = deferredKeys.map((key: string) => {
          if (pendingKeys.has(key)) {
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
    </>
  );
};

export default DeferredDataScripts;
