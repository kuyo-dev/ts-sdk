# Kuyo SDK 🌙

JavaScript/TypeScript SDK for error monitoring and performance tracking - A modern alternative to Sentry.

Available for :

- **next js**

## 🚀 Features

- **Automatic error capture** - Detect and report JavaScript errors
- **Breadcrumbs** - Detailed context of user actions
- **Multi-environment support** - Works across dev, staging, production
- **TypeScript ready** - Built-in types for better DX

## 📦 Installation

```bash
npm install @kuyo/sdk

```

```bash
yarn add @kuyo/sdk

```

```bash
pnpm add @kuyo/sdk

```

## 🛠️ Quick Setup

```ts
init({
  apiKey: process.env.NEXT_PUBLIC_KUYO_API_KEY!,
  endpoint: process.env.NEXT_PUBLIC_KUYO_ENDPOINT!,
  environment: process.env.NODE_ENV,
  debug: process.env.NODE_ENV === "development",
});
```

### Next JS Wrappers

We provide a global wrappers to capture all errors from a Next JS application. Including app/page router, api routes and
SSR components.

**Global Wrapper**

```ts
import { withKuyo } from "@kuyo/sdk";
```

Then wrap your Layout using our wrapper

```ts
export default withKuyo(RootLayout);
```

**Page Wrapper**

```ts
import { withKuyoPage } from "@kuyo/sdk";
```

Then wrap your Layout using our wrapper

```ts
export default withKuyoPage(WrapperTestPage);
```

**API Wrapper**

```ts
import { withKuyoAPI } from "@kuyo/sdk";
```

Then wrap your Layout using our wrapper

```ts
export const POST = withKuyoAPI(handler);
```

## 📼 Manually capture events

```ts
captureMessage(customMessage, messageLevel, {
  source: "manual",
  userTriggered: true,
  testType: "message",
  timestamp: new Date().toISOString(),
});
```
