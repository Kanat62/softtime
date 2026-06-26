module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // @react-native/babel-preset with hermes-stable profile disables
      // @babel/plugin-transform-class-properties (assumes Hermes supports them
      // natively), but hermesc in RN 0.81 rejects private class fields (#field).
      // Adding the transform globally ensures private fields are compiled to
      // WeakMap-based properties before hermesc sees them.
      // loose:true uses direct assignment for public fields (no @babel/runtime
      // helpers), which avoids ESM/CJS interop issues in the Metro bundle.
      ['@babel/plugin-transform-class-properties', { loose: true }],
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['@babel/plugin-transform-private-property-in-object', { loose: true }],
      'react-native-reanimated/plugin', // must be last
    ],
  };
};
