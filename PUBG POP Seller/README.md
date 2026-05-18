# PUBG POP Seller

A React Native (Expo) marketplace app for PUBG item trading with proof-of-delivery.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 52, Expo Router v4 |
| Language | TypeScript (strict) |
| Architecture | React Native New Architecture |
| Auth + DB | Firebase JS SDK v11 (Auth, Firestore, Storage) |
| State | Zustand v5 + MMKV persistence |
| Server State | TanStack React Query v5 |
| Styling | NativeWind v4 (Tailwind CSS) |
| Media | expo-camera, expo-av, expo-media-library, expo-image-picker |
| Lint | ESLint + Prettier |

## Folder Structure

```
src/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root layout (providers)
│   ├── index.tsx               # Auth redirect guard
│   ├── (auth)/                 # Login, Register, Forgot Password
│   └── (tabs)/                 # Home, Marketplace, Orders, Profile
├── features/
│   ├── auth/                   # AuthProvider, authService, authStore
│   ├── marketplace/            # listingService, useListings hooks
│   ├── orders/                 # orderService, useOrders hooks
│   ├── proof/                  # proofService
│   └── profile/                # profileService
├── shared/
│   ├── components/             # Button, Input, Card
│   ├── hooks/                  # useTheme, useFirebaseAuth
│   ├── theme/                  # colors, spacing, typography
│   ├── types/                  # Shared TypeScript interfaces
│   └── utils/                  # formatters
├── lib/
│   ├── firebase.ts             # Firebase app init (modular SDK)
│   ├── queryClient.ts          # TanStack QueryClient
│   ├── storage.ts              # MMKV instance
│   └── zustandStorage.ts       # Zustand MMKV adapter
└── constants/
    └── index.ts                # Collections, statuses, query keys
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your Firebase config values
```

### 3. Place Firebase files

- Android: `google-services.json` → project root (already present)
- iOS: `GoogleService-Info.plist` → project root (add when targeting iOS)

### 4. Start development

```bash
# Expo Go (JS only, limited native modules)
npx expo start

# Full native build (recommended for camera/MMKV)
npx expo run:android
npx expo run:ios
```

### 5. Prebuild (generates android/ and ios/ folders)

```bash
npm run prebuild
```

## Firebase Firestore Rules

> Full rules are in `firestore.rules`. Deploy with `firebase deploy --only firestore:rules`.

### Key security model

| Collection | Read | Create | Update | Delete |
|-----------|------|--------|--------|--------|
| `users` | Own doc or admin | Owner only | Owner (safe fields only) or admin | Nobody |
| `listings` | Any auth user | Suppliers + admins | Owner or admin | Owner or admin |
| `orders` | Buyer/seller/admin | Any auth user | Buyer/seller/admin | Nobody |
| `proofs` | Buyer/seller/admin | Seller only | Seller or admin | Nobody |
| `reviews` | Any auth user | Reviewer only | Nobody | Nobody |

### Owner-updatable fields on `users`

Users can only update these fields on their own document (prevents self-promotion of role/reputation):

```
displayName, photoURL, bio, pubgId, pubgNickname,
pubgServer, fcmToken, onboardingCompleted, updatedAt
```

Admins can update any field (for moderation/verification).

### Deploy rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## Key Scripts

```bash
npm run lint          # ESLint
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier
npm run type-check    # tsc --noEmit
```

## Notes

- **New Architecture** is enabled via `newArchEnabled: true` in `app.config.js`
- **MMKV** (`react-native-mmkv`) requires a native build — not available in Expo Go
- **Firebase JS SDK** (not `@react-native-firebase`) is used for managed workflow compatibility
- Emulator support: set `USE_EMULATOR = true` in `src/lib/firebase.ts` for local dev
