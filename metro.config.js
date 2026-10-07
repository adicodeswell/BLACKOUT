const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === '@maplibre/maplibre-react-native') {
        return context.resolveRequest(
          context,
          '@maplibre/maplibre-react-native/lib/commonjs/index.js',
          platform
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
