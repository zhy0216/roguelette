import { describe, it, expect } from 'vitest'
import { seedRng, rng } from '../rng'
import { RunState } from '../run'
import { Chamber } from '../chamber'
import { Battle } from '../battle'
import { distributeItems } from '../items'
import { getDealerAction } from '../dealer'
import type { DealerType, DealerAction } from '../dealer'

/**
 * Simulate the shop's rng() calls without needing a DOM.
 *
 * From src/ui/shop.ts generateShopItems():
 *   1 rng() for consumableCount (1-2)
 *   Per consumable: 1 rng() for item type + 1 rng() for price = 2 rng() each
 *   1 rng() to decide if relic appears (< 0.6)
 *   If relic: 1 rng() for relic type + 1 rng() for relic price = 2 rng()
 *   Heal option has no rng calls
 */
function consumeShopRng(): void {
  const consumableCount = 1 + Math.floor(rng() * 2) // 1 rng
  for (let i = 0; i < consumableCount; i++) {
    rng() // item type
    rng() // price
  }
  const hasRelic = rng() < 0.6 // 1 rng for relic check
  if (hasRelic) {
    rng() // relic type
    rng() // relic price
  }
}

/**
 * Simulate the gamble's rng() calls without needing a DOM.
 *
 * From src/ui/gamble.ts:
 *   If player can't afford (chips < 3): 0 rng calls
 *   Otherwise: 2 rng() calls for die1 and die2
 */
function consumeGambleRng(runState: RunState): void {
  if (runState.chips < 3) {
    // Can't afford, no rng consumed
    return
  }
  // Pay entry cost
  runState.spendChips(3)
  // Roll dice
  const die1 = 1 + Math.floor(rng() * 6)
  const die2 = 1 + Math.floor(rng() * 6)
  const sum = die1 + die2
  if (sum > 7) {
    runState.addChips(4 + 3) // win back entry + 4 profit
  }
}

/**
 * Simulate loadNewRound() from BattleUI exactly:
 *   1 rng() for liveCount
 *   1 rng() for blankCount
 *   Chamber constructor: (liveCount+blankCount-1) rng() calls for shuffle
 *   distributeItems(includeAdvanced) for player: 1 rng() for count + count rng() for items
 *   distributeItems(includeAdvanced) for dealer: same
 */
function loadNewRound(
  battle: Battle,
  currentLayer: number,
): Chamber {
  const liveCount = 2 + Math.floor(rng() * 3)
  const blankCount = 2 + Math.floor(rng() * 3)
  const chamber = new Chamber(liveCount, blankCount) // consumes shuffle rng
  battle.loadChamber(chamber)

  const includeAdvanced = currentLayer <= 5
  distributeItems(includeAdvanced) // player items (we ignore the returned items)
  distributeItems(includeAdvanced) // dealer items

  return chamber
}

/**
 * Simulate dealer item usage. In the actual UI (dealerUseItems), the dealer
 * uses items in order: magnifying_glass, handsaw, handcuffs, cigarette, beer.
 * NONE of these consume rng() calls, so we skip this entirely.
 *
 * However, the dealer item usage CAN trigger loadNewRound if beer empties the
 * chamber. For simplicity in our "always shoot opponent" simulation, the player
 * never uses items, and dealer item usage is complex to model perfectly without
 * tracking item lists. Since the task says we can skip dealer item usage for
 * simplicity (no rng consumed), we do that here.
 *
 * NOTE: This means our simulation may diverge from a real UI game if dealer
 * beer usage empties the chamber (triggering a loadNewRound). This is an
 * acceptable simplification.
 */

/**
 * Simulate a full combat encounter.
 * Strategy: "always shoot opponent" for player.
 * Returns 'player' | 'dealer' as the winner.
 */
function simulateCombat(
  runState: RunState,
  dealerType: DealerType,
  dealerHp: number,
): 'player' | 'dealer' {
  const battle = new Battle(runState.playerHp, dealerHp)
  let chamber = loadNewRound(battle, runState.currentLayer)

  let playerLastAction: DealerAction | null = null
  let safetyCounter = 0

  while (battle.winner === null) {
    safetyCounter++
    if (safetyCounter > 500) {
      // Prevent infinite loops from unexpected logic
      throw new Error('Combat simulation exceeded 500 iterations')
    }

    if (battle.currentTurn === 'player') {
      // Player always shoots opponent
      playerLastAction = 'shoot_opponent'
      battle.shootOpponent()

      // Sync HP back to runState
      runState.playerHp = battle.playerHp

      if (battle.winner) break

      // Check reload
      if (battle.needsReload) {
        chamber = loadNewRound(battle, runState.currentLayer)
      }
    } else {
      // Dealer turn
      const action = getDealerAction(
        dealerType,
        chamber.liveCount,
        chamber.blankCount,
        playerLastAction,
      )

      if (action === 'shoot_opponent') {
        battle.shootOpponent()
      } else {
        battle.shootSelf()
      }

      // Sync HP back to runState
      runState.playerHp = battle.playerHp

      if (battle.winner) break

      // Check reload
      if (battle.needsReload) {
        chamber = loadNewRound(battle, runState.currentLayer)
      }
    }
  }

  // finishBattle: if player wins, 1 rng() for chips
  if (battle.winner === 'player') {
    const chipsEarned = 2 + Math.floor(rng() * 4)
    runState.addChips(chipsEarned)
  }

  return battle.winner!
}

