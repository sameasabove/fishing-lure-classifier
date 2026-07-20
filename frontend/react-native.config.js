/**
 * Skip native Google Sign-In until OAuth URL scheme is configured.
 * Avoids CocoaPods AppCheckCore / GoogleUtilities modular-headers failure on iOS.
 */
const googleReady = Boolean(process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME);

module.exports = {
  dependencies: googleReady
    ? {}
    : {
        '@react-native-google-signin/google-signin': {
          platforms: {
            ios: null,
            android: null,
          },
        },
      },
};
