/**
 * Expo config — extends app.json and injects native keys from env.
 */
const appJson = require('./app.json');

module.exports = () => {
  const expo = appJson.expo;
  const plugins = [...(expo.plugins || [])];

  plugins.push('expo-apple-authentication');

  // Pin AppCheckCore / modular headers so Google Sign-In pods install on Expo iOS.
  plugins.push([
    'expo-build-properties',
    {
      ios: {
        extraPods: [
          { name: 'AppCheckCore', version: '11.2.0' },
          { name: 'GoogleUtilities', modular_headers: true },
          { name: 'RecaptchaInterop', modular_headers: true },
        ],
      },
    },
  ]);

  // Only link Google Sign-In when iOS URL scheme is set (EAS / .env).
  const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
  if (iosUrlScheme) {
    plugins.push([
      '@react-native-google-signin/google-signin',
      { iosUrlScheme },
    ]);
  }

  // Always exclude unused media-library. Exclude Google until OAuth scheme is set.
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
