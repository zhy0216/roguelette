# React Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate Roguelette from vanilla TS + DOM manipulation to React + Zustand + Tailwind CSS while keeping `src/models/` untouched.

**Architecture:** Delete `src/ui/` and `src/main.ts`. Create React components for each screen, a Zustand store for game state, and Tailwind for styling. Models layer stays as-is — React components import and use the existing classes directly.

**Tech Stack:** React 19, Zustand 5, Tailwind CSS 4, Vite 7 (existing)

**Design doc:** `docs/plans/2026-02-18-react-migration-design.md`

**Testing:** Deferred per user request. Models unit tests kept but may need config tweak. E2E tests addressed post-migration.

---

## Task 1: Install Dependencies & Configure Build

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `vite.config.ts`

**Step 1: Install npm packages**

```bash
npm install react react-dom zustand tailwindcss @tailwindcss/vite
npm install -D @types/react @types/react-dom
```

**Step 2: Update `tsconfig.json`**

Add `"jsx": "react-jsx"` to compilerOptions. Full file:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "vitest/globals"],
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

**Step 3: Update `vite.config.ts`**

Add React (not needed — Vite supports JSX natively with react-jsx) and Tailwind plugin:

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  test: {
    globals: true,
    passWithNoTests: true,
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
})
```

**Step 4: Verify build still works**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts
git commit -m "chore: add React, Zustand, Tailwind dependencies and config"
```

---

## Task 2: Create Tailwind CSS & React Entry Point

**Files:**
- Create: `src/index.css`
- Modify: `index.html`
- Create: `src/main.tsx`
- Create: `src/components/App.tsx`

**Step 1: Create `src/index.css`**

Tailwind v4 imports + custom theme + animations + Google Font:

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

@theme {
  --color-bg: #0a0a0a;
  --color-bg-card: #1a1a1a;
  --color-bg-card-hover: #252525;
  --color-red: #8b0000;
  --color-red-bright: #ff2d55;
  --color-gray: #555;
  --color-gray-light: #888;
  --color-white: #e0e0e0;
  --color-gold: #c9a84c;
  --color-green: #2d8b2d;
  --color-blue: #4a9eff;
  --font-family-mono: 'JetBrains Mono', 'Courier New', monospace;
  --animate-fade-in: fade-in 0.3s ease;
  --animate-shake: shake 0.3s ease;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
```

**Step 2: Create `src/components/App.tsx`**

Minimal shell that just renders the title text:

```tsx
export function App() {
  return (
    <div className="w-full max-w-[480px] min-h-screen relative font-mono text-white">
      <div className="flex flex-col items-center justify-center min-h-screen p-5">
        <h1 className="text-3xl text-red-bright">恶魔轮盘</h1>
        <p className="text-gray-light text-sm">React migration in progress</p>
      </div>
    </div>
  )
}
```

**Step 3: Create `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './components/App'
import './index.css'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

**Step 4: Update `index.html`**

Replace all screen divs with empty root. Change script to main.tsx:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>恶魔轮盘：地狱攀升</title>
</head>
<body class="bg-bg min-h-screen flex justify-center items-center overflow-x-hidden">
  <div id="app"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

**Step 5: Run dev server, verify React renders**

```bash
npm run dev
```

Open browser, confirm "恶魔轮盘" heading appears with Tailwind styling.

**Step 6: Commit**

```bash
git add src/index.css src/main.tsx src/components/App.tsx index.html
git commit -m "feat: add React entry point with Tailwind CSS"
```

---

## Task 3: Create Shared UI Components

**Files:**
- Create: `src/components/ui/HpBar.tsx`
- Create: `src/components/ui/RelicBadges.tsx`
- Create: `src/components/ui/AssetImage.tsx`
- Create: `src/components/ui/ShellIndicator.tsx`

**Step 1: Create `src/components/ui/HpBar.tsx`**

```tsx
interface HpBarProps {
  label: string
  hp: number
  maxHp: number
  variant: 'player' | 'dealer'
}

export function HpBar({ label, hp, maxHp, variant }: HpBarProps) {
  const pct = Math.max(0, (hp / maxHp) * 100)
  const fillColor = variant === 'player' ? 'bg-green' : 'bg-red-bright'

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className={`text-sm ${variant === 'player' ? 'text-green' : 'text-red-bright'}`}>{label}</span>
        <span className="text-xs text-gray-light">{hp} / {maxHp} HP</span>
      </div>
      <div className="h-2 bg-bg-card rounded border border-gray overflow-hidden">
        <div
          className={`h-full ${fillColor} transition-[width] duration-300 ease-in-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
```

**Step 2: Create `src/components/ui/RelicBadges.tsx`**

```tsx
import type { RelicType } from '../../models/relics'
import { RELIC_DEFINITIONS } from '../../models/relics'

interface RelicBadgesProps {
  relics: RelicType[]
}

export function RelicBadges({ relics }: RelicBadgesProps) {
  if (relics.length === 0) return null
  return (
    <div>
      {relics.map((relic, i) => {
        const def = RELIC_DEFINITIONS[relic]
        return (
          <span
            key={i}
            className="inline-block px-2 py-1 m-0.5 text-[11px] bg-bg-card border border-gold rounded text-gold"
            title={def.description}
          >
            {def.name}
          </span>
        )
      })}
    </div>
  )
}
```

**Step 3: Create `src/components/ui/AssetImage.tsx`**

```tsx
import { useState } from 'react'

interface AssetImageProps {
  src: string
  alt: string
  size: number
  fallback: string
  className?: string
}

export function AssetImage({ src, alt, size, fallback, className = '' }: AssetImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <span>{fallback}</span>
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: 'pixelated' }}
      onError={() => setFailed(true)}
    />
  )
}
```

**Step 4: Create `src/components/ui/ShellIndicator.tsx`**

```tsx
import type { Chamber } from '../../models/chamber'

