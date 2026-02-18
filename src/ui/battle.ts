import { Chamber } from '../models/chamber'
import { Battle } from '../models/battle'
import type { ItemType } from '../models/items'
import { ITEM_DEFINITIONS, distributeItems } from '../models/items'
import type { DealerType, DealerAction } from '../models/dealer'
import { DEALERS, getDealerAction } from '../models/dealer'
import { RELIC_DEFINITIONS } from '../models/relics'
import type { RunState } from '../models/run'

export interface BattleResult {
  winner: 'player' | 'dealer'
  chipsEarned: number
}

interface RevealedShell {
  index: number
  type: 'live' | 'blank'
}

export class BattleUI {
  private container!: HTMLElement
  private runState!: RunState
  private dealerType!: DealerType
  private battle!: Battle
  private chamber!: Chamber
  private onComplete!: (result: BattleResult) => void

  private playerItems: ItemType[] = []
  private dealerItems: ItemType[] = []
  private messageLog: string[] = []
  private revealedShells: RevealedShell[] = []
  private currentRevealed: 'live' | 'blank' | null = null
  private busy = false
  private playerLastAction: DealerAction | null = null

  start(
    container: HTMLElement,
    runState: RunState,
    dealerType: DealerType,
    dealerHp: number,
    onComplete: (result: BattleResult) => void,
  ): void {
    this.container = container
    this.runState = runState
    this.dealerType = dealerType
    this.onComplete = onComplete
    this.messageLog = []
    this.playerLastAction = null

    this.battle = new Battle(runState.playerHp, dealerHp)
    this.loadNewRound()
    this.render()
  }

  private loadNewRound(): void {
    const liveCount = 2 + Math.floor(Math.random() * 3) // 2-4
    const blankCount = 2 + Math.floor(Math.random() * 3) // 2-4
    this.chamber = new Chamber(liveCount, blankCount)
    this.battle.loadChamber(this.chamber)

    const includeAdvanced = this.runState.currentLayer <= 5
    this.playerItems = distributeItems(includeAdvanced)
    this.dealerItems = distributeItems(includeAdvanced)

    // Relic: hell_cigarettes - extra cigarette
    if (this.runState.relics.has('hell_cigarettes')) {
      this.playerItems.push('cigarette')
    }

    // Relic: black_handcuffs - auto handcuff on first round
    if (this.runState.relics.has('black_handcuffs')) {
      this.battle.setHandcuffs(true)
      this.addMessage('黑铁手铐自动生效！')
    }

    // Relic: demons_eye - auto peek first shell
    if (this.runState.relics.has('demons_eye')) {
      const first = this.chamber.peek()
      this.currentRevealed = first
      this.addMessage(`恶魔之眼: 第一发是${first === 'live' ? '实弹' : '空弹'}`)
    }

    this.revealedShells = []
  }

  private addMessage(msg: string): void {
    this.messageLog.push(msg)
    if (this.messageLog.length > 3) {
      this.messageLog.shift()
    }
  }

