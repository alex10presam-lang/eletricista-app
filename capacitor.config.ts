import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.alexandre.eletropro',
  appName: 'EletroPro',
  webDir: 'out',
  android: { backgroundColor: '#102f2c', allowMixedContent: false },
  plugins: { StatusBar: { backgroundColor: '#102f2c', style: 'DARK' } },
};
export default config;
