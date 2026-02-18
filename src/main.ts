import './styles/main.css'

function showScreen(id: string): void {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.getElementById(id)?.classList.add('active')
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
    console.log('start game')
  }
}

renderTitle()
showScreen('screen-title')

export { showScreen }
