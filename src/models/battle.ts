import type { Chamber, Shell } from './chamber'

export type Turn = 'player' | 'dealer'
export type Winner = 'player' | 'dealer' | null

export interface ShootResult {
  shell: Shell
  damage: number
  target: 'opponent' | 'self'
}

export class Battle {
  playerHp: number
  dealerHp: number
  currentTurn: Turn
  private chamber: Chamber | null = null
  private sawedOff = false
  private handcuffsActive = false

  constructor(playerHp: number, dealerHp: number) {
    this.playerHp = playerHp
    this.dealerHp = dealerHp
    this.currentTurn = 'player'
  }

  loadChamber(chamber: Chamber): void {
    this.chamber = chamber
  }

  get winner(): Winner {
    if (this.dealerHp <= 0) return 'player'
    if (this.playerHp <= 0) return 'dealer'
    return null
  }

  get needsReload(): boolean {
    return this.winner === null && (this.chamber === null || this.chamber.isEmpty)
  }

  get currentChamber(): Chamber | null {
    return this.chamber
  }

  setSawedOff(active: boolean): void {
    this.sawedOff = active
  }

  setHandcuffs(active: boolean): void {
    this.handcuffsActive = active
  }

  shootOpponent(): ShootResult {
    const shell = this.chamber!.draw()
    const damage = shell === 'live' ? (this.sawedOff ? 2 : 1) : 0
    this.sawedOff = false

    if (this.currentTurn === 'player') {
      this.dealerHp = Math.max(0, this.dealerHp - damage)
    } else {
      this.playerHp = Math.max(0, this.playerHp - damage)
    }

    if (!this.handcuffsActive) {
      this.switchTurn()
    }
    this.handcuffsActive = false

    return { shell, damage, target: 'opponent' }
  }

  shootSelf(): ShootResult {
    const shell = this.chamber!.draw()
    const damage = shell === 'live' ? (this.sawedOff ? 2 : 1) : 0
    this.sawedOff = false

    if (this.currentTurn === 'player') {
      this.playerHp = Math.max(0, this.playerHp - damage)
    } else {
      this.dealerHp = Math.max(0, this.dealerHp - damage)
    }

    // Shoot self: live = switch turn, blank = keep turn
    if (shell === 'live') {
      this.handcuffsActive = false
      this.switchTurn()
    }

    return { shell, damage, target: 'self' }
  }

  private switchTurn(): void {
    this.currentTurn = this.currentTurn === 'player' ? 'dealer' : 'player'
  }
}
