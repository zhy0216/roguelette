# React Migration Design

## Summary

Migrate Roguelette from vanilla TypeScript + DOM manipulation to React + Zustand + Tailwind CSS. The `src/models/` layer (pure game logic) stays untouched. Only the UI layer and entry point are rewritten.

## Decision Record

- **State management**: Zustand (lightweight, simple API, good fit for game state)
- **Styling**: Tailwind CSS (utility-first, replaces `main.css`)
- **Routing**: None — screen state in Zustand store, conditional rendering in `App.tsx`
- **Testing**: Deferred — models tests kept as-is, UI/E2E tests addressed later
- **Migration strategy**: Clean rewrite of UI layer (Approach A)

## Architecture

```
src/
├── models/                  # UNTOUCHED — pure game logic
│   ├── battle.ts
│   ├── chamber.ts
│   ├── dealer.ts
│   ├── items.ts
│   ├── relics.ts
│   ├── run.ts
│   └── rng.ts
├── stores/
│   └── gameStore.ts         # Zustand store
├── components/
│   ├── App.tsx              # Root — screen routing + BGM
│   ├── screens/
│   │   ├── TitleScreen.tsx
│   │   ├── MapScreen.tsx
│   │   ├── BattleScreen.tsx
│   │   ├── BattleWinScreen.tsx
│   │   ├── ShopScreen.tsx
│   │   ├── GambleScreen.tsx
│   │   ├── RestScreen.tsx
│   │   ├── GameOverScreen.tsx
│   │   └── VictoryScreen.tsx
│   └── ui/
│       ├── HpBar.tsx
│       ├── RelicBadges.tsx
│       ├── AssetImage.tsx
│       └── ShellIndicator.tsx
├── audio.ts                 # KEPT — AudioManager singleton
├── assets.ts                # KEPT — asset path constants
├── main.tsx                 # React entry point
└── index.css                # Tailwind imports
```

## Zustand Store

```typescript
type Screen = 'title' | 'map' | 'battle' | 'battle-win'
            | 'shop' | 'gamble' | 'rest' | 'gameover' | 'victory'

interface GameState {
  screen: Screen
  runState: RunState | null

  battle: {
    instance: Battle | null
    chamber: Chamber | null
    dealerType: DealerType | null
    playerItems: ItemType[]
    dealerItems: ItemType[]
    messageLog: string[]
    revealedShells: RevealedShell[]
    currentRevealed: 'live' | 'blank' | null
    busy: boolean
    chipsEarned: number
  }

  // Game flow actions
  startGame: () => void
  navigateTo: (screen: Screen) => void
  handleNode: (nodeType: NodeType) => void

  // Battle actions
  startBattle: () => void
  playerShoot: (action: DealerAction) => void
  usePlayerItem: (index: number) => void

  // Shop actions
  buyItem: (index: number) => void

  // Navigation
  returnToMap: () => void
  returnToTitle: () => void
}
```

`RunState` remains a class instance inside the store. It is not converted to a plain object because it has methods (`heal()`, `takeDamage()`, `ascend()`, etc.) and changing its interface would require modifying the models layer.

## Key Component Designs

### App.tsx

Renders the active screen based on `store.screen`. Uses `useEffect` to trigger BGM changes on screen transitions via the existing `audio.playBGM()`.

### BattleScreen.tsx

The most complex component. The current `BattleUI` class (620 LOC) is split into:

- **Rendering** — declarative JSX in `BattleScreen.tsx`
- **State mutations** — store actions (`playerShoot`, `usePlayerItem`)
- **Dealer AI turn** — `useEffect` watches turn changes, triggers `setTimeout`-based dealer action sequence
- **Delays/animations** — `setTimeout` calls within store actions, `busy` flag prevents user input

### Reusable UI Components

| Component | Purpose | Used by |
|-----------|---------|---------|
| `HpBar` | HP bar with label | Battle, Map, Rest |
| `RelicBadges` | Relic icon list | Battle, Map, Shop, Rest, Victory |
| `AssetImage` | Image with emoji fallback | Battle, Shop |
| `ShellIndicator` | Chamber shell display | Battle |

## Tailwind Theme

Colors from the current `main.css` `:root` variables:

```
bg: #0a0a0a
bg-card: #1a1a1a
bg-card-hover: #252525
red: #8b0000
red-bright: #ff2d55
gray: #555
gray-light: #888
white: #e0e0e0
gold: #c9a84c
green: #2d8b2d
blue: #4a9eff
```

Font: JetBrains Mono (imported via Google Fonts, set as Tailwind `fontFamily.mono`).

Animations: `fade-in` and `shake` defined as Tailwind `@keyframes` + `animation` extensions.

Screen backgrounds: applied via Tailwind `bg-[url(...)]` or inline style on each screen component.

## File Change Summary

| Action | Files |
|--------|-------|
| **Untouched** | `src/models/*`, `src/audio.ts`, `src/assets.ts`, `public/assets/*`, `src/models/__tests__/*` |
| **Delete** | `src/ui/*` (7 files), `src/main.ts`, `src/styles/main.css` |
| **Modify** | `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts` |
| **Create** | `src/main.tsx`, `src/index.css`, `src/stores/gameStore.ts`, `src/components/App.tsx`, 9 screen components, 4 UI components |

## Scope Boundaries

- No changes to models layer interfaces
- No URL routing
- No new game features — pure 1:1 functional migration
- Tests deferred to post-migration
