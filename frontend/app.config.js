/**
 * Expo config — extends app.json and injects native keys from env.
 */
const appJson = require('./app.json');

module.exports = () => {
  const expo = appJson.expo;
  const plugins = [...(expo.plugins || [])];

  plugins.push('expo-apple-authentication');

  // Only link Google Sign-In when iOS URL scheme is set (EAS / .env).
  // Without it, CocoaPods fails on AppCheckCore modular headers.
  const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
  if (iosUrlScheme) {
    plugins.push([
      '@react-native-google-signin/google-signin',
      { iosUrlScheme },
    ]);
  }

  return {
    expo: {
      ...expo,
      ios: {
        ...expo.ios,
        usesAppleSignIn: true,
      },
      android: {
        ...expo.android,
        config: {
          ...(expo.android.config || {}),
          googleMaps: {
            apiKey:
              process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
              process.env.GOOGLE_MAPS_API_KEY ||
              '',
          },
        },
      },
      plugins,
      // Expo module autolinking still pulls GoogleSignIn pods unless excluded
      // (react-native.config.js alone is not enough).
      ...(iosUrlScheme
        ? {}
        : {
            autolinking: {
              exclude: ['@react-native-google-signin/google-signin'],
            },
          }),
    },
  };
};
