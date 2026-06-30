const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Bump this when babel.config.js changes significantly to force cache invalidation.
config.cacheVersion = 'v4-class-props-overrides';

// Polyfill DOMException before InitializeCore runs.
// babel-preset-expo transforms react-native's DOMException.js with
// class-properties (loose:true), which loses the class name binding and
// causes Hermes to throw "ReferenceError: Property 'DOMException' doesn't exist".
const origGetPolyfills = config.serializer.getPolyfills;
config.serializer.getPolyfills = (options) => {
  const base = origGetPolyfills ? origGetPolyfills(options) : [];
  return [
    path.resolve(projectRoot, '..', 'scripts', 'polyfill-dom-exception.js'),
    ...base,
  ];
};

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