interface RevealedShell {
  index: number
  type: 'live' | 'blank'
}

interface ShellIndicatorProps {
  chamber: Chamber
  currentRevealed: 'live' | 'blank' | null
  revealedShells: RevealedShell[]
}

export function ShellIndicator({ chamber, currentRevealed, revealedShells }: ShellIndicatorProps) {
  const total = chamber.totalRemaining
  const shells: ('live' | 'blank' | 'unknown')[] = []

  for (let i = 0; i < total; i++) {
    if (i === 0 && currentRevealed) {
      shells.push(currentRevealed)
    } else {
      const revealed = revealedShells.find(r => r.index === i)
      shells.push(revealed ? revealed.type : 'unknown')
    }
  }

  const colorMap = {
    live: 'bg-red-bright',
    blank: 'bg-gray',
    unknown: 'bg-bg-card border border-gray',
  }

  return (
    <div className="text-center">
      <div className="mb-2">
        {shells.map((s, i) => (
          <span key={i} className={`inline-block w-3 h-3 rounded-full mx-0.5 ${colorMap[s]}`} />
        ))}
      </div>
      <div className="text-xs text-gray-light">
        实弹: {chamber.liveCount}  空弹: {chamber.blankCount}
      </div>
    </div>
  )
}
```

**Step 5: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add shared UI components (HpBar, RelicBadges, AssetImage, ShellIndicator)"
```

---

## Task 4: Create Zustand Game Store

**Files:**
- Create: `src/stores/gameStore.ts`

This is the core of the migration. The store holds all game state and actions. Battle logic is complex — it ports the `BattleUI` class's state management (not rendering) into store actions.

**Step 1: Create `src/stores/gameStore.ts`**

The full store file. See `src/ui/battle.ts` for the original logic being ported. Key mappings:

- `BattleUI.start()` → `startBattle()`
- `BattleUI.loadNewRound()` → `loadNewRound()` (internal helper)
- `BattleUI.playerShoot()` → `playerShoot()`
- `BattleUI.usePlayerItem()` → `usePlayerItem()`
- `BattleUI.dealerTurn()` → `dealerTurn()`
- `BattleUI.dealerUseItems()` → `dealerUseItems()`
- `BattleUI.finishBattle()` → `finishBattle()`

The store uses `setTimeout` + `get().action()` for delayed dealer turns, matching the original setTimeout-based sequencing.

