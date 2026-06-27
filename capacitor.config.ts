import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.liquorflow.app',
  appName: 'LiquorFlow',
  server: {
    url: 'https://tanstack-start-app.liquorflow-app.workers.dev',
    cleartext: true
  }
};

export default config;