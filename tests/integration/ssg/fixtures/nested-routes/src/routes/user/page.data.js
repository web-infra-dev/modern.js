// Test that this file is not imported into the client bundle
const fs = require('fs');

export const loader = () => {
  return 'Hello, User';
};
