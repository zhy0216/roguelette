import type { RunState, NodeType } from '../models/run'
import { RELIC_DEFINITIONS } from '../models/relics'

interface NodeDisplay {
  type: NodeType
  icon: string
  title: string
  description: string
}

const NODE_DISPLAY: Record<NodeType, Omit<NodeDisplay, 'type'>> = {
  combat: { icon: '⚔', title: '战斗', description: '与恶魔荷官对局' },
  shop: { icon: '🏪', title: '商店', description: '购买道具和遗物' },
  gamble: { icon: '🎲', title: '赌局', description: '高风险高回报' },
  rest: { icon: '🔧', title: '休息', description: '回复 1 HP' },
}

export function renderMap(
  container: HTMLElement,
  runState: RunState,
  onSelect: (nodeType: NodeType) => void,
): void {
  const options = runState.getPathOptions()
  const hpPct = Math.max(0, (runState.playerHp / runState.maxHp) * 100)

  // Build relics display
  let relicsHtml = ''
  for (const relic of runState.relics.list()) {
    const def = RELIC_DEFINITIONS[relic]
    relicsHtml += `<span class="relic-badge" title="${def.description}">${def.name}</span>`
  }

  // Build path option cards
  let cardsHtml = ''
  options.forEach((nodeType, idx) => {
    const display = NODE_DISPLAY[nodeType]
    cardsHtml += `
      <div class="card" data-node-idx="${idx}" data-node-type="${nodeType}" style="padding:20px;text-align:center">
        <div style="font-size:32px;margin-bottom:8px">${display.icon}</div>
        <div style="font-size:16px;font-weight:bold;margin-bottom:4px">${display.title}</div>
        <div style="font-size:12px;color:var(--gray-light)">${display.description}</div>
      </div>
    `
  })

  container.innerHTML = `
    <div class="fade-in" style="display:flex;flex-direction:column;gap:20px;padding:20px 0;min-height:100vh">
      <!-- Layer Header -->
      <div style="text-align:center">
        <h2 style="color:var(--red-bright);margin-bottom:4px">地狱第 ${runState.currentLayer} 层</h2>
        <div style="font-size:12px;color:var(--gray-light)">选择你的道路</div>
      </div>

      <!-- Player Status -->
      <div style="background:var(--bg-card);border:1px solid var(--gray);border-radius:8px;padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:14px;color:var(--green)">HP</span>
          <span style="font-size:12px;color:var(--gray-light)">${runState.playerHp} / ${runState.maxHp}</span>
        </div>
        <div class="hp-bar">
          <div class="hp-bar-fill player" style="width:${hpPct}%"></div>
        </div>
        <div style="margin-top:8px;font-size:12px">
          <span class="chips">筹码: ${runState.chips}</span>
        </div>
        ${relicsHtml ? `<div style="margin-top:8px">${relicsHtml}</div>` : ''}
      </div>

      <!-- Path Options -->
      <div style="display:flex;flex-direction:column;gap:12px">
        ${cardsHtml}
      </div>
    </div>
  `

  // Bind click events
  const cards = container.querySelectorAll('.card[data-node-type]')
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const nodeType = (card as HTMLElement).dataset.nodeType as NodeType
      onSelect(nodeType)
    })
  })
}
