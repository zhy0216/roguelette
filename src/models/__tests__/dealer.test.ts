import { describe, it, expect } from 'vitest'
import { DealerType, getDealerAction } from '../dealer'

describe('Dealer AI', () => {
  describe('Degen', () => {
    it('shoots opponent when P(live) > 40%', () => {
      const action = getDealerAction('degen', 3, 2, null)
      expect(action).toBe('shoot_opponent')
    })

    it('shoots self when P(live) <= 40%', () => {
      const action = getDealerAction('degen', 1, 4, null)
      expect(action).toBe('shoot_self')
    })
  })

  describe('Coward', () => {
    it('shoots opponent only when 100% live', () => {
      const action = getDealerAction('coward', 3, 0, null)
      expect(action).toBe('shoot_opponent')
    })

    it('shoots self when any blank remains', () => {
      const action = getDealerAction('coward', 3, 1, null)
      expect(action).toBe('shoot_self')
    })
  })

  describe('Paranoid', () => {
    it('always shoots opponent', () => {
      expect(getDealerAction('paranoid', 1, 5, null)).toBe('shoot_opponent')
      expect(getDealerAction('paranoid', 0, 5, null)).toBe('shoot_opponent')
    })
  })

  describe('Mimic', () => {
    it('copies player last action', () => {
      expect(getDealerAction('mimic', 2, 2, 'shoot_opponent')).toBe('shoot_opponent')
      expect(getDealerAction('mimic', 2, 2, 'shoot_self')).toBe('shoot_self')
    })

    it('defaults to shoot_opponent if no prior action', () => {
      expect(getDealerAction('mimic', 2, 2, null)).toBe('shoot_opponent')
    })
  })
})
