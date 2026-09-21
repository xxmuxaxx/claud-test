/** A source of random numbers in [0, 1). Passed in explicitly so tests can make it predictable. */
export type Random = () => number

/** A small seeded generator (mulberry32): the same seed always gives the same sequence. */
export function createRandom(seed: number): Random {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomBetween(random: Random, min: number, max: number): number {
  return min + random() * (max - min)
}

/** A normally distributed number (mean 0, standard deviation 1), by the Box–Muller transform. */
export function randomNormal(random: Random): number {
  const u = 1 - random() // (0, 1], so the logarithm is finite
  const v = random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
