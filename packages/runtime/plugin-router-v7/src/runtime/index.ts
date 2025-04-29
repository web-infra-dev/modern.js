export * from 'react-router';
export const json = (data: any, init?: number | ResponseInit): Response => {
  console.warn('json is deprecated, Please use Response.json instead.');
  const responseInit = init
    ? typeof init === 'number'
      ? { status: init }
      : init
    : undefined;
  return new Response(JSON.stringify(data), responseInit);
};

export const defer = (data: any, init?: number | ResponseInit) => {
  console.warn("defer is deprecated, you don't need to use it anymore.");
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
