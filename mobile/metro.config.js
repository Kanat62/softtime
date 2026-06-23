const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// @tanstack/react-query v5 uses private class fields (#field syntax).
// Hermes in RN 0.81 rejects these unless babel transforms them first.
// Force Metro to run babel on these packages so private fields are transpiled.
config.transformer.transformIgnorePatterns = [
  'node_modules/(?!(' +
    '@tanstack/react-query|' +
    '@tanstack/query-core|' +
    'react-native|' +
    '@react-native|' +
    '@react-native-community|' +
    'expo|' +
    '@expo|' +
    '@expo-google-fonts|' +
    'react-navigation|' +
    '@react-navigation|' +
    'react-native-reanimated|' +
    'react-native-worklets|' +
    'react-native-gesture-handler|' +
    'react-native-screens|' +
    'react-native-safe-area-context|' +
    'react-native-vision-camera|' +
    'react-native-svg' +
  '))',
];

module.exports = config;
