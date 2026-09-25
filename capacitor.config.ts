import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.schoolmanager.app',
  appName: 'School Manager',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    url: 'https://schoolmanager-demo.onrender.com',
  },
};

export default config;
