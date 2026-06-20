import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.jobai24.app",
  appName: "JobAI",
  webDir: "out",
  server: {
    url: "https://www.jobai24.com",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#0f172a",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f172a",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "Dark",
      backgroundColor: "#0f172a",
    },
  },
};

export default config;
