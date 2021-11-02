/* eslint-disable no-console */
/** 获取用例数目脚本 */
const fs = require('fs');
const path = require('path');

let count = 0;
function readDirSync(root) {
  const pa = fs.readdirSync(root);
  pa.forEach(ele => {
    const childPath = path.join(root, ele);
    const info = fs.statSync(childPath);
    if (info.isDirectory()) {
      if (!/node_modules|dist|test|src/.test(ele)) {
        readDirSync(childPath);
      }
    } else if (ele === 'package.json') {
      count++;
    }
  });
}

const root = path.resolve(__dirname, '../integration');
readDirSync(root);

console.log('\n');
console.log('test case amount:', count);
/* eslint-enable no-console */
