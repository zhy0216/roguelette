import './styles/main.css'
import { RunState } from './models/run'
import { BattleUI } from './ui/battle'

function showScreen(id: string): void {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.getElementById(id)?.classList.add('active')
}

function startGame(): void {
  const runState = new RunState()
  const dealerType = runState.getRandomDealerType()
  const dealerHp = runState.getDealerHp()

  const battleContainer = document.getElementById('screen-battle')!
  showScreen('screen-battle')

  const battleUI = new BattleUI()
  battleUI.start(battleContainer, runState, dealerType, dealerHp, (result) => {
    if (result.winner === 'player') {
      battleContainer.innerHTML = `
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:16px">
          <h2 style="color:var(--green)">战斗胜利!</h2>
          <p>获得 <span class="chips">${result.chipsEarned} 筹码</span></p>
          <p style="font-size:12px;color:var(--gray-light)">HP: ${runState.playerHp} / ${runState.maxHp}</p>
          <button id="btn-continue" class="primary" style="padding:12px 36px">继续</button>
        </div>
      `
      document.getElementById('btn-continue')!.onclick = () => {
        // For now, start another battle as a test (full game loop in Task 14)
        startGame()
      }
    } else {
      battleContainer.innerHTML = `
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:16px">
          <h2 style="color:var(--red-bright)">你死了...</h2>
          <p style="font-size:12px;color:var(--gray-light)">下次好运</p>
          <button id="btn-restart" class="primary" style="padding:12px 36px">重新开始</button>
        </div>
      `
      document.getElementById('btn-restart')!.onclick = () => {
        renderTitle()
        showScreen('screen-title')
      }
    }
  })
}

function renderTitle(): void {
  const el = document.getElementById('screen-title')!
  el.innerHTML = `
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:24px">
      <h1>恶魔轮盘</h1>
      <p style="color:var(--gray);font-size:14px">地狱攀升</p>
      <button id="btn-start" class="primary" style="padding:16px 48px;font-size:16px">开始游戏</button>
    </div>
  `
  document.getElementById('btn-start')!.onclick = () => {
    startGame()
  }
}

renderTitle()
showScreen('screen-title')

export { showScreen }
