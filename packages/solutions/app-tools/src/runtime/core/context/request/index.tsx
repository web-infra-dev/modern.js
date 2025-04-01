export const getRequest: () => Request = () => {
  return new Request(location.href);
};