```typescript
import { create } from 'zustand'
import { RunState } from '../models/run'
import type { NodeType } from '../models/run'
import { Battle } from '../models/battle'
import { Chamber } from '../models/chamber'
import type { Shell } from '../models/chamber'
import type { DealerType, DealerAction } from '../models/dealer'
import { DEALERS, getDealerAction } from '../models/dealer'
import type { ItemType } from '../models/items'
import { ITEM_DEFINITIONS, distributeItems } from '../models/items'
import { rng } from '../models/rng'
import { audio } from '../audio'

export type Screen = 'title' | 'map' | 'battle' | 'battle-win'
  | 'shop' | 'gamble' | 'rest' | 'gameover' | 'victory'

interface RevealedShell {
  index: number
  type: Shell
}

interface BattleState {
  instance: Battle | null
  chamber: Chamber | null
  dealerType: DealerType | null
  playerItems: ItemType[]
  dealerItems: ItemType[]
  messageLog: string[]
  revealedShells: RevealedShell[]
  currentRevealed: Shell | null
  busy: boolean
  chipsEarned: number
  playerLastAction: DealerAction | null
  extraItems: ItemType[]
  brokenLensUsed: boolean
  dealerKnownCurrent: Shell | null
}

const INITIAL_BATTLE: BattleState = {
  instance: null,
  chamber: null,
  dealerType: null,
  playerItems: [],
  dealerItems: [],
  messageLog: [],
  revealedShells: [],
  currentRevealed: null,
  busy: false,
  chipsEarned: 0,
  playerLastAction: null,
  extraItems: [],
  brokenLensUsed: false,
  dealerKnownCurrent: null,
}

interface GameStore {
  screen: Screen
  runState: RunState | null
  battle: BattleState

  // Navigation
  startGame: () => void
  returnToTitle: () => void
  returnToMap: () => void
  navigateTo: (screen: Screen) => void
  handleNode: (nodeType: NodeType) => void

  // Battle
  startBattle: () => void
  playerShoot: (action: DealerAction) => void
  usePlayerItem: (index: number) => void
  dealerTurn: () => void
  dealerUseItems: (onDone: () => void) => void
  finishBattle: () => void

  // Helpers
  addMessage: (msg: string) => void
  loadNewRound: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'title',
  runState: null,
  battle: { ...INITIAL_BATTLE },

  startGame: () => {
    const runState = new RunState()
    set({ runState, screen: 'map' })
  },

  returnToTitle: () => {
    set({ screen: 'title', runState: null, battle: { ...INITIAL_BATTLE } })
  },

  returnToMap: () => {
    set({ screen: 'map' })
  },

  navigateTo: (screen) => {
    set({ screen })
  },

  handleNode: (nodeType) => {
    const { runState } = get()
    if (!runState) return
    switch (nodeType) {
      case 'combat':
        get().startBattle()
        break
      case 'shop':
        set({ screen: 'shop' })
        break
      case 'gamble':
        set({ screen: 'gamble' })
        break
      case 'rest':
        set({ screen: 'rest' })
        break
    }
  },

  addMessage: (msg) => {
    set(state => {
      const log = [...state.battle.messageLog, msg]
      if (log.length > 3) log.shift()
      return { battle: { ...state.battle, messageLog: log } }
    })
  },

  loadNewRound: () => {
    const { runState, battle } = get()
    if (!runState || !battle.instance) return

    audio.playSFX('reload')
    const liveCount = 2 + Math.floor(rng() * 3)
    const blankCount = 2 + Math.floor(rng() * 3)
    const chamber = new Chamber(liveCount, blankCount)
    battle.instance.loadChamber(chamber)

    const includeAdvanced = runState.currentLayer <= 5
    const playerItems = distributeItems(includeAdvanced)
    const dealerItems = distributeItems(includeAdvanced)

    // Merge purchased items (first round only)
    if (battle.extraItems.length > 0) {
      playerItems.push(...battle.extraItems)
    }

    // Relic: hell_cigarettes
    if (runState.relics.has('hell_cigarettes')) {
      playerItems.push('cigarette')
    }

    // Relic: black_handcuffs
    if (runState.relics.has('black_handcuffs')) {
      battle.instance.setHandcuffs(true)
      get().addMessage('黑铁手铐自动生效！')
    }

    let currentRevealed: Shell | null = null
    // Relic: demons_eye
    if (runState.relics.has('demons_eye')) {
      const first = chamber.peek()
      currentRevealed = first
      get().addMessage(`恶魔之眼: 第一发是${first === 'live' ? '实弹' : '空弹'}`)
    }

    set(state => ({
      battle: {
        ...state.battle,
        chamber,
        playerItems,
        dealerItems,
        revealedShells: [],
        currentRevealed,
        extraItems: [],
        brokenLensUsed: false,
        dealerKnownCurrent: null,
      }
    }))
  },

  startBattle: () => {
    const { runState } = get()
    if (!runState) return

    const dealerType = runState.getRandomDealerType()
    const dealerHp = runState.getDealerHp()
    const extraItems = [...runState.purchasedItems]
    runState.purchasedItems = []

    const instance = new Battle(runState.playerHp, dealerHp)

    set({
      screen: 'battle',
      battle: {
        ...INITIAL_BATTLE,
        instance,
        dealerType,
        extraItems,
      }
    })

    // loadNewRound needs instance in state, so call after set
    get().loadNewRound()
  },

  usePlayerItem: (index) => {
    const { battle, runState } = get()
    if (!battle.instance || !battle.chamber || !runState) return
    if (battle.busy || battle.instance.currentTurn !== 'player') return
    if (index < 0 || index >= battle.playerItems.length) return

    const item = battle.playerItems[index]
    const def = ITEM_DEFINITIONS[item]
    audio.playSFX('item_use')
    let consumed = true
    const newPlayerItems = [...battle.playerItems]

    switch (item) {
      case 'magnifying_glass': {
        const shell = battle.chamber.peek()
        get().addMessage(`你使用了${def.name} -> ${shell === 'live' ? '实弹' : '空弹'}`)
        set(s => ({ battle: { ...s.battle, currentRevealed: shell } }))
        if (runState.relics.has('broken_lens') && !battle.brokenLensUsed) {
          consumed = false
          set(s => ({ battle: { ...s.battle, brokenLensUsed: true } }))
          get().addMessage('破碎镜片: 放大镜未消耗')
        }
        break
      }
      case 'handsaw':
        battle.instance.setSawedOff(true)
        get().addMessage(`你使用了${def.name} -> 下一发实弹伤害翻倍`)
        break
      case 'beer': {
        const ejected = battle.chamber.ejectCurrent()
        get().addMessage(`你使用了${def.name} -> 退出了一发${ejected === 'live' ? '实弹' : '空弹'}`)
        set(s => ({ battle: { ...s.battle, currentRevealed: null, revealedShells: [] } }))
        if (battle.chamber.isEmpty) {
          get().addMessage('弹匣已空，重新装弹...')
          get().loadNewRound()
        }
        break
      }
      case 'cigarette':
        runState.heal(1)
        battle.instance.playerHp = runState.playerHp
        get().addMessage(`你使用了${def.name} -> 回复1HP`)
        break
      case 'handcuffs':
        battle.instance.setHandcuffs(true)
        get().addMessage(`你使用了${def.name} -> 对手被铐住`)
        break
      case 'inverter': {
        battle.chamber.invertCurrent()
        const prev = get().battle.currentRevealed
        if (prev) {
          set(s => ({ battle: { ...s.battle, currentRevealed: prev === 'live' ? 'blank' : 'live' } }))
        }
        get().addMessage(`你使用了${def.name} -> 当前弹药类型已反转`)
        break
      }
      case 'burner_phone': {
        if (battle.chamber.totalRemaining > 1) {
          const maxIdx = battle.chamber.totalRemaining - 1
          const randIdx = 1 + Math.floor(rng() * maxIdx)
          const peeked = battle.chamber.peekAt(randIdx)
          set(s => ({
            battle: {
              ...s.battle,
              revealedShells: [...s.battle.revealedShells, { index: randIdx, type: peeked }]
            }
          }))
          get().addMessage(`你使用了${def.name} -> 第${randIdx + 1}发是${peeked === 'live' ? '实弹' : '空弹'}`)
        } else {
          get().addMessage(`你使用了${def.name} -> 只剩一发，无法窥视`)
        }
        break
      }
      case 'expired_medicine': {
        if (rng() < 0.5) {
          runState.heal(2)
          battle.instance.playerHp = runState.playerHp
          get().addMessage(`你使用了${def.name} -> 幸运! 回复2HP`)
        } else {
          runState.takeDamage(1)
          battle.instance.playerHp = runState.playerHp
          get().addMessage(`你使用了${def.name} -> 不幸! 扣1HP`)
        }
        break
      }
      case 'adrenaline': {
        const dealerItems = [...battle.dealerItems]
        if (dealerItems.length > 0) {
          const stolenIdx = Math.floor(rng() * dealerItems.length)
          const stolen = dealerItems.splice(stolenIdx, 1)[0]
          newPlayerItems.push(stolen)
          set(s => ({ battle: { ...s.battle, dealerItems } }))
          get().addMessage(`你使用了${def.name} -> 偷取了${ITEM_DEFINITIONS[stolen].name}`)
        } else {
          get().addMessage(`你使用了${def.name} -> 对手没有道具`)
        }
        break
      }
    }

    if (consumed) {
      newPlayerItems.splice(index, 1)
    }
    set(s => ({ battle: { ...s.battle, playerItems: newPlayerItems } }))

    if (battle.instance.winner) {
      get().finishBattle()
    }
  },

  playerShoot: (action) => {
    const { battle, runState } = get()
    if (!battle.instance || !battle.chamber || !runState) return
    if (battle.busy || battle.instance.currentTurn !== 'player') return

    set(s => ({
      battle: {
        ...s.battle,
        busy: true,
        playerLastAction: action,
        currentRevealed: null,
        revealedShells: [],
      }
    }))

    let result
    if (action === 'shoot_opponent') {
      result = battle.instance.shootOpponent()
      if (result.shell === 'live') {
        get().addMessage(`你射了荷官 -> 实弹! -${result.damage} HP`)
      } else {
        get().addMessage('你射了荷官 -> 空弹!')
      }
    } else {
      result = battle.instance.shootSelf()
      if (result.shell === 'live') {
        get().addMessage(`你射了自己 -> 实弹! -${result.damage} HP`)
      } else {
        get().addMessage('你射了自己 -> 空弹! 你保留行动权')
      }
    }

    audio.playSFX(result.shell === 'live' ? 'gunshot' : 'blank_click')
    if (result.shell === 'live' && result.damage > 0) {
      audio.playSFX('hurt')
    }

    runState.playerHp = battle.instance.playerHp

    // Force re-render by touching battle
    set(s => ({ battle: { ...s.battle } }))

    if (battle.instance.winner) {
      setTimeout(() => get().finishBattle(), 500)
      return
    }

    if (battle.instance.needsReload) {
      get().addMessage('弹匣已空，重新装弹...')
      set(s => ({ battle: { ...s.battle, brokenLensUsed: false } }))
      get().loadNewRound()
    }

    if (battle.instance.currentTurn === 'dealer') {
      setTimeout(() => {
        set(s => ({ battle: { ...s.battle, busy: false } }))
        get().dealerTurn()
      }, 1000)
    } else {
      set(s => ({ battle: { ...s.battle, busy: false } }))
    }
  },

  dealerTurn: () => {
    const { battle } = get()
    if (!battle.instance) return
    if (battle.instance.winner) { get().finishBattle(); return }
    if (battle.instance.currentTurn !== 'dealer') {
      set(s => ({ battle: { ...s.battle, busy: false } }))
      return
    }

    set(s => ({ battle: { ...s.battle, busy: true } }))

    get().dealerUseItems(() => {
      const { battle, runState } = get()
      if (!battle.instance || !battle.chamber || !battle.dealerType || !runState) return

      const action = getDealerAction(
        battle.dealerType,
        battle.chamber.liveCount,
        battle.chamber.blankCount,
        battle.playerLastAction,
      )

      set(s => ({ battle: { ...s.battle, currentRevealed: null, revealedShells: [] } }))

      const dealer = DEALERS[battle.dealerType]
      let result
      if (action === 'shoot_opponent') {
        result = battle.instance.shootOpponent()
        if (result.shell === 'live') {
          get().addMessage(`${dealer.name}射了你 -> 实弹! -${result.damage} HP`)
        } else {
          get().addMessage(`${dealer.name}射了你 -> 空弹!`)
        }
      } else {
        result = battle.instance.shootSelf()
        if (result.shell === 'live') {
          get().addMessage(`${dealer.name}射了自己 -> 实弹! -${result.damage} HP`)
        } else {
          get().addMessage(`${dealer.name}射了自己 -> 空弹! 保留行动权`)
        }
      }

      audio.playSFX(result.shell === 'live' ? 'gunshot' : 'blank_click')
      if (result.shell === 'live' && result.damage > 0) {
        audio.playSFX('hurt')
      }

      runState.playerHp = battle.instance.playerHp
      set(s => ({ battle: { ...s.battle } }))

      if (battle.instance.winner) {
        setTimeout(() => get().finishBattle(), 500)
        return
      }

      if (battle.instance.needsReload) {
        get().addMessage('弹匣已空，重新装弹...')
        set(s => ({ battle: { ...s.battle, brokenLensUsed: false } }))
        get().loadNewRound()
      }

      if (battle.instance.currentTurn === 'dealer') {
        setTimeout(() => get().dealerTurn(), 1000)
      } else {
        set(s => ({ battle: { ...s.battle, busy: false } }))
      }
    })
  },

  dealerUseItems: (onDone) => {
    const { battle } = get()
    if (!battle.instance || !battle.chamber || !battle.dealerType) { onDone(); return }

    const dealer = DEALERS[battle.dealerType]
    const dealerItems = [...battle.dealerItems]

    // Try magnifying glass
    const mgIdx = dealerItems.indexOf('magnifying_glass')
    if (mgIdx !== -1) {
      const shell = battle.chamber.peek()
      dealerItems.splice(mgIdx, 1)
      get().addMessage(`${dealer.name}使用了放大镜 -> 查看了当前弹药`)
      set(s => ({ battle: { ...s.battle, dealerItems, dealerKnownCurrent: shell } }))
      setTimeout(() => get().dealerUseItems(onDone), 600)
      return
    }

    // Try handsaw if knows current is live
    const hsIdx = dealerItems.indexOf('handsaw')
    if (hsIdx !== -1 && battle.dealerKnownCurrent === 'live') {
      dealerItems.splice(hsIdx, 1)
      battle.instance.setSawedOff(true)
      get().addMessage(`${dealer.name}使用了手锯 -> 实弹伤害翻倍`)
      set(s => ({ battle: { ...s.battle, dealerItems } }))
      setTimeout(() => get().dealerUseItems(onDone), 600)
      return
    }

    // Try handcuffs
    const hcIdx = dealerItems.indexOf('handcuffs')
    if (hcIdx !== -1) {
      dealerItems.splice(hcIdx, 1)
      battle.instance.setHandcuffs(true)
      get().addMessage(`${dealer.name}使用了手铐 -> 你被铐住`)
      set(s => ({ battle: { ...s.battle, dealerItems } }))
      setTimeout(() => get().dealerUseItems(onDone), 600)
      return
    }

    // Try cigarette if not full HP
    const { runState } = get()
    const cigIdx = dealerItems.indexOf('cigarette')
    if (cigIdx !== -1 && runState && battle.instance.dealerHp < runState.getDealerHp()) {
      dealerItems.splice(cigIdx, 1)
      battle.instance.dealerHp = Math.min(runState.getDealerHp(), battle.instance.dealerHp + 1)
      get().addMessage(`${dealer.name}使用了香烟 -> 回复1HP`)
      set(s => ({ battle: { ...s.battle, dealerItems } }))
      setTimeout(() => get().dealerUseItems(onDone), 600)
      return
    }

    // Try beer
    const beerIdx = dealerItems.indexOf('beer')
    if (beerIdx !== -1) {
      const ejected = battle.chamber.ejectCurrent()
      dealerItems.splice(beerIdx, 1)
      get().addMessage(`${dealer.name}使用了啤酒 -> 退出了${ejected === 'live' ? '实弹' : '空弹'}`)
      if (battle.chamber.isEmpty) {
        get().addMessage('弹匣已空，重新装弹...')
        get().loadNewRound()
      }
      set(s => ({ battle: { ...s.battle, dealerItems, dealerKnownCurrent: null } }))
      setTimeout(() => get().dealerUseItems(onDone), 600)
      return
    }

    // No items used — clear knowledge
    set(s => ({ battle: { ...s.battle, dealerKnownCurrent: null } }))
    setTimeout(onDone, 300)
  },

  finishBattle: () => {
    const { battle, runState } = get()
    if (!battle.instance || !runState) return

    const winner = battle.instance.winner!
    audio.playSFX(winner === 'player' ? 'victory_sting' : 'death')
    let chipsEarned = 0

    if (winner === 'player') {
      chipsEarned = 2 + Math.floor(rng() * 4)
      runState.addChips(chipsEarned)

      if (runState.relics.has('blood_pact')) {
        runState.heal(1)
        battle.instance.playerHp = runState.playerHp
      }
      if (runState.relics.has('soul_steal')) {
        runState.heal(2)
        battle.instance.playerHp = runState.playerHp
      }

      runState.playerHp = battle.instance.playerHp
      runState.ascend()

      set(s => ({ battle: { ...s.battle, chipsEarned } }))

      setTimeout(() => {
        if (runState.isVictory) {
          set({ screen: 'victory' })
        } else {
          set({ screen: 'battle-win' })
        }
      }, 1500)
    } else {
      runState.playerHp = battle.instance.playerHp
      setTimeout(() => set({ screen: 'gameover' }), 1500)
    }
  },
}))
```

