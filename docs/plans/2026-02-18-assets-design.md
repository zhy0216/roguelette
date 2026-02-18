# Image & Audio Assets — Design Document

## Goal

Add pixel art images (backgrounds, character sprites, item icons) and 8-bit chiptune audio (BGM + sound effects) to all 8 game screens, transforming the current text-only UI into a visually and audibly rich experience.

## Style

- **Art**: Pixel art, dark gothic/fantasy theme, matching the game's hell/demon setting
- **Music**: 8-bit chiptune, dark and atmospheric
- **Color palette**: Must complement existing CSS vars (#0a0a0a bg, #ff2d55 red, #2d8b2d green, #c9a84c gold)

## Asset Inventory

### Images

| Asset | Usage | Size | Format |
|-------|-------|------|--------|
| Title background | #screen-title | 480x800 or tileable | PNG |
| Map background | #screen-map | 480x800 or tileable | PNG |
| Battle background | #screen-battle | 480x300 | PNG |
| Shop background | #screen-shop | 480x300 | PNG |
| Gamble background | #screen-gamble | 480x300 | PNG |
| Rest background | #screen-rest | 480x300 | PNG |
| Victory background | #screen-victory | 480x800 | PNG |
| Game over background | #screen-gameover | 480x800 | PNG |
| Dealer portraits x5 | degen, coward, maniac, mimic, paranoid | 128x128 | PNG |
| Item icons x9 | magnifying_glass, handsaw, beer, cigarette, handcuffs, inverter, burner_phone, expired_medicine, adrenaline | 32x32 | PNG |
| Shell icons x3 | live (red), blank (gray), unknown | 16x16 | PNG |
| Relic icons | Per relic type | 32x32 | PNG |

### Music (BGM)

| Track | Screen | Style | Loop |
|-------|--------|-------|------|
| Title theme | #screen-title | Dark, ominous, rhythmic | 30-60s loop |
| Map/explore theme | #screen-map | Eerie, ambient exploration | 30-60s loop |
| Battle theme | #screen-battle | Fast-paced, intense | 60-90s loop |
| Shop theme | #screen-shop | Quirky, slightly sinister | 30s loop |
| Victory fanfare | #screen-victory | Triumphant, bright | 15-30s, no loop |
| Game over dirge | #screen-gameover | Somber, low | 15-30s, no loop |

Note: Gamble and Rest screens can reuse the Map theme to reduce asset count.

### Sound Effects (SFX)

| Effect | Trigger | Description |
|--------|---------|-------------|
| Gunshot (live) | Shoot with live shell | Loud bang |
| Click (blank) | Shoot with blank shell | Dry click |
| Hurt | Player/dealer takes damage | Impact sound |
| Item use | Any item activated | Generic pickup/use |
| Chamber reload | loadNewRound() | Shells loading |
| UI click | Any button press | Soft click |
| Victory sting | Battle won | Short fanfare |
| Death | Player HP reaches 0 | Low thud/collapse |
| Dice roll | Gamble dice thrown | Rattling dice |

## Recommended Sources

### Images (Pixel Art)

1. **itch.io** (primary) — https://itch.io/game-assets/tag-gothic/tag-pixel-art
   - Search: "dark fantasy UI", "gothic enemy sprites", "dungeon background"
   - Many packs include characters, backgrounds, and icons together
2. **CraftPix** — https://craftpix.net/
   - High-quality bundled packs, dark RPG category
3. **GameDev Market** — https://www.gamedevmarket.net
   - Curated paid packs, consistent quality

### Music (8-bit Chiptune)

1. **itch.io chiptune packs** — https://itch.io/game-assets/tag-chiptune
   - Search: "dark chiptune", "horror 8-bit", "dungeon music"
2. **TunePocket** (subscription) — https://www.tunepocket.com/8-bit-chiptune-music/
   - Large library, commercial license included
3. **Soundimage.org** (free) — https://soundimage.org/chiptunes/
   - Free chiptune collection, direct download
4. **Patrick de Arteaga** (free CC) — https://patrickdearteaga.com/en/chiptune-8-bit-retro/

### Sound Effects

1. **jsfxr** (free generator) — Search "jsfxr" online
   - Generate custom 8-bit sound effects, export as WAV
   - Perfect for gunshots, clicks, UI sounds
2. **SFX Engine** — https://sfxengine.com/sound-effects/chiptune
   - Customizable chiptune SFX
3. **Orange Free Sounds** — https://orangefreesounds.com/8-bit-chiptune-music/
   - Free 8-bit SFX library

## File Organization

```
public/
  assets/
    images/
      bg/
        title.png
        map.png
        battle.png
        shop.png
        gamble.png
        rest.png
        victory.png
        gameover.png
      dealers/
        degen.png
        coward.png
        maniac.png
        mimic.png
        paranoid.png
      items/
        magnifying_glass.png
        handsaw.png
        beer.png
        cigarette.png
        handcuffs.png
        inverter.png
        burner_phone.png
        expired_medicine.png
        adrenaline.png
      shells/
        live.png
        blank.png
        unknown.png
      relics/
        (per relic).png
    audio/
      bgm/
        title.mp3
        map.mp3
        battle.mp3
        shop.mp3
        victory.mp3
        gameover.mp3
      sfx/
        gunshot.mp3
        blank_click.mp3
        hurt.mp3
        item_use.mp3
        reload.mp3
        ui_click.mp3
        victory_sting.mp3
        death.mp3
        dice_roll.mp3
```

## Code Integration Architecture

### Audio Manager (`src/audio.ts`)

A singleton audio manager that handles:
- **BGM**: One `Audio` element, crossfade between tracks on screen change
- **SFX**: Pre-loaded `Audio` pool for instant playback
- **Mute toggle**: Persist to localStorage, accessible from all screens
- **Autoplay policy**: Play BGM on first user interaction (browser requirement)

### Image Integration

- Background images via CSS `background-image` on `.screen` elements
- Dealer portraits rendered as `<img>` in BattleUI
- Item/shell icons replace current text/emoji/CSS-circle with `<img>` elements
- All images loaded via Vite's static asset handling (`/assets/...`)

## Workflow

1. **User downloads assets** from recommended sources
2. **User places files** in `public/assets/` following the directory structure above
3. **We implement code** — AudioManager, CSS backgrounds, image rendering in UI components
4. Assets referenced by path convention — missing assets gracefully fall back to current text/emoji

## Non-goals

- Sprite animations (static images only for v1)
- Dynamic music system (tempo/intensity changes during battle)
- Voice acting
- Video cutscenes
