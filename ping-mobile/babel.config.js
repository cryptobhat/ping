/**
 * Babel configuration for Ping React Native app
 * This tells Babel how to transform our modern JavaScript/TypeScript code
 * into code that React Native can understand
 */
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
