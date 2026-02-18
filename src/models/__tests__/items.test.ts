import { describe, it, expect } from 'vitest'
import { ItemType, ITEM_DEFINITIONS, distributeItems } from '../items'

describe('Item definitions', () => {
  it('has all 5 basic items defined', () => {
    const basics: ItemType[] = ['magnifying_glass', 'handsaw', 'beer', 'cigarette', 'handcuffs']
    basics.forEach(id => {
      expect(ITEM_DEFINITIONS[id]).toBeDefined()
      expect(ITEM_DEFINITIONS[id].name).toBeTruthy()
    })
  })

  it('has all 4 advanced items defined', () => {
    const advanced: ItemType[] = ['inverter', 'burner_phone', 'expired_medicine', 'adrenaline']
    advanced.forEach(id => {
      expect(ITEM_DEFINITIONS[id]).toBeDefined()
      expect(ITEM_DEFINITIONS[id].advanced).toBe(true)
    })
  })
})

describe('distributeItems', () => {
  it('returns 2-4 items', () => {
    for (let i = 0; i < 20; i++) {
      const items = distributeItems(false)
      expect(items.length).toBeGreaterThanOrEqual(2)
      expect(items.length).toBeLessThanOrEqual(4)
    }
  })

  it('only returns basic items when advanced=false', () => {
    const advanced: ItemType[] = ['inverter', 'burner_phone', 'expired_medicine', 'adrenaline']
    for (let i = 0; i < 20; i++) {
      const items = distributeItems(false)
      items.forEach(item => {
        expect(advanced).not.toContain(item)
      })
    }
  })

  it('can return advanced items when advanced=true', () => {
    let hasAdvanced = false
    for (let i = 0; i < 100; i++) {
      const items = distributeItems(true)
      if (items.some(item => ITEM_DEFINITIONS[item].advanced)) {
        hasAdvanced = true
        break
      }
    }
    expect(hasAdvanced).toBe(true)
  })
})
