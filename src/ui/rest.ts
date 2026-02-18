import type { RunState } from '../models/run'
import { RELIC_DEFINITIONS } from '../models/relics'

export function renderRest(
  container: HTMLElement,
  runState: RunState,
  onComplete: () => void,
): void {
  const hpBefore = runState.playerHp
  runState.heal(1)
  const hpAfter = runState.playerHp
  const healed = hpAfter - hpBefore

  const hpPct = Math.max(0, (runState.playerHp / runState.maxHp) * 100)

  // Build relics display
  let relicsHtml = ''
  const relicList = runState.relics.list()
  if (relicList.length > 0) {
    relicsHtml = '<div style="margin-top:16px"><div style="font-size:12px;color:var(--gray-light);margin-bottom:8px">持有遗物:</div><div>'
    for (const relic of relicList) {
      const def = RELIC_DEFINITIONS[relic]
      relicsHtml += `<span class="relic-badge" title="${def.description}">${def.name}</span>`
    }
    relicsHtml += '</div></div>'
  }

  const healMessage = healed > 0
    ? `回复了 ${healed} 点 HP`
    : 'HP 已满，无法回复'

  container.innerHTML = `
    <div class="fade-in" style="display:flex;flex-direction:column;justify-content:center;align-items:center;gap:20px;padding:20px 0;min-height:100vh">
      <h2 style="color:var(--green);font-size:24px">休息站</h2>

      <div style="font-size:32px;margin:8px 0">🔧</div>

      <div style="text-align:center">
        <div style="font-size:16px;color:var(--green);margin-bottom:12px">${healMessage}</div>
        <div style="width:200px;margin:0 auto">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:12px;color:var(--gray-light)">HP</span>
            <span style="font-size:12px;color:var(--gray-light)">${runState.playerHp} / ${runState.maxHp}</span>
          </div>
          <div class="hp-bar">
            <div class="hp-bar-fill player" style="width:${hpPct}%"></div>
          </div>
        </div>
      </div>

      ${relicsHtml}

      <button class="primary" id="btn-rest-continue" style="padding:14px 48px;margin-top:16px">继续</button>
    </div>
  `

  document.getElementById('btn-rest-continue')?.addEventListener('click', () => {
    onComplete()
  })
}
