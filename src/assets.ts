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