**Step 2: Commit**

```bash
git add src/stores/gameStore.ts
git commit -m "feat: add Zustand game store with all game state and actions"
```

---

## Task 5: Create TitleScreen

**Files:**
- Create: `src/components/screens/TitleScreen.tsx`

```tsx
import { useGameStore } from '../../stores/gameStore'
import { audio } from '../../audio'

export function TitleScreen() {
  const startGame = useGameStore(s => s.startGame)

  return (
    <div className="flex-1 flex flex-col justify-center items-center gap-6 relative animate-fade-in">
      <button
        className="absolute top-4 right-4 px-3 py-2 text-xs bg-transparent border border-gray text-white rounded hover:border-red-bright hover:text-red-bright"
        onClick={() => { audio.toggleMute(); /* force re-render handled by React */ }}
      >
        {audio.muted ? '🔇' : '🔊'}
      </button>
      <h1 className="text-3xl text-red-bright text-center">恶魔轮盘</h1>
      <p className="text-gray text-sm">地狱攀升</p>
      <button
        className="bg-red border border-red-bright text-white px-12 py-4 text-base rounded hover:bg-red-bright"
        onClick={() => { audio.unlock(); startGame() }}
      >
        开始游戏
      </button>
    </div>
  )
}
```

**Commit after creation.**

