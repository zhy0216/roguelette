import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rng, seedRng, getSeed } from '../rng'

describe('rng', () => {
  beforeEach(() => {
    seedRng(0)
  })

  it('returns numbers in [0, 1)', () => {
    for (let i = 0; i < 100; i++) {
      const n = rng()
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
    }
  })

  it('produces deterministic sequence for same seed', () => {
    seedRng(42)
    const seq1 = Array.from({ length: 10 }, () => rng())
    seedRng(42)
    const seq2 = Array.from({ length: 10 }, () => rng())
    expect(seq1).toEqual(seq2)
  })

  it('produces different sequences for different seeds', () => {
    seedRng(1)
    const seq1 = Array.from({ length: 10 }, () => rng())
    seedRng(2)
    const seq2 = Array.from({ length: 10 }, () => rng())
    expect(seq1).not.toEqual(seq2)
  })

  it('getSeed returns current seed', () => {
    seedRng(123)
    expect(getSeed()).toBe(123)
  })

  it('getSeed returns null before seeding', async () => {
    vi.resetModules()
    const { getSeed: freshGetSeed } = await import('../rng')
    expect(freshGetSeed()).toBeNull()
  })
})
