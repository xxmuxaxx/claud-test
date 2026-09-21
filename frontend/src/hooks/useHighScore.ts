import { useEffect, useState } from 'react'

function readHighScore(key: string): number {
  try {
    const value = Number(window.localStorage.getItem(key))
    return Number.isInteger(value) && value > 0 ? value : 0
  } catch {
    return 0 // Storage blocked (private mode, disabled cookies): play without a saved record.
  }
}

function writeHighScore(key: string, value: number) {
  try {
    window.localStorage.setItem(key, String(value))
  } catch {
    // Not persisting the record must never break the game.
  }
}

/** The best score seen so far under `storageKey`, kept in `localStorage` and raised live as `score` grows. */
export function useHighScore(storageKey: string, score: number): number {
  const [highScore, setHighScore] = useState(() => readHighScore(storageKey))

  // Raised during render (React's "adjust state while rendering" pattern) so the new record shows immediately.
  if (score > highScore) setHighScore(score)

  useEffect(() => {
    if (highScore > readHighScore(storageKey)) writeHighScore(storageKey, highScore)
  }, [storageKey, highScore])

  return highScore
}
