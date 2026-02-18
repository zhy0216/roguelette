export type ItemType =
  | 'magnifying_glass'
  | 'handsaw'
  | 'beer'
  | 'cigarette'
  | 'handcuffs'
  | 'inverter'
  | 'burner_phone'
  | 'expired_medicine'
  | 'adrenaline'

export interface ItemDefinition {
  name: string
  description: string
  advanced: boolean
}

export const ITEM_DEFINITIONS: Record<ItemType, ItemDefinition> = {
  magnifying_glass: { name: '放大镜', description: '查看当前弹药类型', advanced: false },
  handsaw: { name: '手锯', description: '当前实弹伤害翻倍', advanced: false },
  beer: { name: '啤酒', description: '退出当前弹药并揭示类型', advanced: false },
  cigarette: { name: '香烟', description: '回复 1 HP', advanced: false },
  handcuffs: { name: '手铐', description: '跳过对手下一回合', advanced: false },
  inverter: { name: '逆转器', description: '当前弹药类型反转', advanced: true },
  burner_phone: { name: '一次性手机', description: '揭示某个未来位置的弹药', advanced: true },
  expired_medicine: { name: '过期药物', description: '50%回复2HP, 50%扣1HP', advanced: true },
  adrenaline: { name: '肾上腺素', description: '偷取对手一个道具', advanced: true },
}

import { rng } from './rng'

const BASIC_ITEMS: ItemType[] = ['magnifying_glass', 'handsaw', 'beer', 'cigarette', 'handcuffs']
const ADVANCED_ITEMS: ItemType[] = ['inverter', 'burner_phone', 'expired_medicine', 'adrenaline']

export function distributeItems(includeAdvanced: boolean): ItemType[] {
  const pool = includeAdvanced ? [...BASIC_ITEMS, ...ADVANCED_ITEMS] : [...BASIC_ITEMS]
  const count = 2 + Math.floor(rng() * 3) // 2-4
  const result: ItemType[] = []
  for (let i = 0; i < count; i++) {
    result.push(pool[Math.floor(rng() * pool.length)])
  }
  return result
}
