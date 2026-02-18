# Image & Audio Assets Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an asset integration framework (images + audio) with graceful fallback to current text/emoji when assets are missing.

**Architecture:** Create an AudioManager singleton for BGM/SFX control, an assets module for image path constants with fallback helpers, then modify existing UI files to render `<img>` tags and CSS backgrounds. All asset references use convention-based paths under `public/assets/`. Missing assets silently fall back to current rendering.

**Tech Stack:** Vanilla TypeScript, HTML5 Audio API, CSS background-image, Vite static asset serving

---

### Task 1: Create directory structure and asset path constants

**Files:**
- Create: `src/assets.ts`

**Step 1: Create the public/assets directory tree**

```bash
mkdir -p public/assets/images/{bg,dealers,items,shells,relics}
mkdir -p public/assets/audio/{bgm,sfx}
```

**Step 2: Write asset path module**

```typescript
// src/assets.ts
import type { ItemType } from './models/items'
import type { DealerType } from './models/dealer'
import type { RelicType } from './models/relics'

const BASE = '/assets'

export const BG_IMAGES: Record<string, string> = {
  title: `${BASE}/images/bg/title.png`,
  map: `${BASE}/images/bg/map.png`,
  battle: `${BASE}/images/bg/battle.png`,
  shop: `${BASE}/images/bg/shop.png`,
  gamble: `${BASE}/images/bg/gamble.png`,
  rest: `${BASE}/images/bg/rest.png`,
  victory: `${BASE}/images/bg/victory.png`,
  gameover: `${BASE}/images/bg/gameover.png`,
}

export const DEALER_IMAGES: Record<DealerType, string> = {
  degen: `${BASE}/images/dealers/degen.png`,
  coward: `${BASE}/images/dealers/coward.png`,
  maniac: `${BASE}/images/dealers/maniac.png`,
  mimic: `${BASE}/images/dealers/mimic.png`,
  paranoid: `${BASE}/images/dealers/paranoid.png`,
}

export const ITEM_IMAGES: Record<ItemType, string> = {
  magnifying_glass: `${BASE}/images/items/magnifying_glass.png`,
  handsaw: `${BASE}/images/items/handsaw.png`,
  beer: `${BASE}/images/items/beer.png`,
  cigarette: `${BASE}/images/items/cigarette.png`,
  handcuffs: `${BASE}/images/items/handcuffs.png`,
  inverter: `${BASE}/images/items/inverter.png`,
  burner_phone: `${BASE}/images/items/burner_phone.png`,
  expired_medicine: `${BASE}/images/items/expired_medicine.png`,
  adrenaline: `${BASE}/images/items/adrenaline.png`,
}

export const RELIC_IMAGES: Record<RelicType, string> = {
  demons_eye: `${BASE}/images/relics/demons_eye.png`,
  blood_pact: `${BASE}/images/relics/blood_pact.png`,
  cursed_shell: `${BASE}/images/relics/cursed_shell.png`,
  black_handcuffs: `${BASE}/images/relics/black_handcuffs.png`,
  lucky_coin: `${BASE}/images/relics/lucky_coin.png`,
  soul_steal: `${BASE}/images/relics/soul_steal.png`,
  hell_cigarettes: `${BASE}/images/relics/hell_cigarettes.png`,
  broken_lens: `${BASE}/images/relics/broken_lens.png`,
}

export const BGM_TRACKS: Record<string, string> = {
  title: `${BASE}/audio/bgm/title.mp3`,
  map: `${BASE}/audio/bgm/map.mp3`,
  battle: `${BASE}/audio/bgm/battle.mp3`,
  shop: `${BASE}/audio/bgm/shop.mp3`,
  victory: `${BASE}/audio/bgm/victory.mp3`,
  gameover: `${BASE}/audio/bgm/gameover.mp3`,
}

export const SFX: Record<string, string> = {
  gunshot: `${BASE}/audio/sfx/gunshot.mp3`,
  blank_click: `${BASE}/audio/sfx/blank_click.mp3`,
  hurt: `${BASE}/audio/sfx/hurt.mp3`,
  item_use: `${BASE}/audio/sfx/item_use.mp3`,
  reload: `${BASE}/audio/sfx/reload.mp3`,
  ui_click: `${BASE}/audio/sfx/ui_click.mp3`,
  victory_sting: `${BASE}/audio/sfx/victory_sting.mp3`,
  death: `${BASE}/audio/sfx/death.mp3`,
  dice_roll: `${BASE}/audio/sfx/dice_roll.mp3`,
}

/**
 * Returns an <img> tag that hides itself on error (asset missing).
 * Use `fallback` for text/emoji shown when image fails.
 */
export function assetImg(
  src: string,
  alt: string,
  size: number,
  fallback: string,
  extraStyle = '',
): string {
  return `<img src="${src}" alt="${alt}" width="${size}" height="${size}" style="image-rendering:pixelated;${extraStyle}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span style="display:none">${fallback}</span>`
}
```

**Step 3: Commit**

```bash
git add src/assets.ts public/assets
git commit -m "feat: add asset path constants and directory structure"
```

---

### Task 2: Create AudioManager

**Files:**
- Create: `src/audio.ts`

**Step 1: Write AudioManager**

```typescript
// src/audio.ts
import { BGM_TRACKS, SFX } from './assets'

