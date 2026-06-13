# PUBG POP Seller — Splash & Loading Screen Design Specification

> Hand this document to your agent or developer. It contains exact specs, prompts, and implementation details to reproduce the designs faithfully.

---

## Global Design Tokens

These values must be used consistently across all screens.

```
COLORS
──────────────────────────────────────────
Background (primary)    : #080A0D
Background (secondary)  : #060810
Background (card/panel) : #0D1017
Gold (primary)          : #D4A017
Gold (dim/secondary)    : #A67C00
Gold (border glow)      : rgba(212, 160, 23, 0.35)
Gold (border dim)       : rgba(212, 160, 23, 0.12)
Gold (border faint)     : rgba(212, 160, 23, 0.06)
Green (verify/check)    : #4DB366
Text (primary)          : #F2EDE4
Text (muted)            : #8A8A9A
Text (dim)              : #5a5a6a
Text (very dim)         : #3a3a4a
Helmet body             : #2a2d35
Helmet border           : #404550
Helmet visor bg         : #1a2030
Helmet visor border     : #253040

TYPOGRAPHY
──────────────────────────────────────────
Display / Wordmark      : Orbitron (weight 900, 700) — Google Font
Tactical / Labels       : Rajdhani (weight 700, 600, 400) — Google Font
Body / Subtle           : DM Sans (weight 500, 400, 300) — Google Font

SPACING
──────────────────────────────────────────
Screen padding H        : 20–24px
Screen padding V        : 28–40px
Component gap           : 16–26px
Border radius (cards)   : 6px
Border radius (pills)   : 2px
```

---

## Screen 1 — Splash Screen

### Purpose
First thing the user sees when the app opens. Full-screen brand moment. No interaction, auto-dismisses after 2–3 seconds or when Firebase auth check completes.

### Layout (top → bottom, centered)
```
[RINGS + HEX GRID — fills entire screen]

   ┌─────────────────────────┐
   │  [Orbital Logo Badge]   │  ← 110×110px centered
   │                         │
   │       PUBG              │  ← Orbitron 900, 26px, #F2EDE4, spacing 4px
   │       POP               │  ← Orbitron 700, 18px, #D4A017, spacing 6px
   │       SELLER            │  ← Rajdhani 600, 11px, #5a5a6a, spacing 6px
   │                         │
   │   ────── ◆ ──────       │  ← Gold divider line, 60px, #D4A017, opacity 0.6
   │                         │
   │  TRADE · VERIFY · DELIVER│  ← Rajdhani 600, 10px, #5a5a6a, spacing 3px
   └─────────────────────────┘

[BOTTOM — 3 pulsing dots, centered, 28px from bottom]
```

### Background Layers (stacked, bottom to top)

**Layer 1 — Base**
- Solid fill: `#080A0D`
- Radial gradient overlay: `radial-gradient(ellipse 200% 80% at 50% 0%, #1a1200 0%, #080A0D 60%)`
  — creates warm amber glow emanating from top center

**Layer 2 — Hexagonal Grid**
- SVG `<pattern>` hexagons tiling entire screen
- Hex shape: `polygon points="15,2 26,8 26,18 15,24 4,18 4,8"` (30×26 unit cell)
- Stroke: `rgba(212,160,23,0.06)`, stroke-width 0.5, no fill
- Covers 100% × 100% of screen

**Layer 3 — Concentric Pulse Rings**
- Three concentric circles, all centered on screen
- Ring 1: diameter 320px, border `1px solid rgba(212,160,23,0.06)`
- Ring 2: diameter 240px, border `1px solid rgba(212,160,23,0.10)`
- Ring 3: diameter 160px, border `1px solid rgba(212,160,23,0.15)`
- Animation: `pulse-ring` — scale 1→1.04 and opacity 0.6→1, duration 3s, ease-in-out, infinite
- Stagger delays: Ring 1 = 0s, Ring 2 = 0.4s, Ring 3 = 0.8s

### Logo Badge — Orbital Badge (110×110px)

