/**
 * Expo config — extends app.json and injects native keys from env.
 */
const appJson = require('./app.json');

module.exports = () => {
  const expo = appJson.expo;
  const plugins = [...(expo.plugins || [])];

  plugins.push('expo-apple-authentication');

  const googlePlugin = ['@react-native-google-signin/google-signin'];
  if (process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME) {
    googlePlugin.push({
      iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME,
    });
  }
  plugins.push(googlePlugin);

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
    },
  };
};