/**
 * Simulate a full game run for a given seed.
 * Strategy:
 *   - Always pick the first path option from getPathOptions()
 *   - Always shoot opponent in combat
 *   - No item usage
 *
 * Returns { won: boolean, finalLayer: number, finalHp: number }
 */
function simulateRun(seed: number): {
  won: boolean
  finalLayer: number
  finalHp: number
  causeOfDeath?: string
} {
  seedRng(seed)
  const runState = new RunState()

  while (!runState.isDead && !runState.isVictory) {
    // Map: get path options (consumes rng for non-boss layers)
    const options = runState.getPathOptions()
    const chosen = options[0]

    switch (chosen) {
      case 'combat': {
        // Get dealer type (consumes rng for non-boss, fixed for boss)
        const dealerType = runState.getRandomDealerType()
        const dealerHp = runState.getDealerHp()

        const winner = simulateCombat(runState, dealerType, dealerHp)

        if (winner === 'dealer') {
          return {
            won: false,
            finalLayer: runState.currentLayer,
            finalHp: runState.playerHp,
            causeOfDeath: `Killed by ${dealerType} on layer ${runState.currentLayer}`,
          }
        }

        // Player won: ascend
        runState.ascend()
        break
      }
      case 'rest': {
        // Rest: heal 1, no rng calls
        runState.heal(1)
        // After rest, go back to map (next iteration picks new layer options)
        // But rest doesn't ascend - we need to go to map again for another path
        // Actually looking at main.ts: rest -> showMap (same layer, new path options)
        // So we loop back without ascending
        break
      }
      case 'shop': {
        // Shop: consume the rng calls for generating shop items
        consumeShopRng()
        // Shop doesn't ascend
        break
      }
      case 'gamble': {
        // Gamble: consume rng calls for dice
        consumeGambleRng(runState)
        // Gamble doesn't ascend
        break
      }
    }
  }

  return {
    won: runState.isVictory,
    finalLayer: runState.currentLayer,
    finalHp: runState.playerHp,
  }
}

describe('seed finder', () => {
  it('finds seeds where "always shoot opponent" wins all 7 layers', () => {
    const winners: { seed: number; finalHp: number }[] = []
    const losers: { seed: number; layer: number; cause: string }[] = []

    const MAX_SEED = 10000

    for (let seed = 1; seed <= MAX_SEED; seed++) {
      try {
        const result = simulateRun(seed)
        if (result.won) {
          winners.push({ seed, finalHp: result.finalHp })
        } else {
          losers.push({
            seed,
            layer: result.finalLayer,
            cause: result.causeOfDeath ?? 'unknown',
          })
        }
      } catch (e) {
        losers.push({
          seed,
          layer: -1,
          cause: `Error: ${(e as Error).message}`,
        })
      }
    }

    console.log('\n========== SEED FINDER RESULTS ==========')
    console.log(`Seeds tested: 1 to ${MAX_SEED}`)
    console.log(`Winners: ${winners.length}`)
    console.log(`Losers: ${losers.length}`)

    console.log('\n--- WINNING SEEDS ---')
    for (const w of winners) {
      console.log(`  Seed ${w.seed} -> won with ${w.finalHp} HP remaining`)
    }

    console.log('\n--- FIRST 20 LOSING SEEDS ---')
    for (const l of losers.slice(0, 20)) {
      console.log(`  Seed ${l.seed} -> died on layer ${l.layer} (${l.cause})`)
    }

    // Group losses by layer
    const deathsByLayer: Record<number, number> = {}
    for (const l of losers) {
      deathsByLayer[l.layer] = (deathsByLayer[l.layer] || 0) + 1
    }
    console.log('\n--- DEATHS BY LAYER ---')
    for (const [layer, count] of Object.entries(deathsByLayer).sort(
      (a, b) => Number(a[0]) - Number(b[0]),
    )) {
      console.log(`  Layer ${layer}: ${count} deaths`)
    }

    console.log('\n=========================================\n')

    expect(winners.length).toBeGreaterThan(0)
  })
})