**Outer rotating ring (110×110px circle)**
- Border: `2px solid rgba(212,160,23,0.5)`
- Animation: `spin-slow` — rotate 0→360deg, duration 12s, linear, infinite
- Four dot markers on the ring at N/E/S/W positions (SVG circles):
  - North: `r=3`, fill `#D4A017`, opacity 0.8
  - East: `r=2`, fill `#D4A017`, opacity 0.4
  - South: `r=2.5`, fill `#D4A017`, opacity 0.6
  - West: `r=2`, fill `#D4A017`, opacity 0.3

**Inner static circle (88×88px, centered inside outer ring)**
- Background: `#0D1017`
- Border: `1.5px solid rgba(212,160,23,0.3)`
- Contains the helmet emblem (see below)

**Helmet Emblem (60×60px, inside inner circle)**
- Dome: `44×32px`, bg `#2a2d35`, border `1.5px solid #404550`, border-radius `22px 22px 0 0`
- Visor: `38×14px`, bg `#1a2030`, border `1px solid #253040`, border-radius `4px`
  - Text inside visor: "POP" — Rajdhani 700, 8px, color `#4DB366`, spacing 1px
- Jaw: `44×10px`, bg `#22252D`, border `1.5px solid #404550` (no top border), border-radius `0 0 6px 6px`
- Green checkmark SVG overlaid at top-right of helmet:
  - `<polyline points="2,9 7,14 16,4">`, stroke `#4DB366`, stroke-width 2.5, round caps

### Bottom Loading Dots
- 3 dots in a row, gap 6px, centered
- Each dot: `5×5px`, `border-radius 50%`, base bg `rgba(212,160,23,0.2)`
- Middle dot (dot 2): base bg `rgba(212,160,23,0.5)` — slightly brighter
- Animation: `dot-pulse` — scale 1→1.5 and opacity 0.4→1, duration 2s, ease-in-out, infinite
- Delays: dot 1 = 0s, dot 2 = 0.3s, dot 3 = 0.6s

---

## Screen 2 — Loading Screen: "Tactical Boot"

### When to Show
- Cold app start (first load after splash)
- Firebase initialization
- Auth state check
- Any full-app boot sequence

### Layout
```
┌─────────────────────────────────────┐
│  [DIAGONAL SLASH PANELS — decorative]│
│  [ANIMATED SCAN LINE — top to bottom]│
│  [TACTICAL GRID OVERLAY]            │
│                                     │
│  PUBG·POP  |  INITIALIZING          │  ← mini logo bar, top center
│                                     │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐      │
│  │ FIELD INTEL               │      │  ← tip box with corner marks
│  │ "Upload proof of delivery  │      │
│  │  within 24h of sale to    │      │
│  │  protect your seller score"│      │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘      │
│                                     │
│  SYSTEM BOOT          78%           │  ← label + live counter
│  [████████████░░░░░░░░░░░░░░]       │  ← progress bar
│                                     │
│  [Auth✓] [Data✓] [Market●] [Alerts] │  ← 4 status chips
└─────────────────────────────────────┘
```

### Background Layers

**Base:** `#060810`

**Tactical Grid:**
- `background-image`: two `linear-gradient` lines at `rgba(212,160,23,0.03)`
- Pattern size: `26×26px`
- Creates faint gold crosshatch grid

**Diagonal Slash Panels (decorative):**
- Left panel: `position absolute`, `left -30px`, full height, `width 120px`
  - Background: `rgba(212,160,23,0.03)`, `transform: skewX(-12deg)`
- Right panel: `position absolute`, `right -30px`, full height, `width 80px`
  - Background: `rgba(212,160,23,0.025)`, `transform: skewX(-12deg)`

**Animated Scan Line:**
- Absolutely positioned horizontal bar, `height 1.5px`
- Background: `rgba(212,160,23,0.4)`
- Animation: moves from `top: 0%` → `top: 100%`, duration 3s, linear, infinite

### Mini Logo Bar (top of content area)
- Flex row, centered, gap 8px
- "PUBG·POP": Orbitron 900, 13px, `#D4A017`, spacing 2px
- Separator: `1px` wide, `16px` tall, bg `rgba(212,160,23,0.3)`
- "INITIALIZING": Rajdhani 600, 10px, `#5a5a6a`, spacing 3px, uppercase

