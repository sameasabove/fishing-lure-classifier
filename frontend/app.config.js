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

  // Always exclude unused media-library. Exclude Google until OAuth scheme is set.
  // Put both here so package.json / app.config do not overwrite each other.
  const exclude = ['expo-media-library'];
  if (!iosUrlScheme) {
    exclude.push('@react-native-google-signin/google-signin');
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
      autolinking: { exclude },
    },
  };
};
