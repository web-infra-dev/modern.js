export const formatLog = (log: string) => {
  const strs = log.split(/\r\n|\n\r|\r|\n/g);
  if (strs[0].trim() === '') {
    return `\n${strs
      .slice(1)
      .filter(s => Boolean(s))
      .join('\n')}`;
  }

  return strs.filter(s => Boolean(s)).join('\n');
};