---

## Task 6: Create MapScreen

**Files:**
- Create: `src/components/screens/MapScreen.tsx`

Ports `src/ui/map.ts`. Uses `runState.getPathOptions()` for node cards, `handleNode` from store.

```tsx
import { useGameStore } from '../../stores/gameStore'
import type { NodeType } from '../../models/run'
import { HpBar } from '../ui/HpBar'
import { RelicBadges } from '../ui/RelicBadges'

const NODE_DISPLAY: Record<NodeType, { icon: string; title: string; description: string }> = {
  combat: { icon: '⚔', title: '战斗', description: '与恶魔荷官对局' },
  shop: { icon: '🏪', title: '商店', description: '购买道具和遗物' },
  gamble: { icon: '🎲', title: '赌局', description: '高风险高回报' },
  rest: { icon: '🔧', title: '休息', description: '回复 1 HP' },
}

export function MapScreen() {
  const runState = useGameStore(s => s.runState)
  const handleNode = useGameStore(s => s.handleNode)
  if (!runState) return null

  const options = runState.getPathOptions()

  return (
    <div className="flex flex-col gap-5 py-5 min-h-screen animate-fade-in">
      <div className="text-center">
        <h2 className="text-red-bright mb-1">地狱第 {runState.currentLayer} 层</h2>
        <div className="text-xs text-gray-light">选择你的道路</div>
      </div>

      <div className="bg-bg-card border border-gray rounded-lg p-4">
        <HpBar label="HP" hp={runState.playerHp} maxHp={runState.maxHp} variant="player" />
        <div className="mt-2 text-xs">
          <span className="text-gold font-bold">筹码: {runState.chips}</span>
        </div>
        <div className="mt-2">
          <RelicBadges relics={runState.relics.list()} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {options.map((nodeType, idx) => {
          const display = NODE_DISPLAY[nodeType]
          return (
            <div
              key={idx}
              className="bg-bg-card border border-gray rounded-lg p-5 text-center cursor-pointer transition-all hover:border-red-bright hover:bg-bg-card-hover"
              onClick={() => handleNode(nodeType)}
            >
              <div className="text-3xl mb-2">{display.icon}</div>
              <div className="text-base font-bold mb-1">{display.title}</div>
              <div className="text-xs text-gray-light">{display.description}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Commit after creation.**

---

## Task 7: Create Simple Screens (Rest, GameOver, Victory, BattleWin)

**Files:**
- Create: `src/components/screens/RestScreen.tsx`
- Create: `src/components/screens/GameOverScreen.tsx`
- Create: `src/components/screens/VictoryScreen.tsx`
- Create: `src/components/screens/BattleWinScreen.tsx`

These are straightforward ports of `src/ui/rest.ts`, `src/ui/gameover.ts`, `src/ui/victory.ts`, and the `showBattleWinSummary` function in `src/main.ts`.

**RestScreen** — note: `runState.heal(1)` must be called once on mount (use `useMemo` or `useState` to capture pre/post HP).

```tsx
// RestScreen.tsx
import { useMemo } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { HpBar } from '../ui/HpBar'
import { RelicBadges } from '../ui/RelicBadges'

