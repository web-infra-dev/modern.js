export const safeParse = (jsonString: string) => {
  try {
    return {
      code: 0,
      value: JSON.parse(jsonString),
    };
  } catch (e) {
    return {
      code: 1,
      value: jsonString,
    };
  }
};