  private render(): void {
    const dealer = DEALERS[this.dealerType]
    const isPlayerTurn = this.battle.currentTurn === 'player'
    const maxDealerHp = this.runState.getDealerHp()
    const dealerHpPct = Math.max(0, (this.battle.dealerHp / maxDealerHp) * 100)
    const playerHpPct = Math.max(0, (this.battle.playerHp / this.runState.maxHp) * 100)

    // Build shell indicators
    const totalShells = this.chamber.totalRemaining
    let shellsHtml = ''
    for (let i = 0; i < totalShells; i++) {
      const revealed = this.revealedShells.find(r => r.index === i)
      if (i === 0 && this.currentRevealed) {
        shellsHtml += `<span class="shell ${this.currentRevealed}"></span>`
      } else if (revealed) {
        shellsHtml += `<span class="shell ${revealed.type}"></span>`
      } else {
        shellsHtml += `<span class="shell unknown"></span>`
      }
    }

    // Build player items
    let itemsHtml = ''
    this.playerItems.forEach((item, idx) => {
      const def = ITEM_DEFINITIONS[item]
      const disabled = this.busy || !isPlayerTurn ? 'disabled' : ''
      itemsHtml += `<button class="item-btn" data-item-idx="${idx}" ${disabled} title="${def.description}">${def.name}</button>`
    })

    // Build relics display
    let relicsHtml = ''
    for (const relic of this.runState.relics.list()) {
      const def = RELIC_DEFINITIONS[relic]
      relicsHtml += `<span class="relic-badge" title="${def.description}">${def.name}</span>`
    }

    // Build message log
    let logHtml = ''
    for (const msg of this.messageLog) {
      logHtml += `<div style="font-size:12px;color:var(--gray-light);margin:2px 0">${msg}</div>`
    }

    const actionDisabled = this.busy || !isPlayerTurn ? 'disabled' : ''
    const turnLabel = isPlayerTurn
      ? '<span style="color:var(--green)">-- 你的回合 --</span>'
      : `<span style="color:var(--red-bright)">-- ${dealer.name}的回合 --</span>`

    this.container.innerHTML = `
      <div class="fade-in" style="display:flex;flex-direction:column;gap:16px;padding:20px 0;min-height:100vh">
        <!-- Dealer HP -->
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:14px;color:var(--red-bright)">${dealer.name}</span>
            <span style="font-size:12px;color:var(--gray-light)">${this.battle.dealerHp} / ${maxDealerHp} HP</span>
          </div>
          <div class="hp-bar">
            <div class="hp-bar-fill dealer" style="width:${dealerHpPct}%"></div>
          </div>
          <div style="font-size:11px;color:var(--gray);margin-top:4px">${dealer.description}</div>
        </div>

        <!-- Turn Indicator -->
        <div style="text-align:center;font-size:13px">${turnLabel}</div>

        <!-- Chamber / Shell indicators -->
        <div style="text-align:center">
          <div style="margin-bottom:8px">${shellsHtml}</div>
          <div style="font-size:12px;color:var(--gray-light)">
            实弹: ${this.chamber.liveCount}  空弹: ${this.chamber.blankCount}
          </div>
        </div>

        <!-- Message Log -->
        <div style="background:var(--bg-card);border:1px solid var(--gray);border-radius:4px;padding:8px;min-height:60px">
          ${logHtml || '<div style="font-size:12px;color:var(--gray)">等待行动...</div>'}
        </div>

        <!-- Dealer items (info) -->
        <div>
          <div style="font-size:12px;color:var(--gray);margin-bottom:4px">荷官道具 (${this.dealerItems.length}):</div>
          <div style="font-size:11px;color:var(--gray-light)">
            ${this.dealerItems.map(it => ITEM_DEFINITIONS[it].name).join(', ') || '无'}
          </div>
        </div>

        <!-- Player Items -->
        <div>
          <div style="font-size:12px;color:var(--white);margin-bottom:4px">你的道具:</div>
          <div>${itemsHtml || '<span style="font-size:12px;color:var(--gray)">无道具</span>'}</div>
        </div>

        <!-- Action Buttons -->
        <div style="display:flex;gap:12px;justify-content:center">
          <button class="primary" id="btn-shoot-opponent" ${actionDisabled} style="flex:1;padding:14px">
            射对手
          </button>
          <button id="btn-shoot-self" ${actionDisabled} style="flex:1;padding:14px">
            射自己
          </button>
        </div>

        <!-- Player HP -->
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:14px;color:var(--green)">你</span>
            <span style="font-size:12px;color:var(--gray-light)">${this.battle.playerHp} / ${this.runState.maxHp} HP</span>
          </div>
          <div class="hp-bar">
            <div class="hp-bar-fill player" style="width:${playerHpPct}%"></div>
          </div>
          <div style="font-size:12px;color:var(--gray);margin-top:4px">
            <span class="chips">筹码: ${this.runState.chips}</span>
          </div>
        </div>

        <!-- Relics -->
        ${relicsHtml ? `<div style="margin-top:4px">${relicsHtml}</div>` : ''}
      </div>
    `

    this.bindEvents()
  }

