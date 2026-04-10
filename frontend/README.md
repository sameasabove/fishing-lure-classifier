# 🎣 Fishing Lure Analyzer - React Native App

AI-powered fishing lure identification and fishing tips mobile application built with React Native and Expo.

## Features

- 📸 **Camera Integration**: Take photos of fishing lures directly in the app
- 🖼️ **Gallery Selection**: Choose existing photos from your device
- 🤖 **AI Analysis**: Uses OpenAI's GPT-4 Vision API for accurate lure identification
- 🎒 **Tackle Box**: Save and organize your analyzed lures
- 💡 **Fishing Tips**: Get detailed information about lure usage, target species, and fishing conditions
- ⚙️ **Settings**: Configure API keys and app preferences

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)
- OpenAI API key

## Installation

1. **Clone and navigate to the app directory:**
   ```bash
   cd FishingLureApp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on iOS Simulator:**
   ```bash
   npm run ios
   ```

5. **Run on Android Emulator:**
   ```bash
   npm run android
   ```

## Configuration

### OpenAI API Key

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Open the app and go to Settings
3. Enter your API key in the "OpenAI API Key" field
4. Tap "Save API Key"

### Backend Server (Optional)

The app can work with your Flask backend server:

1. Update `BACKEND_URL` in `src/services/backendService.js` to match your server
2. Make sure your Flask server is running and accessible
3. The app will automatically fallback to direct OpenAI API if the backend is unavailable

## App Structure

```
FishingLureApp/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js          # Main analysis screen
│   │   ├── TackleBoxScreen.js     # Saved lures display
│   │   └── SettingsScreen.js      # App configuration
│   ├── services/
│   │   ├── lureAnalysisService.js # AI analysis service
│   │   ├── backendService.js      # Backend communication
│   │   └── storageService.js      # Local data storage
│   └── utils/                     # Utility functions
├── assets/                        # App icons and images
├── app.json                       # Expo configuration
├── eas.json                       # EAS Build configuration
└── package.json                   # Dependencies
```

## Building for iOS App Store

### Prerequisites

- Apple Developer Account ($99/year)
- Xcode (latest version)
- EAS CLI (`npm install -g eas-cli`)

### Setup

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS project:**
   ```bash
   eas build:configure
   ```

4. **Update project ID in app.json:**
   - Replace `"your-project-id-here"` with your actual EAS project ID

### Build for iOS

1. **Build for iOS App Store:**
   ```bash
   eas build --platform ios --profile production-ios
   ```

2. **Submit to App Store:**
   ```bash
   eas submit --platform ios
   ```

### TestFlight Distribution

1. **Build for TestFlight:**
   ```bash
   eas build --platform ios --profile production-ios
   ```

2. **Upload to TestFlight:**
   - The build will automatically be uploaded to App Store Connect
   - Configure TestFlight groups and invite testers
   - Test your app before submitting for review

## App Store Requirements

### Required Assets

- **App Icon**: 1024x1024px (PNG format)
- **Screenshots**: Various sizes for different devices
- **App Preview**: Optional video preview

### Privacy Policy

You'll need a privacy policy that covers:
- Camera and photo library access
- Data collection and usage
- Third-party services (OpenAI API)
- Data storage and security

### App Store Metadata

- **App Name**: Fishing Lure Analyzer
- **Subtitle**: AI-Powered Lure Identification
- **Keywords**: fishing, lures, AI, identification, tips
- **Description**: Detailed description of features and benefits

## Development

### Adding New Features

1. Create new screens in `src/screens/`
2. Add services in `src/services/`
3. Update navigation in `App.js`
4. Test on both iOS and Android

### Testing

- Test camera functionality on physical devices
- Verify API key configuration
- Test offline scenarios
- Check memory usage with large images

## Troubleshooting

### Common Issues

1. **Camera not working:**
   - Check permissions in device settings
   - Test on physical device (simulator has limitations)

2. **API errors:**
   - Verify API key is correct
   - Check internet connection
   - Monitor API usage limits

3. **Build failures:**
   - Update Expo CLI and EAS CLI
   - Check iOS deployment target
   - Verify bundle identifier is unique

### Debug Mode

Enable debug mode for development:
```bash
npm start -- --dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section
- Review Expo documentation
- Open an issue on GitHub

## Version History

- **v1.0.0**: Initial release with core functionality
  - Camera integration
  - AI analysis
  - Tackle box storage
  - Settings configuration