### Field Intel Tip Box
- Full width, border `1px solid rgba(212,160,23,0.15)`, border-radius `6px`
- Background: `rgba(212,160,23,0.03)`, padding `14px 16px`
- **Corner marks** at top-left and bottom-right only (tactical crosshair style):
  - Each mark: `8×8px`, two-sided border `2px solid #D4A017`
  - TL mark: `border-top` + `border-left`
  - BR mark: `border-bottom` + `border-right`
- Tag text: "FIELD INTEL" — Rajdhani 600, 9px, `#D4A017`, spacing 3px, uppercase
- Body text: DM Sans 400, 12px, `#8A8A9A`, line-height 1.5
  - Highlighted words (e.g. "proof of delivery"): color `#D4A017`
- **Tip text should be dynamic** — rotate through 3–5 app-relevant tips

### Progress Bar
- Label row: flex space-between
  - Left: "SYSTEM BOOT" — Rajdhani 600, 10px, `#5a5a6a`, spacing 2px, uppercase
  - Right: live percentage counter — Orbitron 700, 12px, `#D4A017`
- Track: full width, `height 4px`, bg `rgba(255,255,255,0.05)`, border-radius `2px`, overflow hidden
- Fill: `height 100%`, bg `#D4A017`, border-radius `2px`
- Animation: `fill-bar` keyframes — `0%→78%` (over ~2.5s ease-in), hold briefly, then `78%→100%`
- Percentage counter: JavaScript-driven, increments to match fill animation

### Status Chips Row (4 chips, equal width, flex)
Each chip: flex-1, border `1px solid rgba(255,255,255,0.05)`, border-radius `4px`, padding `8px 6px`, centered

| Chip | Icon (Tabler) | Label | State |
|------|--------------|-------|-------|
| Auth | `ti-shield-check` | AUTH | Done — green `#4DB366` |
| Data | `ti-database` | DATA | Done — green `#4DB366` |
| Market | `ti-shopping-bag` | MARKET | Active — gold `#D4A017`, blink animation |
| Alerts | `ti-bell` | ALERTS | Pending — dim `#3a3a4a` |

- **Done state:** icon + label both `#4DB366`
- **Active state:** icon + label both `#D4A017`, animation `blink` (opacity 1→0.3, 1s, infinite)
- **Pending state:** icon + label both `#3a3a4a`

---

## Screen 3 — Loading Screen: "Market Sync"

### When to Show
- Navigating to Marketplace tab
- Refreshing listings from Firestore
- After login, while fetching user's orders/listings
- Any data-fetch transition

### Layout
```
┌──────────────────────────────────────┐
│ [ANIMATED TOP PROGRESS BAR — gold]   │
│                                      │
│ [background particles — 2 soft blobs]│
│                                      │
│                                      │
│         ╔═══════════╗                │
│         ║  ◌  POP  ◌ ║               │  ← dual spinner with "POP" center
│         ╚═══════════╝                │
│                                      │
│        SYNCING MARKET                │  ← Rajdhani, uppercase
│      Fetching live listings...       │  ← DM Sans, muted
│                                      │
│  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │ 🪖   │  │ 🗡️   │  │ 👕   │       │  ← shimmer item cards
│  │Helmet│  │Weapon│  │Outfit│       │
│  │$4.20 │  │$12.50│  │$8.90 │       │
│  └──────┘  └──────┘  └──────┘       │
│                                      │
│   Powered by PUBG POP · Secure Trade │  ← very dim footer
└──────────────────────────────────────┘
```

### Background

**Base:** `#07080C`

**Background Particles (2 soft circles, no blur — use low-opacity solid fill):**
- Particle 1: `200×200px`, `top -80px`, `left -80px`, bg `rgba(212,160,23,0.04)`, border-radius `50%`
- Particle 2: `150×150px`, `bottom -60px`, `right -60px`, bg `rgba(212,160,23,0.04)`, border-radius `50%`, animation-delay 3s
- Animation `float-particle`: scale 1→1.08, duration 6s, ease-in-out, infinite alternate