export function RestScreen() {
  const runState = useGameStore(s => s.runState)
  const returnToMap = useGameStore(s => s.returnToMap)
  if (!runState) return null

  const healed = useMemo(() => {
    const before = runState.playerHp
    runState.heal(1)
    return runState.playerHp - before
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col justify-center items-center gap-5 py-5 min-h-screen animate-fade-in">
      <h2 className="text-green text-2xl">休息站</h2>
      <div className="text-3xl my-2">🔧</div>
      <div className="text-center">
        <div className="text-base text-green mb-3">
          {healed > 0 ? `回复了 ${healed} 点 HP` : 'HP 已满，无法回复'}
        </div>
        <div className="w-[200px]">
          <HpBar label="HP" hp={runState.playerHp} maxHp={runState.maxHp} variant="player" />
        </div>
      </div>
      <RelicBadges relics={runState.relics.list()} />
      <button
        className="bg-red border border-red-bright text-white px-12 py-3.5 mt-4 rounded hover:bg-red-bright"
        onClick={returnToMap}
      >
        继续
      </button>
    </div>
  )
}
```

**GameOverScreen, VictoryScreen, BattleWinScreen** — similarly ported. Each uses store state and `returnToTitle`/`returnToMap` actions.

**Commit after all four are created.**

---

## Task 8: Create ShopScreen

**Files:**
- Create: `src/components/screens/ShopScreen.tsx`

Ports `src/ui/shop.ts`. Shop items are generated with `useState` on mount (same `generateShopItems` logic). Buy logic mutates `runState` + local shop state.

Reference: `src/ui/shop.ts:35-77` for `generateShopItems`, `src/ui/shop.ts:143-165` for buy logic.

**Commit after creation.**

---

## Task 9: Create GambleScreen

**Files:**
- Create: `src/components/screens/GambleScreen.tsx`

Ports `src/ui/gamble.ts`. Uses `useState` for dice state and a `setTimeout` for the reveal animation.

Reference: `src/ui/gamble.ts:5-90`

**Commit after creation.**

---

## Task 10: Create BattleScreen

**Files:**
- Create: `src/components/screens/BattleScreen.tsx`

The largest screen component. Reads all battle state from store. Renders:
- Dealer HP bar (with portrait via AssetImage)
- Turn indicator
- Shell indicators
- Message log
- Dealer items (info display)
- Player items (clickable buttons)
- Shoot opponent / Shoot self buttons
- Player HP bar + chips + relics

Key behaviors:
- All buttons disabled when `busy || !isPlayerTurn`
- Calls `store.playerShoot()` and `store.usePlayerItem()` on click
- Dealer turn is driven by store (setTimeout in actions), component just re-renders reactively

Reference: `src/ui/battle.ts:106-227` for render layout, adapted to JSX + Tailwind.

**Commit after creation.**

---

## Task 11: Wire Up App.tsx & BGM

**Files:**
- Modify: `src/components/App.tsx`

Replace the placeholder with the full screen router. Import all screen components. Add `useEffect` for BGM on screen change.

```tsx
import { useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import { audio } from '../audio'
import { TitleScreen } from './screens/TitleScreen'
import { MapScreen } from './screens/MapScreen'
import { BattleScreen } from './screens/BattleScreen'
import { BattleWinScreen } from './screens/BattleWinScreen'
import { ShopScreen } from './screens/ShopScreen'
import { GambleScreen } from './screens/GambleScreen'
import { RestScreen } from './screens/RestScreen'
import { GameOverScreen } from './screens/GameOverScreen'
import { VictoryScreen } from './screens/VictoryScreen'

const SCREEN_BGM: Record<string, string> = {
  title: 'title',
  map: 'map',
  battle: 'battle',
  'battle-win': 'battle',
  shop: 'shop',
  gamble: 'map',
  rest: 'map',
  gameover: 'gameover',
  victory: 'victory',
}

const BG_IMAGES: Record<string, string> = {
  title: '/assets/images/bg/title.png',
  map: '/assets/images/bg/map.png',
  battle: '/assets/images/bg/battle.png',
  'battle-win': '/assets/images/bg/battle.png',
  shop: '/assets/images/bg/shop.png',
  gamble: '/assets/images/bg/gamble.png',
  rest: '/assets/images/bg/rest.png',
  gameover: '/assets/images/bg/gameover.png',
  victory: '/assets/images/bg/victory.png',
}

function ScreenRenderer({ screen }: { screen: string }) {
  switch (screen) {
    case 'title': return <TitleScreen />
    case 'map': return <MapScreen />
    case 'battle': return <BattleScreen />
    case 'battle-win': return <BattleWinScreen />
    case 'shop': return <ShopScreen />
    case 'gamble': return <GambleScreen />
    case 'rest': return <RestScreen />
    case 'gameover': return <GameOverScreen />
    case 'victory': return <VictoryScreen />
    default: return null
  }
}

export function App() {
  const screen = useGameStore(s => s.screen)

  useEffect(() => {
    const track = SCREEN_BGM[screen]
    if (track) audio.playBGM(track)
  }, [screen])

  return (
    <div
      className="w-full max-w-[480px] min-h-screen relative font-mono text-white p-5 flex flex-col"
      style={{
        backgroundImage: `url(${BG_IMAGES[screen]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#0a0a0a',
      }}
    >
      <ScreenRenderer screen={screen} />
    </div>
  )
}
```

**Commit after modification.**

---

## Task 12: Delete Old Files & Clean Up

**Files:**
- Delete: `src/ui/battle.ts`
- Delete: `src/ui/map.ts`
- Delete: `src/ui/shop.ts`
- Delete: `src/ui/gamble.ts`
- Delete: `src/ui/rest.ts`
- Delete: `src/ui/gameover.ts`
- Delete: `src/ui/victory.ts`
- Delete: `src/main.ts`
- Delete: `src/styles/main.css`

```bash
rm -rf src/ui src/main.ts src/styles
```

**Commit:**

```bash
git add -A
git commit -m "refactor: remove old vanilla UI layer and entry point"
```

---

## Task 13: Final Verification

**Step 1: TypeScript check**

```bash
npx tsc --noEmit
```

Fix any type errors.

**Step 2: Build**

```bash
npm run build
```

**Step 3: Dev server smoke test**

```bash
npm run dev
```

Manually verify in browser:
- Title screen renders, start button works
- Map shows path options, clicking navigates correctly
- Battle: shooting, items, dealer AI turns, win/lose
- Shop: buying items, leaving
- Gamble: dice animation, result
- Rest: heal display
- Game over / Victory: stats display, restart

**Step 4: Run existing model tests**

```bash
npm test
```

These should still pass since models are untouched.

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete React + Zustand + Tailwind migration"
```
