# app-EKG

_[Léeme en español](README.es.md)_

Mobile client for reading paper electrocardiograms.

The app photographs a printed ECG and sends it to a Python backend that runs two
models, digitisation and interpretation. **The app runs no AI models itself.**
It is a thin client by design.

> **Status: capture with a framing guide.** The flow goes from the camera to a
> local review screen. Confirming only logs the file path to the console. There
> is no upload to the backend yet, no gallery picker, and no image validation.

## How it fits together

```
[app-EKG]  --HTTP-->  [api-EKG]  --imports-->  [ecg-pipeline]
this repo             accounts, uploads        digitise + interpret
Expo / React Native   and the job queue
```

Nothing clinical is decided here. What an ECG means is decided in
[ecg-pipeline](https://github.com/reeenatamc/ecg-pipeline), and how a result is
worded is decided by the app's presentation layer, not by the models.

## Configuration

`API_BASE_URL` depends on where you run it:

| Running on       | Value                      |
| ---------------- | -------------------------- |
| Android emulator | `http://10.0.2.2:8000`     |
| iOS simulator    | `http://localhost:8000`    |
| Physical device  | `http://<your-PC-IP>:8000` |

On a physical device `localhost` is the phone itself, so you need your
computer's address on the local network and both on the same network.

## Commands

| Command                           | What it does                                                  |
| --------------------------------- | ------------------------------------------------------------- |
| `npm run android`                 | Builds the native app and installs it on the connected device |
| `npm run ios`                     | The same for iOS. macOS only                                  |
| `npm start`                       | Starts Metro for an already installed build                   |
| `npm run typecheck`               | TypeScript, no emit                                           |
| `npm run lint` / `lint:fix`       | ESLint, optionally fixing                                     |
| `npm run format` / `format:check` | Prettier                                                      |
| `npm test` / `test:watch`         | Unit tests                                                    |
| `npm run verify`                  | **All four checks in sequence.** Run it before committing     |

`npm start` passes `--dev-client` because this is a development build, not
Expo Go.

## Layout

Only folders that have content today exist. Nothing is created "for later": when
a folder is needed, it appears with its first file.

```
App.tsx           Root component
app.config.ts     Expo configuration, typed
.env.example      Local configuration template (committed)
.env              Real configuration (not committed)
src/camera/       Camera logic: geometry, capture and state
```

## Licence

See [LICENSE](LICENSE). This repository is not open source.