**Top Progress Bar:**
- Position: `absolute top 0`, full width, `height 3px`, bg `rgba(212,160,23,0.1)`
- Inner fill div: animation `l2-bar` — width oscillates `20%→90%`, duration 2.5s, ease-in-out, infinite alternate, bg `#D4A017`

### Dual Counter-Rotating Spinner (90×90px)

**Outer ring (full 90×90px circle):**
- `border: 2px solid transparent`
- `border-top: 2px solid #D4A017`
- `border-right: 2px solid rgba(212,160,23,0.3)`
- Animation: `spin` 0→360deg, duration **1.2s**, linear, infinite, **forward**

**Inner ring (66×66px circle, centered inside outer):**
- `border: 1.5px solid transparent`
- `border-bottom: 1.5px solid #A67C00`
- `border-left: 1.5px solid rgba(166,124,0,0.3)`
- Animation: `spin` 0→360deg, duration **0.8s**, linear, infinite, **reverse**

**Center text:**
- "POP" — Orbitron 900, 11px, `#D4A017`, spacing 1px
- Positioned absolutely, centered in spinner, z-index above rings

### Message Block
- Main: "SYNCING MARKET" — Rajdhani 600, 16px, `#C8C0B0`, spacing 2px, uppercase
- Sub: "Fetching live listings..." — DM Sans 400, 11px, `#4a4a5a`, margin-top 4px

### Item Preview Cards (3 cards, flex row, equal width, gap 8px)

Each card:
- Border: `1px solid rgba(212,160,23,0.10)`, border-radius `6px`
- Padding: `10px 8px`, bg `rgba(255,255,255,0.02)`, text-align center
- Animation `card-shimmer`: border-color oscillates `0.08→0.22 alpha`, bg `0.01→0.04 alpha`, duration 2s, ease-in-out, infinite
- Stagger delays: card 1 = 0s, card 2 = 0.3s, card 3 = 0.6s

| Card | Tabler Icon | Label | Price |
|------|------------|-------|-------|
| 1 | `ti-helmet` | HELMET | $4.20 |
| 2 | `ti-sword` | WEAPON | $12.50 |
| 3 | `ti-shirt` | OUTFIT | $8.90 |

- Icon: font-size 20px, color `#4a4a5a`, margin-bottom 5px
- Label: Rajdhani 600, 9px, `#5a5a6a`, spacing 1px, uppercase, margin-bottom 3px
- Price: Orbitron 700, 10px, `#D4A017`

> **Note for agent:** In production, replace hardcoded items/prices with real Firestore listings. Show 3 most recently viewed or featured listings. Animate them in with a stagger fade-in.

### Footer
- "Powered by PUBG POP · Secure Trade"
- Rajdhani 400, 9px, spacing 3px, uppercase
- Base color: `#2a2a3a`
- "PUBG POP" portion: `#D4A017`, opacity 0.5

---

## Animation Reference Sheet

| Name | Property | From | To | Duration | Easing | Loop |
|------|----------|------|----|----------|--------|------|
| `pulse-ring` | scale + opacity | scale(1) opacity(0.6) | scale(1.04) opacity(1) | 3s | ease-in-out | infinite |
| `spin-slow` | rotate | 0deg | 360deg | 12s | linear | infinite |
| `dot-pulse` | scale + opacity | scale(1) opacity(0.4) | scale(1.5) opacity(1) | 2s | ease-in-out | infinite |
| `scan` | top position | 0% | 100% | 3s | linear | infinite |
| `fill-bar` | width | 0% | 100% | 3.5s | ease-in-out | infinite |
| `blink` | opacity | 1 | 0.3 | 1s | ease-in-out | infinite |
| `spin` (fast) | rotate | 0deg | 360deg | 0.8–1.2s | linear | infinite |
| `card-shimmer` | border-alpha + bg-alpha | dim | bright | 2s | ease-in-out | infinite |
| `l2-bar` | width | 20% | 90% | 2.5s | ease-in-out | infinite alternate |
| `float-particle` | scale | 1 | 1.08 | 6s | ease-in-out | infinite alternate |

