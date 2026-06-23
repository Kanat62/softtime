module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // hermes-stable profile skips class-properties transform; hermesc in RN 0.81 rejects #field syntax.
      ['@babel/plugin-transform-class-properties', { loose: true }],
      'react-native-reanimated/plugin',
    ],
  };
};
