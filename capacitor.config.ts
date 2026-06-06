import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nicwang.lucktoday',
  appName: '命理今日',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    scheme: 'LuckToday',
    minVersion: '15.0',
  },
};

export default config;
