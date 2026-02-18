import type { RunState } from '../models/run'

export function renderGamble(
  container: HTMLElement,
  runState: RunState,
  onComplete: () => void,
): void {
  const entryCost = 3

  if (runState.chips < entryCost) {
    // Can't afford to gamble
    container.innerHTML = `
      <div class="fade-in" style="display:flex;flex-direction:column;justify-content:center;align-items:center;gap:20px;padding:20px 0;min-height:100vh">
        <h2 style="color:var(--gold);font-size:24px">恶魔骰子</h2>
        <div style="font-size:32px">🎲</div>
        <div style="text-align:center">
          <div style="font-size:14px;color:var(--red-bright);margin-bottom:8px">筹码不足!</div>
          <div style="font-size:12px;color:var(--gray-light)">需要 ${entryCost} 筹码参与赌局</div>
          <div style="font-size:12px;color:var(--gray-light);margin-top:4px">当前筹码: <span class="chips">${runState.chips}</span></div>
        </div>
        <button class="primary" id="btn-gamble-leave" style="padding:14px 48px;margin-top:16px">离开</button>
      </div>
    `
    document.getElementById('btn-gamble-leave')?.addEventListener('click', () => {
      onComplete()
    })
    return
  }

  // Pay entry cost
  runState.spendChips(entryCost)

  // Roll dice
  const die1 = 1 + Math.floor(Math.random() * 6)
  const die2 = 1 + Math.floor(Math.random() * 6)
  const sum = die1 + die2
  const won = sum > 7

  if (won) {
    runState.addChips(4 + entryCost) // Win back entry + 4 profit
  }

  // Show rolling animation first
  container.innerHTML = `
    <div class="fade-in" style="display:flex;flex-direction:column;justify-content:center;align-items:center;gap:20px;padding:20px 0;min-height:100vh">
      <h2 style="color:var(--gold);font-size:24px">恶魔骰子</h2>
      <div style="font-size:12px;color:var(--gray-light)">支付了 ${entryCost} 筹码</div>
      <div style="font-size:48px;margin:16px 0" id="dice-display">🎲 🎲</div>
      <div style="font-size:14px;color:var(--gray-light)" id="dice-message">骰子滚动中...</div>
    </div>
  `

  // Reveal after delay
  setTimeout(() => {
    const diceNums = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
    const d1Char = diceNums[die1 - 1]
    const d2Char = diceNums[die2 - 1]

    const resultColor = won ? 'var(--green)' : 'var(--red-bright)'
    const resultMessage = won
      ? `点数 ${sum} > 7，你赢了! +4 筹码`
      : `点数 ${sum} ≤ 7，你输了! -${entryCost} 筹码`

    container.innerHTML = `
      <div class="fade-in" style="display:flex;flex-direction:column;justify-content:center;align-items:center;gap:20px;padding:20px 0;min-height:100vh">
        <h2 style="color:var(--gold);font-size:24px">恶魔骰子</h2>

        <div style="display:flex;gap:24px;margin:16px 0">
          <div style="font-size:48px;background:var(--bg-card);border:1px solid var(--gray);border-radius:8px;padding:16px 24px">${d1Char}</div>
          <div style="font-size:48px;background:var(--bg-card);border:1px solid var(--gray);border-radius:8px;padding:16px 24px">${d2Char}</div>
        </div>

        <div style="text-align:center">
          <div style="font-size:20px;margin-bottom:4px">${die1} + ${die2} = ${sum}</div>
          <div style="font-size:16px;color:${resultColor};margin-bottom:12px">${resultMessage}</div>
          <div style="font-size:12px;color:var(--gray-light)">当前筹码: <span class="chips">${runState.chips}</span></div>
        </div>

        <button class="primary" id="btn-gamble-continue" style="padding:14px 48px;margin-top:16px">继续</button>
      </div>
    `

    document.getElementById('btn-gamble-continue')?.addEventListener('click', () => {
      onComplete()
    })
  }, 1200)
}
