import serialize from 'serialize-javascript';

export const serializeJson = (data: any) => {
  return serialize(data, { isJSON: true });
};
