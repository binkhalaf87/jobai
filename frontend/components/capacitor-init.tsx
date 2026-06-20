"use client";

import { useEffect } from "react";

export function CapacitorInit() {
  useEffect(() => {
    async function initCapacitor() {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { PushNotifications } = await import("@capacitor/push-notifications");
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      const { SplashScreen } = await import("@capacitor/splash-screen");

      // Hide splash screen after app loads
      await SplashScreen.hide();

      // Set status bar style
      await StatusBar.setStyle({ style: Style.Dark });

      // Request push notification permissions
      const { receive } = await PushNotifications.requestPermissions();
      if (receive === "granted") {
        await PushNotifications.register();
      }

      PushNotifications.addListener("registration", ({ value }) => {
        // Send FCM token to backend to enable server-side push notifications
        fetch("/api/v1/users/fcm-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token: value }),
        }).catch(() => {/* non-critical */});
      });
    }

    initCapacitor();
  }, []);

  return null;
}
