function mulberry32(seed: number): () => number {
  let t = seed | 0
  return () => {
    t = (t + 0x6D2B79F5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

let _rng: () => number = Math.random
let _seed: number | null = null

export function seedRng(seed: number): void {
  _seed = seed
  _rng = mulberry32(seed)
}

export function rng(): number {
  return _rng()
}

export function getSeed(): number | null {
  return _seed
}

// Auto-initialize from localStorage if available
try {
  const stored = localStorage.getItem('seed')
  if (stored !== null) {
    const parsed = parseInt(stored, 10)
    if (!isNaN(parsed)) {
      seedRng(parsed)
    }
  }
} catch {
  // localStorage not available (Node.js / vitest)
}
