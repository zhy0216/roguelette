import type { RunState } from '../models/run'

export function renderGameOver(
  container: HTMLElement,
  runState: RunState,
  onRestart: () => void,
): void {
  const layersCleared = 7 - runState.currentLayer
  const relicsCollected = runState.relics.count

  container.innerHTML = `
    <div class="fade-in" style="display:flex;flex-direction:column;justify-content:center;align-items:center;gap:24px;padding:20px 0;min-height:100vh">
      <h1 style="color:var(--red-bright);font-size:36px">你死了</h1>

      <div style="font-size:48px;margin:8px 0">💀</div>

      <div style="text-align:center;background:var(--bg-card);border:1px solid var(--gray);border-radius:8px;padding:24px;width:100%;max-width:280px">
        <div style="font-size:14px;color:var(--gray-light);margin-bottom:16px">-- 统计 --</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="font-size:13px;color:var(--gray-light)">通过层数</span>
          <span style="font-size:13px;color:var(--white)">${layersCleared}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="font-size:13px;color:var(--gray-light)">收集遗物</span>
          <span style="font-size:13px;color:var(--gold)">${relicsCollected}</span>
        </div>
      </div>

      <button class="primary" id="btn-gameover-restart" style="padding:16px 48px;font-size:16px;margin-top:16px">重新开始</button>
    </div>
  `

  document.getElementById('btn-gameover-restart')?.addEventListener('click', () => {
    onRestart()
  })
}
