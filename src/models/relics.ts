export type RelicType =
  | 'demons_eye'
  | 'blood_pact'
  | 'cursed_shell'
  | 'black_handcuffs'
  | 'lucky_coin'
  | 'soul_steal'
  | 'hell_cigarettes'
  | 'broken_lens'

export interface RelicDefinition {
  name: string
  description: string
}

export const RELIC_DEFINITIONS: Record<RelicType, RelicDefinition> = {
  demons_eye: { name: '恶魔之眼', description: '每局开始时自动查看第一发弹药类型' },
  blood_pact: { name: '血契', description: '每次对局胜利回复1HP' },
  cursed_shell: { name: '诅咒弹壳', description: '实弹有20%概率造成双倍伤害' },
  black_handcuffs: { name: '黑铁手铐', description: '每局第一回合自动给对手上铐' },
  lucky_coin: { name: '幸运硬币', description: '射自己遇到实弹时30%概率不扣血' },
  soul_steal: { name: '灵魂窃取', description: '击杀荷官时回复2HP' },
  hell_cigarettes: { name: '地狱烟盒', description: '每局额外获得1根香烟' },
  broken_lens: { name: '破碎镜片', description: '放大镜使用后不消耗(每局限一次)' },
}

const MAX_RELICS = 4

export class RelicInventory {
  private relics: RelicType[] = []

  get count(): number {
    return this.relics.length
  }

  has(relic: RelicType): boolean {
    return this.relics.includes(relic)
  }

  add(relic: RelicType): boolean {
    if (this.relics.length >= MAX_RELICS) return false
    this.relics.push(relic)
    return true
  }

  remove(relic: RelicType): void {
    this.relics = this.relics.filter(r => r !== relic)
  }

  list(): RelicType[] {
    return [...this.relics]
  }
}
