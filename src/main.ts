import './styles/main.css'
import { RunState } from './models/run'
import type { NodeType } from './models/run'
import { BattleUI } from './ui/battle'
import { renderMap } from './ui/map'
import { renderShop } from './ui/shop'
import { renderGamble } from './ui/gamble'
import { renderRest } from './ui/rest'
import { renderGameOver } from './ui/gameover'
import { renderVictory } from './ui/victory'
import { audio } from './audio'

// ---------------------------------------------------------------------------
// Screen management
// ---------------------------------------------------------------------------

const SCREEN_BGM: Record<string, string> = {
  'screen-title': 'title',
  'screen-map': 'map',
  'screen-battle': 'battle',
  'screen-shop': 'shop',
  'screen-gamble': 'map',
  'screen-rest': 'map',
  'screen-gameover': 'gameover',
  'screen-victory': 'victory',
}

function showScreen(id: string): void {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.getElementById(id)?.classList.add('active')

  const track = SCREEN_BGM[id]
  if (track) {
    audio.playBGM(track)
  }
}

// ---------------------------------------------------------------------------
// Title screen
// ---------------------------------------------------------------------------

function renderTitle(): void {
  const el = document.getElementById('screen-title')!
  el.innerHTML = `
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:24px;position:relative">
      <button id="btn-mute" style="position:absolute;top:16px;right:16px;padding:8px 12px;font-size:12px;background:transparent;border:1px solid var(--gray)">${audio.muted ? '🔇' : '🔊'}</button>
      <h1>恶魔轮盘</h1>
      <p style="color:var(--gray);font-size:14px">地狱攀升</p>
      <button id="btn-start" class="primary" style="padding:16px 48px;font-size:16px">开始游戏</button>
    </div>
  `
  document.getElementById('btn-mute')!.onclick = () => {
    audio.toggleMute()
    renderTitle()
  }
  document.getElementById('btn-start')!.onclick = () => {
    audio.unlock()
    startRun()
  }
}

// ---------------------------------------------------------------------------
// Start a new run
// ---------------------------------------------------------------------------

function startRun(): void {
  const runState = new RunState()
  showMap(runState)
}

// ---------------------------------------------------------------------------
// Map screen
// ---------------------------------------------------------------------------

function showMap(runState: RunState): void {
  const container = document.getElementById('screen-map')!
  showScreen('screen-map')

  renderMap(container, runState, (nodeType: NodeType) => {
    handleNode(runState, nodeType)
  })
}

// ---------------------------------------------------------------------------
// Node dispatcher
// ---------------------------------------------------------------------------

function handleNode(runState: RunState, nodeType: NodeType): void {
  switch (nodeType) {
    case 'combat':
      startBattle(runState)
      break
    case 'shop':
      startShop(runState)
      break
    case 'gamble':
      startGamble(runState)
      break
    case 'rest':
      startRest(runState)
      break
  }
}

// ---------------------------------------------------------------------------
// Battle
// ---------------------------------------------------------------------------

function startBattle(runState: RunState): void {
  const dealerType = runState.getRandomDealerType()
  const dealerHp = runState.getDealerHp()
  const extraItems = [...runState.purchasedItems]

  // Clear purchased items so they are only used once
  runState.purchasedItems = []

  const battleContainer = document.getElementById('screen-battle')!
  showScreen('screen-battle')

  const battleUI = new BattleUI()
  battleUI.start(battleContainer, runState, dealerType, dealerHp, (result) => {
    if (result.winner === 'player') {
      // Relics blood_pact and soul_steal are already handled inside BattleUI.finishBattle

      // Ascend to the next layer
      runState.ascend()

      if (runState.isVictory) {
        showVictoryScreen(runState)
      } else {
        // Show a short win summary, then go to map
        showBattleWinSummary(runState, result.chipsEarned)
      }
    } else {
      // Player lost — game over
      showGameOverScreen(runState)
    }
  }, extraItems)
}

function showBattleWinSummary(runState: RunState, chipsEarned: number): void {
  const container = document.getElementById('screen-battle')!
  container.innerHTML = `
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:16px">
      <h2 style="color:var(--green)">战斗胜利!</h2>
      <p>获得 <span class="chips">${chipsEarned} 筹码</span></p>
      <p style="font-size:12px;color:var(--gray-light)">HP: ${runState.playerHp} / ${runState.maxHp}</p>
      <button id="btn-continue" class="primary" style="padding:12px 36px">继续</button>
    </div>
  `
  document.getElementById('btn-continue')!.onclick = () => {
    showMap(runState)
  }
}

// ---------------------------------------------------------------------------
// Shop
// ---------------------------------------------------------------------------

function startShop(runState: RunState): void {
  const container = document.getElementById('screen-shop')!
  showScreen('screen-shop')

  renderShop(container, runState, () => {
    // Check death (shouldn't happen in shop, but be safe)
    if (runState.isDead) {
      showGameOverScreen(runState)
      return
    }
    showMap(runState)
  })
}

// ---------------------------------------------------------------------------
// Gamble
// ---------------------------------------------------------------------------

function startGamble(runState: RunState): void {
  const container = document.getElementById('screen-gamble')!
  showScreen('screen-gamble')

  renderGamble(container, runState, () => {
    if (runState.isDead) {
      showGameOverScreen(runState)
      return
    }
    showMap(runState)
  })
}

// ---------------------------------------------------------------------------
// Rest
// ---------------------------------------------------------------------------

function startRest(runState: RunState): void {
  const container = document.getElementById('screen-rest')!
  showScreen('screen-rest')

  renderRest(container, runState, () => {
    showMap(runState)
  })
}

// ---------------------------------------------------------------------------
// Game Over
// ---------------------------------------------------------------------------

function showGameOverScreen(runState: RunState): void {
  const container = document.getElementById('screen-gameover')!
  showScreen('screen-gameover')

  renderGameOver(container, runState, () => {
    renderTitle()
    showScreen('screen-title')
  })
}

// ---------------------------------------------------------------------------
// Victory
// ---------------------------------------------------------------------------

function showVictoryScreen(runState: RunState): void {
  const container = document.getElementById('screen-victory')!
  showScreen('screen-victory')

  renderVictory(container, runState, () => {
    renderTitle()
    showScreen('screen-title')
  })
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

renderTitle()
showScreen('screen-title')

export { showScreen }
