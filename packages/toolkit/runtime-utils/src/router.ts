export * from 'react-router';
/** @deprecated Please use Response.json instead. */
export const json = (data: any, init?: number | ResponseInit): Response => {
  const responseInit = init
    ? typeof init === 'number'
      ? { status: init }
      : init
    : undefined;
  return new Response(JSON.stringify(data), responseInit);
};

/** @deprecated defer is deprecated, You don't need to use it. */
export const defer = (data: any, init?: number | ResponseInit) => {
  if (typeof init === 'undefined') {
    return data;
  } else {
    const responseInit = init
      ? typeof init === 'number'
        ? { status: init }
        : init
      : undefined;
    return new Response(JSON.stringify(data), responseInit);
  }
};