---

## Agent Prompt — Splash Screen

```
Build a React Native splash screen for "PUBG POP Seller" — a PUBG item trading marketplace app.

FONTS (via expo-google-fonts or @expo-google-fonts):
- Orbitron_900Black, Orbitron_700Bold
- Rajdhani_600SemiBold, Rajdhani_700Bold
- DMSans_400Regular

BACKGROUND:
- Full screen, bg color #080A0D
- SVG hexagonal grid pattern using react-native-svg: polygon tiles, stroke rgba(212,160,23,0.06), tile size ~30×26 units, covers entire screen
- 3 concentric Animated circles (rings), centered on screen:
  - Diameters: 320, 240, 160 dp
  - Border: 1dp solid at opacity 0.06 / 0.10 / 0.15 of #D4A017
  - All pulse (scale 1→1.04, opacity 0.6→1) every 3s ease-in-out, staggered by 0.4s

LOGO BADGE (centered, 110×110dp):
- Outer circle (110dp): border 2dp rgba(212,160,23,0.5), rotates 360deg every 12s
  - 4 dot markers at N/E/S/W using small circles (r 2–3dp), fill #D4A017
- Inner circle (88dp, centered): bg #0D1017, border 1.5dp rgba(212,160,23,0.3)
- Inside inner circle: helmet emblem (60×60dp):
  - Dome: View 44×32dp, bg #2a2d35, borderTopLeftRadius/TopRightRadius 22, border 1.5dp #404550
  - Visor: View 38×14dp, bg #1a2030, borderRadius 4, border 1dp #253040, contains Text "POP" in Rajdhani 700 8sp #4DB366
  - Jaw: View 44×10dp, bg #22252D, borderBottomLeftRadius/BottomRightRadius 6, border 1.5dp #404550 (no top border)
  - Green checkmark SVG at top-right of helmet: polyline "2,9 7,14 16,4", stroke #4DB366, strokeWidth 2.5

WORDMARK (below badge, centered):
- "PUBG" — Orbitron 900, 26sp, #F2EDE4, letterSpacing 4
- "POP" — Orbitron 700, 18sp, #D4A017, letterSpacing 6
- "SELLER" — Rajdhani 600, 11sp, #5a5a6a, letterSpacing 6, uppercase
- Gold divider: View 60×1dp, bg #D4A017, opacity 0.6, marginVertical 14
- Tagline: "TRADE · VERIFY · DELIVER" — Rajdhani 600, 10sp, #5a5a6a, letterSpacing 3

BOTTOM DOTS (3 dots, 28dp from bottom, centered row, gap 6):
- Each dot: 5×5dp, borderRadius 50%, bg rgba(212,160,23,0.2)
- Middle dot bg: rgba(212,160,23,0.5)
- Pulse animation: scale 1→1.5, opacity 0.4→1, 2s ease-in-out infinite, stagger 0.3s each

AUTO-DISMISS: After 2.5s or when Firebase auth resolves (whichever comes last), navigate to auth flow.
```

---

## Agent Prompt — Loading Screen: Tactical Boot

