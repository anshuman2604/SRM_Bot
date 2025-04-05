import React from 'react';
import { Platform } from 'react-native';
import { createRoot } from 'react-dom/client';
import { ExpoRoot } from 'expo-router';
import { applyWebFixes } from '../web-fix';

// Apply web-specific fixes
if (Platform.OS === 'web') {
  applyWebFixes();
}

// Must be exported or Fast Refresh won't work
export function App() {
  const ctx = require.context('./');
  return <ExpoRoot context={ctx} />;
}

if (Platform.OS === 'web') {
  const rootTag = createRoot(document.getElementById('root') || document.getElementById('main'));
  rootTag.render(<App />);
}
