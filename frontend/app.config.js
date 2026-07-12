/**
 * Expo config — extends app.json and injects Android Google Maps key from env.
 * Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in frontend/.env (local) and EAS Secrets (builds).
 */
const appJson = require('./app.json');

module.exports = () => {
  const expo = appJson.expo;

  return {
    expo: {
      ...expo,
      android: {
        ...expo.android,
        versionCode: 10,
        config: {
          ...(expo.android.config || {}),
          googleMaps: {
            apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
          },
        },
      },
    },
  };
};
