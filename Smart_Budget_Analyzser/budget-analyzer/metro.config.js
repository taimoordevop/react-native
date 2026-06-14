const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force Expo Go mode
config.resolver.platforms = ['ios', 'android', 'native'];

// Disable web platform
config.resolver.platforms = config.resolver.platforms.filter(platform => platform !== 'web');

module.exports = config;
