import type { ThemeData } from '../pinia/store'

// Returns a CSS class name for a theme pill based on its state and selectability.
// Pass selectableKeys=null when no challenger is active (no temp-locking applied).
export function getThemeClass(
  theme: ThemeData,
  playerName: string,
  selectableKeys: Set<string> | null
): string {
  if (theme.isConsumed) return 'consumed'
  if (!theme.isActivated) return 'revival-locked'
  if (selectableKeys !== null && !selectableKeys.has(`${playerName}:${theme.name}`)) return 'temp-locked'
  return ''
}
