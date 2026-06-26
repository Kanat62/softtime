const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const monorepoRoot = __dirname;
const mobileRoot = path.resolve(monorepoRoot, 'mobile');

const config = getDefaultConfig(monorepoRoot);

// Prepend a DOMException polyfill that runs before InitializeCore.
// @babel/plugin-transform-class-properties (loose:true) in babel.config.js
// transforms react-native's DOMException.js in a way that loses the local
// class name binding, so the for-in loop / setPlatformObject calls at the
// bottom of that file throw "ReferenceError: Property 'DOMException' doesn't
// exist" in Hermes.  Installing a stub global first silences the error.
const origGetPolyfills = config.serializer.getPolyfills;
config.serializer.getPolyfills = (options) => {
  const base = origGetPolyfills ? origGetPolyfills(options) : [];
  return [
    path.resolve(monorepoRoot, 'scripts/polyfill-dom-exception.js'),
    ...base,
  ];
};

// Watch the entire monorepo so Metro can access packages/shared source files
config.watchFolders = [monorepoRoot];

// Resolve node_modules from mobile first (native deps), then root (workspace/shared deps)
config.resolver.nodeModulesPaths = [
  path.resolve(mobileRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Map @softtime/shared → TypeScript source (bypasses dist/ and node_modules symlink)
config.resolver.extraNodeModules = {
  '@softtime/shared': path.resolve(monorepoRoot, 'packages', 'shared', 'src'),
};

// Map @/* → mobile/src/* (mirrors mobile/tsconfig.json paths)
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@/')) {
    return context.resolveRequest(
      context,
      path.resolve(mobileRoot, 'src', moduleName.slice(2)),
      platform
    );
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
