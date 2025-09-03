import get, { exception } from '@api/error/index';
import getManaged, { exceptionManaged } from '@api/error/managed';

import { useEffect, useState } from 'react';

const serializeError = (error: any): string => {
  if (!error) return 'null';

  try {
    const errorInfo: Record<string, any> = {};

    if (error.status) errorInfo.status = error.status;
    if (typeof error === 'object' && error !== null) {
      Object.keys(error).forEach(key => {
        errorInfo[key] = error[key];
      });
    }

    return JSON.stringify(errorInfo, null, 2);
  } catch (e) {
    return `Error serialization failed: ${String(error)}`;
  }
};

const ErrorDisplay = ({ title, error }: { title: string; error: any }) => (
  <div className="hello">
    {title}: <pre>{serializeError(error)}</pre>
  </div>
);

const Page = () => {
  const apiCalls = [
    { name: 'get', api: get, initialState: undefined },
    { name: 'exception', api: exception, initialState: undefined },
    { name: 'getManaged', api: getManaged, initialState: undefined },
    {
      name: 'exceptionManaged',
      api: exceptionManaged,
      initialState: undefined,
    },
  ];

  const [errorStates, setErrorStates] = useState(
    apiCalls.reduce(
      (acc, call) => {
        acc[call.name] = call.initialState;
        return acc;
      },
      {} as Record<string, any>,
    ),
  );

  useEffect(() => {
    apiCalls.forEach(call => {
      call.api().catch(error => {
        setErrorStates(prev => ({
          ...prev,
          [call.name]: error,
        }));
      });
    });
  }, []);

  return (
    <div>
      {apiCalls.map(call => (
        <ErrorDisplay
          key={call.name}
          title={call.name}
          error={errorStates[call.name]}
        />
      ))}
    </div>
  );
};

export default Page;
