import { rng } from './rng'

export type Shell = 'live' | 'blank'

export class Chamber {
  private shells: Shell[]

  constructor(liveCount: number, blankCount: number) {
    this.shells = [
      ...Array(liveCount).fill('live' as Shell),
      ...Array(blankCount).fill('blank' as Shell),
    ]
    this.shuffle()
  }

  static fromSequence(shells: Shell[]): Chamber {
    const c = Object.create(Chamber.prototype) as Chamber
    c.shells = [...shells]
    return c
  }

  get liveCount(): number {
    return this.shells.filter(s => s === 'live').length
  }

  get blankCount(): number {
    return this.shells.filter(s => s === 'blank').length
  }

  get totalRemaining(): number {
    return this.shells.length
  }

  get isEmpty(): boolean {
    return this.shells.length === 0
  }

  peek(): Shell {
    return this.shells[0]
  }

  peekAt(index: number): Shell {
    return this.shells[index]
  }

  draw(): Shell {
    return this.shells.shift()!
  }

  ejectCurrent(): Shell {
    return this.shells.shift()!
  }

  invertCurrent(): void {
    this.shells[0] = this.shells[0] === 'live' ? 'blank' : 'live'
  }

  private shuffle(): void {
    for (let i = this.shells.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[this.shells[i], this.shells[j]] = [this.shells[j], this.shells[i]]
    }
  }
}
