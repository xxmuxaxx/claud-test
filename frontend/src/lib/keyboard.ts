/** Key handlers must not steal keys from text fields. */
export const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/** A focused button or link already turns Space into a click. */
export const isButtonLike = (target: EventTarget | null) =>
  target instanceof HTMLElement && ['BUTTON', 'A'].includes(target.tagName)
