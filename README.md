# Calorie Tracker App

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

Tracks calorie counts in a fast and easy way, with a focus on custom ingredients and recipes, and partner sharing. It's intended to have a highly minimal interface, with the focus on getting your calories logged in and out of your face. You can export the JSON data to share with at your favorite AI to gain insights.

## Get started

1. Install dependencies

   ```bash
   yarn
   ```

2. Start the app

   ```bash
    npx expo run:ios
   ```
  Or use the `--device` option to connect to a phone
  ```bash
    npx expo run:ios --device
  ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)

## Re-building
Rebuild by running `npx expo prebuild` or `cd ios && pod install`, followed by `npx expo run:ios --device`

# Contributing

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).
Send a Pull Request to get your changes merged in!