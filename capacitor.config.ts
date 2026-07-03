import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nicwang.lucktoday',
  appName: 'TOF',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    scheme: 'TOF',
    minVersion: '15.0',
  },
};

export default config;
