#!/usr/bin/env node

/**
 * Quick Start Script for Fishing Lure Analyzer
 * This script helps set up the development environment and test the app
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎣 Fishing Lure Analyzer - Quick Start Setup');
console.log('=============================================\n');

// Check if we're in the right directory
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the FishingLureApp directory.');
  process.exit(1);
}

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 16) {
  console.error(`❌ Error: Node.js version ${nodeVersion} is not supported. Please use Node.js 16 or later.`);
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Check if dependencies are installed
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.error('❌ Error installing dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed');
}

// Check if Expo CLI is installed
try {
  execSync('expo --version', { stdio: 'pipe' });
  console.log('✅ Expo CLI is installed');
} catch (error) {
  console.log('📦 Installing Expo CLI...');
  try {
    execSync('npm install -g @expo/cli', { stdio: 'inherit' });
    console.log('✅ Expo CLI installed successfully');
  } catch (error) {
    console.error('❌ Error installing Expo CLI:', error.message);
    console.log('Please install Expo CLI manually: npm install -g @expo/cli');
  }
}

// Check if EAS CLI is installed
try {
  execSync('eas --version', { stdio: 'pipe' });
  console.log('✅ EAS CLI is installed');
} catch (error) {
  console.log('📦 Installing EAS CLI...');
  try {
    execSync('npm install -g eas-cli', { stdio: 'inherit' });
    console.log('✅ EAS CLI installed successfully');
  } catch (error) {
    console.error('❌ Error installing EAS CLI:', error.message);
    console.log('Please install EAS CLI manually: npm install -g eas-cli');
  }
}

// Check configuration files
const configPath = path.join(__dirname, '..', 'config.js');
if (!fs.existsSync(configPath)) {
  console.log('⚠️  Configuration file not found. Please copy config.example.js to config.js and update the values.');
}

// Check app.json
const appJsonPath = path.join(__dirname, '..', 'app.json');
if (fs.existsSync(appJsonPath)) {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  if (appJson.expo.extra?.eas?.projectId === 'your-project-id-here') {
    console.log('⚠️  Please update the EAS project ID in app.json');
  }
}

console.log('\n🚀 Setup Complete! Next Steps:');
console.log('===============================');
console.log('');
console.log('1. 📱 Start the development server:');
console.log('   npm start');
console.log('');
console.log('2. 📲 Run on iOS Simulator:');
console.log('   npm run ios');
console.log('');
console.log('3. 🤖 Run on Android Emulator:');
console.log('   npm run android');
console.log('');
console.log('4. 🔑 Configure your OpenAI API key:');
console.log('   - Open the app');
console.log('   - Go to Settings');
console.log('   - Enter your API key');
console.log('');
console.log('5. 🏗️  Build for iOS App Store:');
console.log('   eas build --platform ios --profile production-ios');
console.log('');
console.log('📚 For more information, see README.md');
console.log('📋 For deployment checklist, see DEPLOYMENT_CHECKLIST.md');
console.log('');
console.log('Happy coding! 🎣');
