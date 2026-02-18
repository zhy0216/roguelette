import { DealerType } from './dealer'
import { RelicInventory } from './relics'

export type NodeType = 'combat' | 'shop' | 'gamble' | 'rest'

const BOSS_LAYERS = [5, 1]
const ALL_NODE_TYPES: NodeType[] = ['combat', 'shop', 'gamble', 'rest']

export class RunState {
  currentLayer: number = 7
  playerHp: number = 4
  maxHp: number = 6
  chips: number = 0
  relics: RelicInventory = new RelicInventory()

  get isBossLayer(): boolean {
    return BOSS_LAYERS.includes(this.currentLayer)
  }

  get isDead(): boolean {
    return this.playerHp <= 0
  }

  get isVictory(): boolean {
    return this.currentLayer <= 0
  }

  ascend(): void {
    this.currentLayer--
  }

  getPathOptions(): NodeType[] {
    if (this.isBossLayer) return ['combat']
    const pool = [...ALL_NODE_TYPES]
    const result: NodeType[] = []
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * pool.length)
      result.push(pool[idx])
    }
    return result
  }

  takeDamage(amount: number): void {
    this.playerHp = Math.max(0, this.playerHp - amount)
  }

  heal(amount: number): void {
    this.playerHp = Math.min(this.maxHp, this.playerHp + amount)
  }

  addChips(amount: number): void {
    this.chips += amount
  }

  spendChips(amount: number): boolean {
    if (this.chips < amount) return false
    this.chips -= amount
    return true
  }

  getDealerHp(): number {
    if (this.currentLayer === 1) return 6
    if (this.currentLayer === 5) return this.playerHp
    const hp = Math.ceil((8 - this.currentLayer) / 2) + 1
    return Math.max(2, Math.min(4, hp))
  }

  getRandomDealerType(): DealerType {
    if (this.currentLayer === 5) return 'mimic'
    if (this.currentLayer === 1) return 'paranoid'
    const types: DealerType[] = ['degen', 'coward', 'maniac', 'mimic', 'paranoid']
    return types[Math.floor(Math.random() * types.length)]
  }
}
