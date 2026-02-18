import { describe, it, expect } from 'vitest'
import { Battle } from '../battle'
import { Chamber } from '../chamber'

describe('Battle', () => {
  it('initializes with player and dealer HP', () => {
    const b = new Battle(4, 3)
    expect(b.playerHp).toBe(4)
    expect(b.dealerHp).toBe(3)
    expect(b.currentTurn).toBe('player')
  })

  it('shoot opponent with live shell deals 1 damage and switches turn', () => {
    const chamber = Chamber.fromSequence(['live', 'blank'])
    const b = new Battle(4, 3)
    b.loadChamber(chamber)
    const result = b.shootOpponent()
    expect(result.shell).toBe('live')
    expect(result.damage).toBe(1)
    expect(b.dealerHp).toBe(2)
    expect(b.currentTurn).toBe('dealer')
  })

  it('shoot opponent with blank shell deals 0 damage and switches turn', () => {
    const chamber = Chamber.fromSequence(['blank', 'live'])
    const b = new Battle(4, 3)
    b.loadChamber(chamber)
    const result = b.shootOpponent()
    expect(result.shell).toBe('blank')
    expect(result.damage).toBe(0)
    expect(b.dealerHp).toBe(3)
    expect(b.currentTurn).toBe('dealer')
  })

  it('shoot self with blank keeps turn', () => {
    const chamber = Chamber.fromSequence(['blank', 'live'])
    const b = new Battle(4, 3)
    b.loadChamber(chamber)
    const result = b.shootSelf()
    expect(result.shell).toBe('blank')
    expect(b.playerHp).toBe(4)
    expect(b.currentTurn).toBe('player')
  })

  it('shoot self with live deals damage and switches turn', () => {
    const chamber = Chamber.fromSequence(['live', 'blank'])
    const b = new Battle(4, 3)
    b.loadChamber(chamber)
    const result = b.shootSelf()
    expect(result.shell).toBe('live')
    expect(result.damage).toBe(1)
    expect(b.playerHp).toBe(3)
    expect(b.currentTurn).toBe('dealer')
  })

  it('detects player win when dealer HP reaches 0', () => {
    const chamber = Chamber.fromSequence(['live'])
    const b = new Battle(4, 1)
    b.loadChamber(chamber)
    b.shootOpponent()
    expect(b.dealerHp).toBe(0)
    expect(b.winner).toBe('player')
  })

  it('detects dealer win when player HP reaches 0', () => {
    const chamber = Chamber.fromSequence(['live'])
    const b = new Battle(1, 3)
    b.loadChamber(chamber)
    b.shootSelf()
    expect(b.playerHp).toBe(0)
    expect(b.winner).toBe('dealer')
  })

  it('returns null winner when battle ongoing', () => {
    const b = new Battle(4, 3)
    expect(b.winner).toBe(null)
  })

  it('needsReload when chamber is empty and no winner', () => {
    const chamber = Chamber.fromSequence(['blank'])
    const b = new Battle(4, 3)
    b.loadChamber(chamber)
    b.shootSelf()
    expect(b.needsReload).toBe(true)
  })

  it('sawedOff doubles damage of live shell', () => {
    const chamber = Chamber.fromSequence(['live'])
    const b = new Battle(4, 3)
    b.loadChamber(chamber)
    b.setSawedOff(true)
    const result = b.shootOpponent()
    expect(result.damage).toBe(2)
    expect(b.dealerHp).toBe(1)
  })

  it('handcuffs skip opponent turn after shoot', () => {
    const chamber = Chamber.fromSequence(['blank', 'live'])
    const b = new Battle(4, 3)
    b.loadChamber(chamber)
    b.setHandcuffs(true)
    b.shootOpponent() // blank, normally switches turn
    expect(b.currentTurn).toBe('player') // but handcuffs keep it
  })
})
