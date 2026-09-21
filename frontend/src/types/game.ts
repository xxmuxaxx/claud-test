import type { ComponentType } from 'react'
import type { ParseKeys } from 'i18next'

/** Everything the catalog and the router need to know about a game. */
export interface GameDefinition {
  /** URL segment: the game lives at `/games/:id`. */
  id: string
  titleKey: ParseKeys
  descriptionKey: ParseKeys
  /** Small illustration for the catalog card. */
  Preview: ComponentType<{ className?: string }>
  /** The game's page, rendered at `/games/:id`. */
  Page: ComponentType
}
