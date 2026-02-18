import type { RunState } from '../models/run'
import { RELIC_DEFINITIONS } from '../models/relics'

export function renderVictory(
  container: HTMLElement,
  runState: RunState,
  onRestart: () => void,
): void {
  const relicList = runState.relics.list()

  let relicsHtml = ''
  if (relicList.length > 0) {
    for (const relic of relicList) {
      const def = RELIC_DEFINITIONS[relic]
      relicsHtml += `<span class="relic-badge" title="${def.description}">${def.name}</span>`
    }
  } else {
    relicsHtml = '<span style="font-size:12px;color:var(--gray)">无</span>'
  }

  container.innerHTML = `
    <div class="fade-in" style="display:flex;flex-direction:column;justify-content:center;align-items:center;gap:24px;padding:20px 0;min-height:100vh">
      <h1 style="color:var(--gold);font-size:36px">逃出地狱！</h1>

      <div style="font-size:48px;margin:8px 0">👑</div>

      <div style="font-size:14px;color:var(--gray-light);text-align:center">恭喜你击败了恶魔庄家</div>

      <div style="text-align:center;background:var(--bg-card);border:1px solid var(--gold);border-radius:8px;padding:24px;width:100%;max-width:280px">
        <div style="font-size:14px;color:var(--gold);margin-bottom:16px">-- 最终统计 --</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="font-size:13px;color:var(--gray-light)">剩余筹码</span>
          <span class="chips" style="font-size:13px">${runState.chips}</span>
        </div>
        <div style="margin-bottom:8px">
          <div style="font-size:13px;color:var(--gray-light);margin-bottom:8px">持有遗物 (${relicList.length})</div>
          <div>${relicsHtml}</div>
        </div>
      </div>

      <button class="primary" id="btn-victory-restart" style="padding:16px 48px;font-size:16px;margin-top:16px">再来一次</button>
    </div>
  `

  document.getElementById('btn-victory-restart')?.addEventListener('click', () => {
    onRestart()
  })
}
