export default (packageName = '') => {
  const splitArr = packageName.split(/\.|\//);
  return splitArr
    .map(it =>
      it
        .replace('@', '')
        .replace(/^\S/, s => s.toUpperCase())
        .replace(/([-_][a-zA-Z0-9])/g, group =>
          group.toUpperCase().replace('-', '').replace('_', ''),
        ),
    )
    .join('')
    .replace(/^\S/, s => s.toUpperCase());
};
