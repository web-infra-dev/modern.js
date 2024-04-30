const fs = require('fs');

export const loader = () => {
  // Test that this file is not imported into the client bundle
  console.log(typeof fs.readFile);
  return 'Hello, User';
};
