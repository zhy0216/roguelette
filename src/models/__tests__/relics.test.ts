import { describe, it, expect } from 'vitest'
import { RELIC_DEFINITIONS, RelicInventory } from '../relics'

describe('RelicInventory', () => {
  it('starts empty', () => {
    const inv = new RelicInventory()
    expect(inv.count).toBe(0)
    expect(inv.has('demons_eye')).toBe(false)
  })

  it('adds relic', () => {
    const inv = new RelicInventory()
    inv.add('demons_eye')
    expect(inv.has('demons_eye')).toBe(true)
    expect(inv.count).toBe(1)
  })

  it('max 4 relics', () => {
    const inv = new RelicInventory()
    inv.add('demons_eye')
    inv.add('blood_pact')
    inv.add('cursed_shell')
    inv.add('black_handcuffs')
    expect(inv.add('lucky_coin')).toBe(false)
    expect(inv.count).toBe(4)
  })

  it('removes relic', () => {
    const inv = new RelicInventory()
    inv.add('demons_eye')
    inv.remove('demons_eye')
    expect(inv.has('demons_eye')).toBe(false)
    expect(inv.count).toBe(0)
  })

  it('can add after removing to free slot', () => {
    const inv = new RelicInventory()
    inv.add('demons_eye')
    inv.add('blood_pact')
    inv.add('cursed_shell')
    inv.add('black_handcuffs')
    inv.remove('blood_pact')
    expect(inv.add('lucky_coin')).toBe(true)
    expect(inv.count).toBe(4)
  })

  it('lists all relics', () => {
    const inv = new RelicInventory()
    inv.add('demons_eye')
    inv.add('blood_pact')
    expect(inv.list()).toEqual(['demons_eye', 'blood_pact'])
  })
})

describe('RELIC_DEFINITIONS', () => {
  it('has all 8 relics defined', () => {
    expect(Object.keys(RELIC_DEFINITIONS)).toHaveLength(8)
  })
})