```
Build a React Native loading screen ("Tactical Boot") for PUBG POP Seller app.

WHEN TO USE: Cold app start, Firebase init, auth state resolution.

FONTS: Orbitron_900Black, Rajdhani_600SemiBold, DMSans_400Regular (same as splash)

BACKGROUND (#060810):
- Faint gold crosshatch grid: two sets of 1dp lines at rgba(212,160,23,0.03), spaced 26dp apart
- Two diagonal decorative panels (skewed Views):
  - Left: absolute, left -30, full height, width 120, bg rgba(212,160,23,0.03), transform skewX(-12deg)
  - Right: absolute, right -30, full height, width 80, bg rgba(212,160,23,0.025), transform skewX(-12deg)
- Animated scan line: absolute horizontal View height 1.5dp, bg rgba(212,160,23,0.4), translateY animates 0→screenHeight over 3s linear infinite

MINI LOGO BAR (top of content, centered row):
- "PUBG·POP" in Orbitron 900 13sp #D4A017, letterSpacing 2
- Separator: View 1×16dp, bg rgba(212,160,23,0.3)
- "INITIALIZING" in Rajdhani 600 10sp #5a5a6a, letterSpacing 3, uppercase

FIELD INTEL TIP BOX (full width card):
- Border: 1dp rgba(212,160,23,0.15), borderRadius 6, bg rgba(212,160,23,0.03), padding 14×16
- Corner marks (tactical style) at top-left and bottom-right ONLY:
  - Each: absolute View 8×8dp, two-sided border 2dp #D4A017 (TL = borderTop+borderLeft, BR = borderBottom+borderRight)
- Tag: "FIELD INTEL" Rajdhani 700 9sp #D4A017, letterSpacing 3, uppercase
- Body: DMSans 400 12sp #8A8A9A, lineHeight 18
- Highlight key phrases in #D4A017 (use <Text> spans)
- Rotate through these tips every 4s with fade transition:
  1. "Upload proof of delivery within 24h of sale to protect your seller score."
  2. "Verified sellers get the gold badge and rank higher in search."
  3. "All transactions are protected by PUBG POP escrow."

PROGRESS BAR:
- Header row: "SYSTEM BOOT" (Rajdhani 600 10sp #5a5a6a left) + live % (Orbitron 700 12sp #D4A017 right)
- Track: full width, height 4dp, bg rgba(255,255,255,0.05), borderRadius 2, overflow hidden
- Fill: Animated.Value 0→1 mapped to width, bg #D4A017, borderRadius 2
- Drive with 3.5s Animated.timing, then loop. Update % text in parallel.

STATUS CHIPS ROW (4 equal chips, flex row, gap 6):
- Each chip: flex 1, border 1dp rgba(255,255,255,0.05), borderRadius 4, padding 8×6, centered
- Auth chip: icon + "AUTH" label, color #4DB366 (done)
- Data chip: icon + "DATA" label, color #4DB366 (done)
- Market chip: icon + "MARKET" label, color #D4A017, opacity Animated 1→0.3 every 1s (blink)
- Alerts chip: icon + "ALERTS" label, color #3a3a4a (pending)
- Use @expo/vector-icons Feather or MaterialCommunity icons that match: Shield, Database, ShoppingBag, Bell

SCREEN NAVIGATION: When progress completes, navigate to the main tab navigator (home/marketplace).
```

---

## Agent Prompt — Loading Screen: Market Sync