class AudioManager {
  private bgm: HTMLAudioElement | null = null
  private currentTrack = ''
  private _muted: boolean
  private sfxCache: Map<string, HTMLAudioElement> = new Map()
  private unlocked = false

  constructor() {
    this._muted = localStorage.getItem('muted') === 'true'
  }

  get muted(): boolean {
    return this._muted
  }

  toggleMute(): boolean {
    this._muted = !this._muted
    localStorage.setItem('muted', String(this._muted))
    if (this.bgm) {
      this.bgm.muted = this._muted
    }
    return this._muted
  }

  /**
   * Must be called from a user gesture (click) to unlock audio on mobile browsers.
   */
  unlock(): void {
    if (this.unlocked) return
    this.unlocked = true
    // Resume AudioContext if needed
    if (this.bgm && this.bgm.paused && !this._muted) {
      this.bgm.play().catch(() => {})
    }
  }

  playBGM(track: string): void {
    const src = BGM_TRACKS[track]
    if (!src || this.currentTrack === track) return

    this.currentTrack = track

    if (this.bgm) {
      this.bgm.pause()
      this.bgm.currentTime = 0
    }

    this.bgm = new Audio(src)
    this.bgm.loop = !['victory', 'gameover'].includes(track)
    this.bgm.volume = 0.4
    this.bgm.muted = this._muted

    if (this.unlocked) {
      this.bgm.play().catch(() => {
        // Audio file missing or browser blocked — silent fail
      })
    }
  }

  stopBGM(): void {
    if (this.bgm) {
      this.bgm.pause()
      this.bgm.currentTime = 0
    }
    this.currentTrack = ''
  }

  playSFX(name: string): void {
    if (this._muted) return
    const src = SFX[name]
    if (!src) return

    try {
      const audio = new Audio(src)
      audio.volume = 0.5
      audio.play().catch(() => {
        // Audio file missing — silent fail
      })
    } catch {
      // Silent fail
    }
  }
}

