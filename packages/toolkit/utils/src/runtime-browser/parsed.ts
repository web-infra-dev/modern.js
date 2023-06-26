export const parsedJSONFromElement = (id: string) => {
  const elements = document.querySelectorAll(`#${id}`);
  if (elements.length === 0) {
    return undefined;
  }
  const element = elements[elements.length - 1];

  if (element) {
    try {
      const parsed = JSON.parse(element?.textContent || '');
      return parsed;
    } catch (e) {
      console.error(`parse ${id} error`, e);
      return undefined;
    }
  }
  return undefined;
};
