const fs = require('fs');
const path = require('path');

// print the target dir index
function printTargetDir(directoryPath, indent = '') {
  const files = fs.readdirSync(directoryPath);

  files.forEach(file => {
    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      printTargetDir(filePath, `${indent}  `);
    } else {
      console.log(`${indent}${file}`);
    }
  });
}

function printFileTogether(directoryPath) {
  const allFile = [];
  function loopDir(directoryPath) {
    const files = fs.readdirSync(directoryPath);

    files.forEach(file => {
      const filePath = path.join(directoryPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        loopDir(filePath);
      } else {
        allFile.push(filePath);
      }
    });
  }
  loopDir(directoryPath);
  console.log('\nthe files: ', allFile);
}

module.exports = {
  printTargetDir,
  printFileTogether,
};
