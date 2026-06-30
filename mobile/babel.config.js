module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // must be last
    ],
    overrides: [
      {
        // react-native/src/private/webapis (Event.js и др.) определяют свойство NONE
        // через Object.defineProperty как read-only. Плагин class-properties с loose:true
        // добавляет this.NONE = undefined в конструктор до Flow-стрипинга — конфликт.
        // Эти файлы Hermes поддерживает нативно, трансформировать не нужно.
        exclude: [
          /node_modules[/\\]react-native[/\\]src[/\\]private[/\\]webapis/,
        ],
        plugins: [
          ['@babel/plugin-transform-class-properties', { loose: true }],
          ['@babel/plugin-transform-private-methods', { loose: true }],
          ['@babel/plugin-transform-private-property-in-object', { loose: true }],
        ],
      },
    ],
  };
};
