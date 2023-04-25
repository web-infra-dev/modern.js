export const parsedJSONFromElement = (id: string) => {
  const element = document.getElementById(id);
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