```
Build a React Native loading screen ("Market Sync") for PUBG POP Seller app.

WHEN TO USE: Loading marketplace listings from Firestore, post-login data fetch, tab transition to marketplace.

FONTS: Orbitron_900Black, Orbitron_700Bold, Rajdhani_600SemiBold, DMSans_400Regular

BACKGROUND (#07080C):
- Two background "particle" circles (no blur — use low opacity solid):
  - Circle 1: 200×200dp, top -80, left -80, bg rgba(212,160,23,0.04), borderRadius 100
  - Circle 2: 150×150dp, bottom -60, right -60, bg rgba(212,160,23,0.04), borderRadius 75
  - Both: Animated scale 1→1.08 over 6s ease-in-out infinite alternate, circle 2 delay 3s

TOP PROGRESS BAR (absolute top 0, full width, height 3dp):
- Track bg: rgba(212,160,23,0.1)
- Fill: Animated width 20%→90% over 2.5s ease-in-out, then reverse, infinite. Fill color #D4A017.

CENTER SPINNER (90×90dp, centered on screen):
- Outer ring (90×90): borderRadius 45, border 2dp transparent, borderTopColor #D4A017, borderRightColor rgba(212,160,23,0.3)
  - Rotate 0→360deg every 1.2s linear infinite
- Inner ring (66×66dp, centered absolutely inside outer):
  - borderRadius 33, border 1.5dp transparent, borderBottomColor #A67C00, borderLeftColor rgba(166,124,0,0.3)
  - Rotate 360→0deg every 0.8s linear infinite (counter-rotate)
- Center label: "POP" Orbitron 900 11sp #D4A017, letterSpacing 1, absolutely centered inside

MESSAGE BLOCK (below spinner, centered, gap 20 from spinner):
- Main: "SYNCING MARKET" — Rajdhani 600 16sp #C8C0B0, letterSpacing 2, uppercase
- Sub: "Fetching live listings..." — DMSans 400 11sp #4a4a5a, marginTop 4

ITEM PREVIEW CARDS (3 cards, flex row, gap 8, full width):
- Each card: flex 1, border 1dp rgba(212,160,23,0.10), borderRadius 6, padding 10×8, bg rgba(255,255,255,0.02), centered
- Shimmer animation per card: border opacity 0.10→0.22, bg opacity 0.01→0.04, 2s ease-in-out infinite
  - Card 1 delay 0s, card 2 delay 0.3s, card 3 delay 0.6s
- Card structure (top to bottom): Icon → Label → Price
  - Icon: vector icon 20sp, color #4a4a5a, marginBottom 5
  - Label: Rajdhani 600 9sp #5a5a6a, letterSpacing 1, uppercase, marginBottom 3
  - Price: Orbitron 700 10sp #D4A017

Cards data (replace with real Firestore data in production):
  - Card 1: icon=helmet/hard-hat, label="HELMET", price="$4.20"
  - Card 2: icon=sword/tool, label="WEAPON", price="$12.50"
  - Card 3: icon=shirt/tshirt, label="OUTFIT", price="$8.90"

FOOTER (absolute bottom 30, centered):
- "Powered by " + "PUBG POP" + " · Secure Trade"
- All: Rajdhani 400 9sp letterSpacing 3 uppercase
- Base text color: #2a2a3a
- "PUBG POP" color: #D4A017, opacity 0.5

DISMISSAL: Hide this screen when Firestore query resolves and data is ready to render.
```

---

## React Native Implementation Notes

### Dependencies needed
```bash
npx expo install expo-font @expo-google-fonts/orbitron @expo-google-fonts/rajdhani @expo-google-fonts/dm-sans
npx expo install react-native-svg
npx expo install @expo/vector-icons  # already included in Expo SDK
```

### File structure suggestion
```
src/
├── screens/
│   ├── SplashScreen.tsx          ← Screen 1
│   └── LoadingScreen.tsx         ← Accepts `variant: 'boot' | 'market'` prop
├── components/
│   ├── LogoBadge.tsx             ← Orbital badge, reusable
│   ├── ScanLine.tsx              ← Animated scan line, reusable
│   ├── TacticalGrid.tsx          ← Grid background, reusable
│   └── FieldIntelTip.tsx         ← Rotating tip box
└── constants/
    └── theme.ts                  ← All color/font/spacing tokens from this doc
```

### Expo Router integration
```tsx
// app/_layout.tsx
// Show SplashScreen first, then check auth, then route to (auth) or (tabs)

// app/index.tsx
// AuthRedirectGuard — after splash, redirects based on Firebase auth state
```

### Color tokens file (`src/constants/theme.ts`)
```ts
export const colors = {
  bgPrimary: '#080A0D',
  bgSecondary: '#060810',
  bgCard: '#0D1017',
  gold: '#D4A017',
  goldDim: '#A67C00',
  goldBorderGlow: 'rgba(212, 160, 23, 0.35)',
  goldBorderDim: 'rgba(212, 160, 23, 0.12)',
  goldBorderFaint: 'rgba(212, 160, 23, 0.06)',
  green: '#4DB366',
  textPrimary: '#F2EDE4',
  textMuted: '#8A8A9A',
  textDim: '#5a5a6a',
  textVeryDim: '#3a3a4a',
  helmetBody: '#2a2d35',
  helmetBorder: '#404550',
  helmetVisorBg: '#1a2030',
};

export const fonts = {
  orbitron900: 'Orbitron_900Black',
  orbitron700: 'Orbitron_700Bold',
  rajdhani700: 'Rajdhani_700Bold',
  rajdhani600: 'Rajdhani_600SemiBold',
  dmSans400: 'DMSans_400Regular',
};
```
