// Test that this file is not imported into the client bundle
require('fs');

export const loader = () => {
  return 'Hello, User';
};
