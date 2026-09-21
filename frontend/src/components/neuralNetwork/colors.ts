/**
 * One colour language for the whole page: blue is positive (class 1, an excited neuron, a weight that
 * strengthens), orange is negative (class 0, a suppressed neuron, a weight that weakens). Both read
 * on a light and on a dark background, and the strength is carried by opacity, so no theme is needed.
 */
export const POSITIVE_COLOR = '#3b82f6'
export const NEGATIVE_COLOR = '#f97316'

export const signColor = (value: number) => (value >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR)

/** How strong `value` looks, 0..1, where `full` is the magnitude that counts as fully strong. */
export const strength = (value: number, full = 1) => Math.min(1, Math.abs(value) / full)
