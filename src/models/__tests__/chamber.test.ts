import { describe, it, expect } from 'vitest'
import { Chamber } from '../chamber'

describe('Chamber', () => {
  it('creates with correct live and blank counts', () => {
    const c = new Chamber(3, 2)
    expect(c.liveCount).toBe(3)
    expect(c.blankCount).toBe(2)
    expect(c.totalRemaining).toBe(5)
  })

  it('draws a shell and reduces count', () => {
    const c = Chamber.fromSequence(['live', 'blank', 'live'])
    const first = c.draw()
    expect(['live', 'blank']).toContain(first)
    expect(c.totalRemaining).toBe(2)
  })

  it('isEmpty when all shells drawn', () => {
    const c = Chamber.fromSequence(['live'])
    c.draw()
    expect(c.isEmpty).toBe(true)
  })

  it('peek returns current shell without removing', () => {
    const c = Chamber.fromSequence(['live', 'blank'])
    expect(c.peek()).toBe('live')
    expect(c.totalRemaining).toBe(2)
  })

  it('fromSequence preserves exact order', () => {
    const c = Chamber.fromSequence(['blank', 'live', 'blank'])
    expect(c.draw()).toBe('blank')
    expect(c.draw()).toBe('live')
    expect(c.draw()).toBe('blank')
  })

  it('random constructor shuffles shells', () => {
    const c = new Chamber(2, 2)
    expect(c.liveCount).toBe(2)
    expect(c.blankCount).toBe(2)
  })

  it('invertCurrent flips the current shell type', () => {
    const c = Chamber.fromSequence(['live', 'blank'])
    c.invertCurrent()
    expect(c.peek()).toBe('blank')
  })

  it('ejectCurrent removes current shell and returns its type', () => {
    const c = Chamber.fromSequence(['live', 'blank'])
    const ejected = c.ejectCurrent()
    expect(ejected).toBe('live')
    expect(c.totalRemaining).toBe(1)
    expect(c.peek()).toBe('blank')
  })

  it('peekAt returns shell at future index without removing', () => {
    const c = Chamber.fromSequence(['live', 'blank', 'live'])
    expect(c.peekAt(1)).toBe('blank')
    expect(c.totalRemaining).toBe(3)
  })
})
