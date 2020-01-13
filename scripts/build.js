const path = require('path');
const fs = require('fs');

const root = path.dirname(__dirname);

const files = [
  'refresh.wxs',
  'index.weapp.tsx',
  'index.template.wxml',
  'lodash.throttle/index.js',
  'lodash.throttle/index.d.ts'
];
const deleteFiles = ['ComponentResizeObserver.tsx', 'index.h5.tsx'];

function exec() {
  const fromBase = path.join(root, 'src/components/List');
  const toBase = path.join(root, 'dist/weapp/components/List');

  fs.mkdirSync(path.join(toBase, 'lodash.throttle'));
  deleteFiles.forEach(f => fs.unlinkSync(path.join(toBase, f)));
  files.forEach(f =>
    fs.copyFileSync(path.join(fromBase, f), path.join(toBase, f))
  );

  const indexFile = path.join(root, 'dist/weapp/index.ts');

  const content = fs.readFileSync(indexFile).toString();

  fs.writeFileSync(
    path.join(root, 'dist/weapp/index.js'),
    content
      .replace('h5', 'weapp.tsx')
      .replace('/VirutalListDataManager', '/VirutalListDataManager.ts')
  );

  fs.unlinkSync(indexFile);
}

exec();
