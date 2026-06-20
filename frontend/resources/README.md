# App Resources

ضع هذه الملفات هنا قبل تشغيل `npx capacitor-assets generate --android`:

- `icon.png` — 1024×1024 px — شعار JobAI بخلفية ملونة (اللون: #0f172a)
- `icon-foreground.png` — 1024×1024 px — الشعار بدون خلفية (Adaptive Icon)
- `splash.png` — 2732×2732 px — شاشة البداية (الشعار في المنتصف)

بعد وضع الملفات:
```
npm install @capacitor/assets --save-dev
npx capacitor-assets generate --android
npx cap sync android
```
