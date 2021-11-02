const fs = require('fs');
const path = require('path');

const folders = [
  'css-fixtures',
  'inline-assets/fixtures',
  'output-ssg',
  'remove-babel-plugin/fixtures',
  'server-protocol-routes',
];

const root = path.resolve(__dirname, '../integration');
const res = [];

folders
  .map(f => path.resolve(root, f))
  .forEach(folder => {
    const childFiles = fs.readdirSync(folder);
    childFiles.forEach(ele => {
      const childPath = path.join(folder, ele);
      const info = fs.statSync(childPath);
      if (info.isDirectory()) {
        res.push(ele);
      }
    });
  });
