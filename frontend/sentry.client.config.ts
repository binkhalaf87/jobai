import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.01,
    integrations: [
      Sentry.replayIntegration({
        // Mask all input values so the replay serializer doesn't process
        // rapid keystroke mutations (e.g. password-strength meter updates)
        // which can overflow the call stack on some browsers.
        maskAllInputs: true,
        blockAllMedia: false,
      }),
    ],
  });
}
