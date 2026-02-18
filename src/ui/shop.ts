import type { RunState } from '../models/run'
import type { ItemType } from '../models/items'
import { ITEM_DEFINITIONS } from '../models/items'
import type { RelicType } from '../models/relics'
import { RELIC_DEFINITIONS } from '../models/relics'

interface ShopItem {
  kind: 'item' | 'relic' | 'heal'
  itemType?: ItemType
  relicType?: RelicType
  name: string
  description: string
  price: number
  sold: boolean
}

function getRandomItem(): ItemType {
  const allItems: ItemType[] = [
    'magnifying_glass', 'handsaw', 'beer', 'cigarette', 'handcuffs',
    'inverter', 'burner_phone', 'expired_medicine', 'adrenaline',
  ]
  return allItems[Math.floor(Math.random() * allItems.length)]
}

function getRandomRelic(): RelicType {
  const allRelics: RelicType[] = [
    'demons_eye', 'blood_pact', 'cursed_shell', 'black_handcuffs',
    'lucky_coin', 'soul_steal', 'hell_cigarettes', 'broken_lens',
  ]
  return allRelics[Math.floor(Math.random() * allRelics.length)]
}

function generateShopItems(): ShopItem[] {
  const items: ShopItem[] = []

  // 1-2 consumable items
  const consumableCount = 1 + Math.floor(Math.random() * 2)
  for (let i = 0; i < consumableCount; i++) {
    const itemType = getRandomItem()
    const def = ITEM_DEFINITIONS[itemType]
    items.push({
      kind: 'item',
      itemType,
      name: def.name,
      description: def.description,
      price: 1 + Math.floor(Math.random() * 3), // 1-3
      sold: false,
    })
  }

  // 0-1 relic
  if (Math.random() < 0.6) {
    const relicType = getRandomRelic()
    const def = RELIC_DEFINITIONS[relicType]
    items.push({
      kind: 'relic',
      relicType,
      name: def.name,
      description: def.description,
      price: 5 + Math.floor(Math.random() * 4), // 5-8
      sold: false,
    })
  }

  // 1 heal option
  items.push({
    kind: 'heal',
    name: '回复 1 HP',
    description: '恢复 1 点生命值',
    price: 3,
    sold: false,
  })

  return items
}

export function renderShop(
  container: HTMLElement,
  runState: RunState,
  onComplete: () => void,
): void {
  const shopItems = generateShopItems()

  function render(): void {
    let itemsHtml = ''
    shopItems.forEach((item, idx) => {
      const canAfford = runState.chips >= item.price
      const isFull = item.kind === 'relic' && runState.relics.count >= 4
      const disabled = item.sold || !canAfford || isFull

      let statusText = ''
      if (item.sold) {
        statusText = '<span style="color:var(--gray)">已购买</span>'
      } else if (isFull) {
        statusText = '<span style="color:var(--red-bright)">遗物栏已满</span>'
      } else if (!canAfford) {
        statusText = '<span style="color:var(--gray)">筹码不足</span>'
      }

      const kindIcon = item.kind === 'item' ? '📦' : item.kind === 'relic' ? '💎' : '❤️'

      itemsHtml += `
        <div style="background:var(--bg-card);border:1px solid ${item.sold ? 'var(--gray)' : 'var(--gray)'};border-radius:8px;padding:16px;opacity:${item.sold ? '0.5' : '1'}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-size:14px">${kindIcon} ${item.name}</span>
            <span class="chips">${item.price} 筹码</span>
          </div>
          <div style="font-size:12px;color:var(--gray-light);margin-bottom:12px">${item.description}</div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <button class="shop-buy-btn" data-shop-idx="${idx}" ${disabled ? 'disabled' : ''} style="padding:8px 16px;font-size:12px">
              ${item.sold ? '已购买' : '购买'}
            </button>
            ${statusText ? `<span style="font-size:11px">${statusText}</span>` : ''}
          </div>
        </div>
      `
    })

    container.innerHTML = `
      <div class="fade-in" style="display:flex;flex-direction:column;gap:16px;padding:20px 0;min-height:100vh">
        <h2 style="text-align:center;color:var(--gold)">恶魔商店</h2>
        <div style="text-align:center">
          <span class="chips" style="font-size:16px">筹码: ${runState.chips}</span>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px">
          ${itemsHtml}
        </div>

        <div style="margin-top:auto;padding-top:16px">
          <button class="primary" id="btn-leave-shop" style="width:100%;padding:14px">离开商店</button>
        </div>
      </div>
    `

    // Bind buy buttons
    const buyBtns = container.querySelectorAll('.shop-buy-btn[data-shop-idx]')
    buyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt((btn as HTMLElement).dataset.shopIdx!, 10)
        const item = shopItems[idx]
        if (item.sold) return

        if (!runState.spendChips(item.price)) return

        item.sold = true

        if (item.kind === 'item' && item.itemType) {
          runState.purchasedItems.push(item.itemType)
        } else if (item.kind === 'relic' && item.relicType) {
          runState.relics.add(item.relicType)
        } else if (item.kind === 'heal') {
          runState.heal(1)
        }

        render()
      })
    })

    // Bind leave button
    document.getElementById('btn-leave-shop')?.addEventListener('click', () => {
      onComplete()
    })
  }

  render()
}