export const audio = new AudioManager()
```

**Step 2: Commit**

```bash
git add src/audio.ts
git commit -m "feat: add AudioManager with BGM/SFX and mute toggle"
```

---

### Task 3: Add background images to screens via CSS

**Files:**
- Modify: `src/styles/main.css`

**Step 1: Add screen background styles**

Append to the end of `src/styles/main.css`:

```css
/* Screen backgrounds — shown when asset images exist */
#screen-title { background: url('/assets/images/bg/title.png') center/cover no-repeat var(--bg); }
#screen-map { background: url('/assets/images/bg/map.png') center/cover no-repeat var(--bg); }
#screen-battle { background: url('/assets/images/bg/battle.png') center/cover no-repeat var(--bg); }
#screen-shop { background: url('/assets/images/bg/shop.png') center/cover no-repeat var(--bg); }
#screen-gamble { background: url('/assets/images/bg/gamble.png') center/cover no-repeat var(--bg); }
#screen-rest { background: url('/assets/images/bg/rest.png') center/cover no-repeat var(--bg); }
#screen-gameover { background: url('/assets/images/bg/gameover.png') center/cover no-repeat var(--bg); }
#screen-victory { background: url('/assets/images/bg/victory.png') center/cover no-repeat var(--bg); }
```

The `var(--bg)` fallback color ensures the current dark background shows when images are missing. CSS `background-image` silently ignores missing files.

**Step 2: Commit**

```bash
git add src/styles/main.css
git commit -m "feat: add CSS background images for all screens with fallback"
```

---

### Task 4: Add dealer portraits to BattleUI

**Files:**
- Modify: `src/ui/battle.ts:1-10` (add import)
- Modify: `src/ui/battle.ts:150-162` (render method, dealer section)

**Step 1: Add import**

Add to existing imports in `src/ui/battle.ts`:

```typescript
import { DEALER_IMAGES, assetImg } from '../assets'
```

**Step 2: Add dealer portrait to render()**

In the render() method of BattleUI, find the dealer HP section (around line 153-162). Replace the dealer name `<span>` line:

```html
<span style="font-size:14px;color:var(--red-bright)">${dealer.name}</span>
```

With:

```html
<span style="font-size:14px;color:var(--red-bright);display:flex;align-items:center;gap:8px">
  ${assetImg(DEALER_IMAGES[this.dealerType], dealer.name, 32, '', 'vertical-align:middle')}${dealer.name}
</span>
```

**Step 3: Commit**

```bash
git add src/ui/battle.ts
git commit -m "feat: add dealer portraits to battle UI with fallback"
```

---

### Task 5: Add item icons to BattleUI and Shop

**Files:**
- Modify: `src/ui/battle.ts:126-130` (player item buttons)
- Modify: `src/ui/shop.ts:1-6` (add import)
- Modify: `src/ui/shop.ts:101-106` (shop item display)

**Step 1: Add item icon import to battle.ts**

The import from Task 4 already includes `assetImg`. Add `ITEM_IMAGES`:

```typescript
import { DEALER_IMAGES, ITEM_IMAGES, assetImg } from '../assets'
```

**Step 2: Update item button rendering in BattleUI.render()**

Find the item button rendering (around line 126-130). In the loop:

```typescript
itemsHtml += `<button class="item-btn" data-item-idx="${idx}" ${disabled} title="${def.description}">${def.name}</button>`
```

Replace with:

```typescript
itemsHtml += `<button class="item-btn" data-item-idx="${idx}" ${disabled} title="${def.description}">${assetImg(ITEM_IMAGES[item], def.name, 20, def.name, 'vertical-align:middle;margin-right:4px')}</button>`
```

**Step 3: Add import to shop.ts**

```typescript
import { ITEM_IMAGES, RELIC_IMAGES, assetImg } from '../assets'
```

**Step 4: Update shop item rendering**

In `renderShop()` render function, find the item name display (around line 106):

```html
<span style="font-size:14px">${kindIcon} ${item.name}</span>
```

Replace with:

```typescript
const iconSrc = item.kind === 'item' && item.itemType
  ? assetImg(ITEM_IMAGES[item.itemType], item.name, 24, kindIcon, 'vertical-align:middle;margin-right:4px')
  : item.kind === 'relic' && item.relicType
  ? assetImg(RELIC_IMAGES[item.relicType], item.name, 24, kindIcon, 'vertical-align:middle;margin-right:4px')
  : kindIcon
```

Then use `${iconSrc} ${item.name}` in the HTML.

**Step 5: Commit**

```bash
git add src/ui/battle.ts src/ui/shop.ts
git commit -m "feat: add item icons to battle and shop UI with fallback"
```

---

### Task 6: Add mute toggle and wire BGM to screen transitions

**Files:**
- Modify: `src/main.ts:1-11` (add imports)
- Modify: `src/main.ts:16-19` (showScreen function)
- Modify: `src/main.ts:25-37` (renderTitle function)

**Step 1: Add imports to main.ts**

```typescript
import { audio } from './audio'
```

**Step 2: Add BGM mapping and wire to showScreen**

Add a BGM mapping constant near the top of main.ts:

```typescript
const SCREEN_BGM: Record<string, string> = {
  'screen-title': 'title',
  'screen-map': 'map',
  'screen-battle': 'battle',
  'screen-shop': 'shop',
  'screen-gamble': 'map',   // reuse map theme
  'screen-rest': 'map',     // reuse map theme
  'screen-gameover': 'gameover',
  'screen-victory': 'victory',
}
```

Modify `showScreen()` to trigger BGM:

```typescript
function showScreen(id: string): void {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.getElementById(id)?.classList.add('active')

  const track = SCREEN_BGM[id]
  if (track) {
    audio.playBGM(track)
  }
}
```

**Step 3: Add mute toggle button to renderTitle**

In `renderTitle()`, add a mute button to the title screen HTML, right after the start button:

```html
<button id="btn-mute" style="position:absolute;top:16px;right:16px;padding:8px 12px;font-size:12px;background:transparent;border:1px solid var(--gray)">
  ${audio.muted ? '🔇' : '🔊'}
