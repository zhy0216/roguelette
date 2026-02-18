import { describe, it, expect } from 'vitest'
import { RunState } from '../run'

describe('RunState', () => {
  it('starts at layer 7 with 4 HP and 0 chips', () => {
    const run = new RunState()
    expect(run.currentLayer).toBe(7)
    expect(run.playerHp).toBe(4)
    expect(run.maxHp).toBe(6)
    expect(run.chips).toBe(0)
  })

  it('ascend moves to next layer', () => {
    const run = new RunState()
    run.ascend()
    expect(run.currentLayer).toBe(6)
  })

  it('generates 3 path options between layers', () => {
    const run = new RunState()
    const options = run.getPathOptions()
    expect(options).toHaveLength(3)
    options.forEach(opt => {
      expect(['combat', 'shop', 'gamble', 'rest']).toContain(opt)
    })
  })

  it('boss layers return only combat', () => {
    const run = new RunState()
    run.ascend() // 6
    run.ascend() // 5
    const options = run.getPathOptions()
    expect(options).toEqual(['combat'])
  })

  it('layer 1 is boss layer', () => {
    const run = new RunState()
    for (let i = 0; i < 6; i++) run.ascend()
    expect(run.isBossLayer).toBe(true)
  })

  it('takeDamage reduces HP', () => {
    const run = new RunState()
    run.takeDamage(2)
    expect(run.playerHp).toBe(2)
  })

  it('heal does not exceed maxHp', () => {
    const run = new RunState()
    run.takeDamage(1)
    run.heal(5)
    expect(run.playerHp).toBe(6)
  })

  it('isDead when HP <= 0', () => {
    const run = new RunState()
    run.takeDamage(4)
    expect(run.isDead).toBe(true)
  })

  it('isVictory when layer 1 boss defeated', () => {
    const run = new RunState()
    for (let i = 0; i < 7; i++) run.ascend()
    expect(run.isVictory).toBe(true)
  })

  it('addChips and spendChips manage currency', () => {
    const run = new RunState()
    run.addChips(5)
    expect(run.chips).toBe(5)
    expect(run.spendChips(3)).toBe(true)
    expect(run.chips).toBe(2)
    expect(run.spendChips(5)).toBe(false)
    expect(run.chips).toBe(2)
  })

  it('getDealerHp returns HP based on layer', () => {
    const run = new RunState()
    expect(run.getDealerHp()).toBeGreaterThan(0)
  })
})