  private bindEvents(): void {
    const shootOpponentBtn = this.container.querySelector('#btn-shoot-opponent') as HTMLButtonElement | null
    const shootSelfBtn = this.container.querySelector('#btn-shoot-self') as HTMLButtonElement | null

    shootOpponentBtn?.addEventListener('click', () => {
      this.playerShoot('shoot_opponent')
    })

    shootSelfBtn?.addEventListener('click', () => {
      this.playerShoot('shoot_self')
    })

    const itemBtns = this.container.querySelectorAll('.item-btn[data-item-idx]')
    itemBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt((btn as HTMLElement).dataset.itemIdx!, 10)
        this.usePlayerItem(idx)
      })
    })
  }

  private usePlayerItem(index: number): void {
    if (this.busy || this.battle.currentTurn !== 'player') return
    if (index < 0 || index >= this.playerItems.length) return

    const item = this.playerItems[index]
    const def = ITEM_DEFINITIONS[item]
    let consumed = true

    switch (item) {
      case 'magnifying_glass': {
        const shell = this.chamber.peek()
        this.currentRevealed = shell
        this.addMessage(`你使用了${def.name} -> ${shell === 'live' ? '实弹' : '空弹'}`)
        // Relic: broken_lens - don't consume once per round
        if (this.runState.relics.has('broken_lens') && !this._brokenLensUsed) {
          consumed = false
          this._brokenLensUsed = true
          this.addMessage('破碎镜片: 放大镜未消耗')
        }
        break
      }
      case 'handsaw':
        this.battle.setSawedOff(true)
        this.addMessage(`你使用了${def.name} -> 下一发实弹伤害翻倍`)
        break
      case 'beer': {
        const ejected = this.chamber.ejectCurrent()
        this.currentRevealed = null
        this.clearRevealedShells()
        this.addMessage(`你使用了${def.name} -> 退出了一发${ejected === 'live' ? '实弹' : '空弹'}`)
        if (this.chamber.isEmpty) {
          this.addMessage('弹匣已空，重新装弹...')
          this.loadNewRound()
        }
        break
      }
      case 'cigarette':
        this.runState.heal(1)
        this.battle.playerHp = this.runState.playerHp
        this.addMessage(`你使用了${def.name} -> 回复1HP`)
        break
      case 'handcuffs':
        this.battle.setHandcuffs(true)
        this.addMessage(`你使用了${def.name} -> 对手被铐住`)
        break
      case 'inverter':
        this.chamber.invertCurrent()
        // If the current shell was revealed, flip the reveal too
        if (this.currentRevealed) {
          this.currentRevealed = this.currentRevealed === 'live' ? 'blank' : 'live'
        }
        this.addMessage(`你使用了${def.name} -> 当前弹药类型已反转`)
        break
      case 'burner_phone': {
        if (this.chamber.totalRemaining > 1) {
          const maxIdx = this.chamber.totalRemaining - 1
          const randIdx = 1 + Math.floor(Math.random() * maxIdx)
          const peeked = this.chamber.peekAt(randIdx)
          this.revealedShells.push({ index: randIdx, type: peeked })
          this.addMessage(`你使用了${def.name} -> 第${randIdx + 1}发是${peeked === 'live' ? '实弹' : '空弹'}`)
        } else {
          this.addMessage(`你使用了${def.name} -> 只剩一发，无法窥视`)
        }
        break
      }
      case 'expired_medicine': {
        if (Math.random() < 0.5) {
          this.runState.heal(2)
          this.battle.playerHp = this.runState.playerHp
          this.addMessage(`你使用了${def.name} -> 幸运! 回复2HP`)
        } else {
          this.runState.takeDamage(1)
          this.battle.playerHp = this.runState.playerHp
          this.addMessage(`你使用了${def.name} -> 不幸! 扣1HP`)
        }
        break
      }
      case 'adrenaline': {
        if (this.dealerItems.length > 0) {
          const stolenIdx = Math.floor(Math.random() * this.dealerItems.length)
          const stolen = this.dealerItems.splice(stolenIdx, 1)[0]
          this.playerItems.push(stolen)
          const stolenDef = ITEM_DEFINITIONS[stolen]
          this.addMessage(`你使用了${def.name} -> 偷取了${stolenDef.name}`)
        } else {
          this.addMessage(`你使用了${def.name} -> 对手没有道具`)
        }
        break
      }
    }

    if (consumed) {
      this.playerItems.splice(index, 1)
    }

    this.render()

    // Check if player died from expired medicine
    if (this.battle.winner) {
      this.finishBattle()
    }
  }

  // Track broken_lens usage per round
  private _brokenLensUsed = false

  private clearRevealedShells(): void {
    this.revealedShells = []
  }

  private playerShoot(action: DealerAction): void {
    if (this.busy || this.battle.currentTurn !== 'player') return
    this.busy = true
    this.playerLastAction = action

    this.currentRevealed = null
    this.clearRevealedShells()

    let result
    if (action === 'shoot_opponent') {
      result = this.battle.shootOpponent()
      if (result.shell === 'live') {
        this.addMessage(`你射了荷官 -> 实弹! -${result.damage} HP`)
      } else {
        this.addMessage('你射了荷官 -> 空弹!')
      }
    } else {
      result = this.battle.shootSelf()
      if (result.shell === 'live') {
        this.addMessage(`你射了自己 -> 实弹! -${result.damage} HP`)
      } else {
        this.addMessage('你射了自己 -> 空弹! 你保留行动权')
      }
    }

    // Sync HP back to runState
    this.runState.playerHp = this.battle.playerHp

    this.render()

    // Check winner
    if (this.battle.winner) {
      setTimeout(() => this.finishBattle(), 500)
      return
    }

    // Check reload
    if (this.battle.needsReload) {
      this.addMessage('弹匣已空，重新装弹...')
      this._brokenLensUsed = false
      this.loadNewRound()
      this.render()
    }

    // If it's now the dealer's turn, auto play
    const nextTurn = this.battle.currentTurn as string
    if (nextTurn === 'dealer') {
      setTimeout(() => {
        this.busy = false
        this.dealerTurn()
      }, 1000)
    } else {
      this.busy = false
      this.render()
    }
  }

  private dealerTurn(): void {
    if (this.battle.winner) {
      this.finishBattle()
      return
    }
    if (this.battle.currentTurn !== 'dealer') {
      this.busy = false
      this.render()
      return
    }

    this.busy = true
    this.render()

    // Dealer item AI
    this.dealerUseItems(() => {
      // After items, dealer shoots
      const action = getDealerAction(
        this.dealerType,
        this.chamber.liveCount,
        this.chamber.blankCount,
        this.playerLastAction,
      )

      this.currentRevealed = null
      this.clearRevealedShells()

      let result
      const dealer = DEALERS[this.dealerType]
      if (action === 'shoot_opponent') {
        result = this.battle.shootOpponent()
        if (result.shell === 'live') {
          this.addMessage(`${dealer.name}射了你 -> 实弹! -${result.damage} HP`)
        } else {
          this.addMessage(`${dealer.name}射了你 -> 空弹!`)
        }
      } else {
        result = this.battle.shootSelf()
        if (result.shell === 'live') {
          this.addMessage(`${dealer.name}射了自己 -> 实弹! -${result.damage} HP`)
        } else {
          this.addMessage(`${dealer.name}射了自己 -> 空弹! 保留行动权`)
        }
      }

      // Sync HP
      this.runState.playerHp = this.battle.playerHp

      this.render()

      // Check winner
      if (this.battle.winner) {
        setTimeout(() => this.finishBattle(), 500)
        return
      }

      // Check reload
      if (this.battle.needsReload) {
        this.addMessage('弹匣已空，重新装弹...')
        this._brokenLensUsed = false
        this.loadNewRound()
        this.render()
      }

      // If still dealer's turn (shot self with blank), continue
      if (this.battle.currentTurn === 'dealer') {
        setTimeout(() => {
          this.dealerTurn()
        }, 1000)
      } else {
        this.busy = false
        this.render()
      }
    })
  }

  private dealerUseItems(onDone: () => void): void {
    const dealer = DEALERS[this.dealerType]
    let usedItem = false

    // Try magnifying glass
    const mgIdx = this.dealerItems.indexOf('magnifying_glass')
    if (mgIdx !== -1) {
      const shell = this.chamber.peek()
      this.dealerItems.splice(mgIdx, 1)
      this.addMessage(`${dealer.name}使用了放大镜 -> 查看了当前弹药`)
      // Dealer now "knows" the current shell - store for handsaw decision
      this._dealerKnownCurrent = shell
      usedItem = true
      this.render()
      setTimeout(() => this.dealerUseItems(onDone), 600)
      return
    }

    // Try handsaw if knows current is live
    const hsIdx = this.dealerItems.indexOf('handsaw')
    if (hsIdx !== -1 && this._dealerKnownCurrent === 'live') {
      this.dealerItems.splice(hsIdx, 1)
      this.battle.setSawedOff(true)
      this.addMessage(`${dealer.name}使用了手锯 -> 实弹伤害翻倍`)
      usedItem = true
      this.render()
      setTimeout(() => this.dealerUseItems(onDone), 600)
      return
    }

    // Try handcuffs
    const hcIdx = this.dealerItems.indexOf('handcuffs')
    if (hcIdx !== -1) {
      this.dealerItems.splice(hcIdx, 1)
      this.battle.setHandcuffs(true)
      this.addMessage(`${dealer.name}使用了手铐 -> 你被铐住`)
      usedItem = true
      this.render()
      setTimeout(() => this.dealerUseItems(onDone), 600)
      return
    }

    // Try cigarette if not full HP
    const cigIdx = this.dealerItems.indexOf('cigarette')
    if (cigIdx !== -1 && this.battle.dealerHp < this.runState.getDealerHp()) {
      this.dealerItems.splice(cigIdx, 1)
      this.battle.dealerHp = Math.min(this.runState.getDealerHp(), this.battle.dealerHp + 1)
      this.addMessage(`${dealer.name}使用了香烟 -> 回复1HP`)
      usedItem = true
      this.render()
      setTimeout(() => this.dealerUseItems(onDone), 600)
      return
    }

    // Try beer
    const beerIdx = this.dealerItems.indexOf('beer')
    if (beerIdx !== -1) {
      const ejected = this.chamber.ejectCurrent()
      this.dealerItems.splice(beerIdx, 1)
      this._dealerKnownCurrent = null
      this.addMessage(`${dealer.name}使用了啤酒 -> 退出了${ejected === 'live' ? '实弹' : '空弹'}`)
      if (this.chamber.isEmpty) {
        this.addMessage('弹匣已空，重新装弹...')
        this.loadNewRound()
      }
      usedItem = true
      this.render()
      setTimeout(() => this.dealerUseItems(onDone), 600)
      return
    }

    if (!usedItem) {
      this._dealerKnownCurrent = null
    }

    // Done using items
    setTimeout(onDone, 300)
  }

  private _dealerKnownCurrent: 'live' | 'blank' | null = null

  private finishBattle(): void {
    const winner = this.battle.winner!
    let chipsEarned = 0

    if (winner === 'player') {
      chipsEarned = 2 + Math.floor(Math.random() * 4) // 2-5
      this.runState.addChips(chipsEarned)

      // Relic: blood_pact - heal 1 on win
      if (this.runState.relics.has('blood_pact')) {
        this.runState.heal(1)
        this.battle.playerHp = this.runState.playerHp
      }

      // Relic: soul_steal - heal 2 on kill
      if (this.runState.relics.has('soul_steal')) {
        this.runState.heal(2)
        this.battle.playerHp = this.runState.playerHp
      }

      this.addMessage(`你赢了! 获得 ${chipsEarned} 筹码`)
    } else {
      this.addMessage('你输了...')
    }

    // Sync HP
    this.runState.playerHp = this.battle.playerHp

    this.render()

    setTimeout(() => {
      this.onComplete({ winner, chipsEarned })
    }, 1500)
  }
}