</button>
```

Then bind the click:

```typescript
document.getElementById('btn-mute')!.onclick = () => {
  audio.toggleMute()
  renderTitle()
}
```

**Step 4: Unlock audio on first user interaction**

In the start button click handler in `renderTitle()`, add:

```typescript
document.getElementById('btn-start')!.onclick = () => {
  audio.unlock()
  startRun()
}
```

**Step 5: Commit**

```bash
git add src/main.ts
git commit -m "feat: wire BGM to screen transitions and add mute toggle"
```

---

### Task 7: Wire SFX to game actions

**Files:**
- Modify: `src/ui/battle.ts` (shoot actions, item use, reload, finishBattle)
- Modify: `src/ui/gamble.ts` (dice roll)

**Step 1: Add audio import to battle.ts**

```typescript
import { audio } from '../audio'
```

**Step 2: Add SFX calls in BattleUI**

In `playerShoot()` (around line 366-380), after determining the shell result:

```typescript
// After: result = this.battle.shootOpponent() or shootSelf()
audio.playSFX(result.shell === 'live' ? 'gunshot' : 'blank_click')
if (result.shell === 'live' && result.damage > 0) {
  audio.playSFX('hurt')
}
```

In `dealerTurn()` (around line 443-457), after the dealer shoots:

```typescript
// After: result = this.battle.shootOpponent() or shootSelf()
audio.playSFX(result.shell === 'live' ? 'gunshot' : 'blank_click')
if (result.shell === 'live' && result.damage > 0) {
  audio.playSFX('hurt')
}
```

In `usePlayerItem()` (around line 252), at the top after validation:

```typescript
audio.playSFX('item_use')
```

In `loadNewRound()` (around line 59), at the start:

```typescript
audio.playSFX('reload')
```

In `finishBattle()` (around line 571), after determining winner:

```typescript
audio.playSFX(winner === 'player' ? 'victory_sting' : 'death')
```

**Step 3: Add SFX to gamble.ts**

Add import:

```typescript
import { audio } from '../audio'
```

When dice are revealed (inside the setTimeout around line 55):

```typescript
audio.playSFX('dice_roll')
```

**Step 4: Commit**

```bash
git add src/ui/battle.ts src/ui/gamble.ts
git commit -m "feat: wire SFX to game actions (combat, items, gamble)"
```

---

### Task 8: Run all tests and verify

**Step 1: Run unit tests**

```bash
npx vitest run
```

Expected: ALL PASS (56 tests). The new modules (`assets.ts`, `audio.ts`) don't have unit tests since they're pure path constants and browser API wrappers. Existing tests should not be affected.

**Step 2: Run e2e tests**

```bash
LD_LIBRARY_PATH="/snap/cups/1147/usr/lib/aarch64-linux-gnu:$LD_LIBRARY_PATH" npx playwright test
```

Expected: ALL PASS (4 tests). Asset files are missing but all references have silent fallbacks — `<img onerror>` hides missing images, CSS `background-image` ignores missing files, `Audio.play().catch()` swallows missing audio errors.

**Step 3: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Game should look and behave exactly as before (no assets = all fallbacks active). Verify:
- No console errors about missing assets (all caught)
- Mute button visible on title screen
- All screens functional

**Step 4: Final commit if any adjustments**

```bash
git add -A
git commit -m "chore: finalize asset integration framework"
```

---

## After Implementation

Once the code framework is in place, the user can add assets by simply dropping files into `public/assets/` following the naming convention. No code changes needed — the framework automatically picks up matching files.
