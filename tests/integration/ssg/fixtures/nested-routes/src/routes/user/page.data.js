// Test that this file is not imported into the client bundle
// eslint-disable-next-line no-unused-vars
const fs = require('fs');

export const loader = () => {
  return 'Hello, User';
};
