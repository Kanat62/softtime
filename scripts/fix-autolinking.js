#!/usr/bin/env node
// One-time script: fix stale worklets path in RNGP autolinking cache
const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname, '..', 'mobile', 'android', 'build', 'generated', 'autolinking', 'autolinking.json'
);

if (!fs.existsSync(file)) {
  console.log('autolinking.json not found — nothing to fix');
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const worklets = data.dependencies && data.dependencies['react-native-worklets'];

if (!worklets) {
  console.log('react-native-worklets not in autolinking.json');
  process.exit(0);
}

const correctRoot = path.join(__dirname, '..', 'mobile', 'node_modules', 'react-native-worklets');
const correctSourceDir = path.join(correctRoot, 'android');
const correctCmakePath = correctSourceDir.replace(/\\/g, '/') +
  '/build/generated/source/codegen/jni/CMakeLists.txt';

worklets.root = correctRoot;
if (worklets.platforms && worklets.platforms.android) {
  worklets.platforms.android.sourceDir = correctSourceDir;
  worklets.platforms.android.cmakeListsPath = correctCmakePath;
}

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log('autolinking.json fixed — worklets path updated to mobile/node_modules');
console.log('  root:', correctRoot);
console.log('  sourceDir:', correctSourceDir);
